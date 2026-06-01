import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PinBatch } from './pin-batch.entity';
import { ResultPin } from './result-pin.entity';
import { PinUse } from './pin-use.entity';
import { PinGenerator } from './pin-generator';
import { RequestBatchDto } from './dto/request-batch.dto';
import { ActivateBatchDto } from './dto/activate-batch.dto';
import { MailService } from '../mail/mail.service';
import { SchoolsService } from '../schools/schools.service';

@Injectable()
export class PinBatchesService {
  constructor(
    @InjectRepository(PinBatch) private batchRepo: Repository<PinBatch>,
    @InjectRepository(ResultPin) private pinRepo: Repository<ResultPin>,
    @InjectRepository(PinUse) private useRepo: Repository<PinUse>,
    private generator: PinGenerator,
    private mail: MailService,
    private schools: SchoolsService,
  ) {}

  // ── Principal: request a new batch ───────────────────────────────────────

  async requestBatch(
    schoolId: string,
    dto: RequestBatchDto,
    principalUser: any,
  ): Promise<PinBatch> {
    const school = await this.schools.findOne(schoolId);
    if (!school) throw new NotFoundException('School not found');

    const UNIT_PRICE = 1000;

    const batch = await this.batchRepo.save(
      this.batchRepo.create({
        schoolId,
        schoolName: school.name,
        principalName: `${principalUser.firstName} ${principalUser.lastName}`,
        principalEmail: principalUser.email,
        quantity: dto.quantity,
        usesPerPin: 5,
        unitPrice: UNIT_PRICE,
        totalAmount: dto.quantity * UNIT_PRICE,
        status: 'pending_payment',
        term: dto.term,
        academicYear: dto.academicYear,
      }),
    );

    // Notify super admin via email
    this.mail.sendBatchRequestNotification({
      schoolName: school.name,
      principalName: batch.principalName,
      principalEmail: batch.principalEmail,
      quantity: dto.quantity,
      totalAmount: batch.totalAmount,
      term: dto.term,
      academicYear: dto.academicYear,
    }).catch(() => {});

    return batch;
  }

  // ── Super Admin: activate a batch after payment confirmed ─────────────────

  async activateBatch(
    batchId: string,
    dto: ActivateBatchDto,
    adminUser: any,
  ): Promise<PinBatch> {
    const batch = await this.batchRepo.findOne({ where: { id: batchId } });
    if (!batch) throw new NotFoundException('Batch not found');
    if (batch.status !== 'pending_payment') {
      throw new BadRequestException('This batch has already been activated');
    }

    // Generate all PINs atomically
    await this.generator.generateBatch({
      batchId: batch.id,
      schoolId: batch.schoolId,
      quantity: batch.quantity,
      term: batch.term,
      academicYear: batch.academicYear,
      usesTotal: batch.usesPerPin,
    });

    // Update batch status
    await this.batchRepo.update(batchId, {
      status: 'active',
      paymentReference: dto.paymentReference,
      notes: dto.notes,
      activatedAt: new Date(),
      activatedBy: adminUser.id,
    });

    const updated = await this.batchRepo.findOne({ where: { id: batchId } });

    // Notify principal that their batch is ready
    this.mail.sendBatchActivatedNotification({
      to: batch.principalEmail,
      principalName: batch.principalName,
      schoolName: batch.schoolName,
      quantity: batch.quantity,
      term: batch.term,
      academicYear: batch.academicYear,
    }).catch(() => {});

    return updated!;
  }

  // ── Principal: get their batches ──────────────────────────────────────────

  findBySchool(schoolId: string): Promise<PinBatch[]> {
    return this.batchRepo.find({
      where: { schoolId },
      order: { requestedAt: 'DESC' },
    });
  }

  // ── Principal: get batch stats for dashboard widget ───────────────────────

  async getBatchStats(
    schoolId: string,
    term: string,
    academicYear: string,
  ): Promise<{
    hasActiveBatch: boolean;
    totalPins: number;
    usedPins: number;
    unusedPins: number;
    exhaustedPins: number;
  }> {
    const batch = await this.batchRepo.findOne({
      where: { schoolId, term, academicYear, status: 'active' },
    });

    if (!batch) {
      return { hasActiveBatch: false, totalPins: 0, usedPins: 0, unusedPins: 0, exhaustedPins: 0 };
    }

    const pins = await this.pinRepo.find({ where: { batchId: batch.id } });

    const totalPins = pins.length;
    const exhaustedPins = pins.filter((p) => p.usesRemaining === 0).length;
    const usedPins = pins.filter((p) => p.usesRemaining < p.usesTotal && p.usesRemaining > 0).length;
    const unusedPins = pins.filter((p) => p.usesRemaining === p.usesTotal).length;

    return { hasActiveBatch: true, totalPins, usedPins, unusedPins, exhaustedPins };
  }

  // ── Super Admin: get all batches ──────────────────────────────────────────

  findAll(): Promise<PinBatch[]> {
    return this.batchRepo.find({ order: { requestedAt: 'DESC' } });
  }

  // ── Super Admin: platform-wide summary stats ──────────────────────────────

  async getSummary(): Promise<{
    pending: number;
    active: number;
    totalPinsIssued: number;
    totalPinsUsed: number;
  }> {
    const allBatches = await this.batchRepo.find();
    const allPins = await this.pinRepo.find();

    const pending = allBatches.filter((b) => b.status === 'pending_payment').length;
    const active = allBatches.filter((b) => b.status === 'active').length;
    const totalPinsIssued = allPins.length;
    const totalPinsUsed = allPins.filter((p) => p.usesRemaining < p.usesTotal).length;

    return { pending, active, totalPinsIssued, totalPinsUsed };
  }

  // ── Super Admin: revenue breakdown per school ─────────────────────────────

  async getRevenueBreakdown(): Promise<{
      schoolId: string;
      schoolName: string;
      batchesCount: number;
      totalPinsIssued: number;
      totalPinsUsed: number;
      totalRevenue: number;
      lastBatchDate: string;
    }[]> {
    const batches = await this.batchRepo.find({
      where: { status: 'active' },
      order: { requestedAt: 'DESC' },
    });

    const pins = await this.pinRepo.find();

    const map = new Map<string, any>();
    for (const batch of batches) {
      if (!map.has(batch.schoolId)) {
        map.set(batch.schoolId, {
          schoolId: batch.schoolId,
          schoolName: batch.schoolName,
          batchesCount: 0,
          totalPinsIssued: 0,
          totalPinsUsed: 0,
          totalRevenue: 0,
          lastBatchDate: batch.requestedAt,
        });
      }
      const entry = map.get(batch.schoolId);
      entry.batchesCount += 1;
      entry.totalRevenue += batch.totalAmount;
      if (new Date(batch.requestedAt) > new Date(entry.lastBatchDate)) {
        entry.lastBatchDate = batch.requestedAt;
      }
    }

    for (const pin of pins) {
      const entry = map.get(pin.schoolId);
      if (!entry) continue;
      entry.totalPinsIssued += 1;
      if (pin.usesRemaining < pin.usesTotal) entry.totalPinsUsed += 1;
    }

    return Array.from(map.values());
  }

  // ── Portal: get raw pins for PDF generation ───────────────────────────────

  async getRawPinsForBatch(batchId: string, schoolId: string): Promise<string[]> {
    const batch = await this.batchRepo.findOne({ where: { id: batchId, schoolId } });
    if (!batch) throw new NotFoundException('Batch not found');
    if (batch.status !== 'active') throw new BadRequestException('Batch is not active');

    const pins = await this.pinRepo
      .createQueryBuilder('p')
      .addSelect('p.pinDisplay')
      .where('p.batchId = :batchId', { batchId })
      .getMany();

    const rawPins = pins.map((p) => p.pinDisplay).filter(Boolean);

    if (rawPins.length === 0) {
      throw new BadRequestException(
        'PIN display values have already been cleared. Cards were already downloaded for this batch.',
      );
    }

    // Clear pinDisplay after retrieval — plain PINs no longer stored
    await this.generator.clearPinDisplay(batchId);

    return rawPins;
  }

  // ── Portal: validate a PIN submitted by a parent ──────────────────────────

  async validateAndConsumePin(opts: {
    schoolId: string;
    rawPin: string;
    studentId: string;
    studentName: string;
    admissionNumber: string;
    term: string;
    academicYear: string;
    ipAddress: string;
  }): Promise<{ valid: boolean; usesRemaining?: number; reason?: string }> {
    const pin = await this.generator.validatePin({
      schoolId: opts.schoolId,
      rawPin: opts.rawPin,
      term: opts.term,
      academicYear: opts.academicYear,
    });

    if (!pin) {
      return {
        valid: false,
        reason: 'Invalid PIN. Please check your scratch card and try again.',
      };
    }

    // Atomic consume — handles race conditions
    const usesRemaining = await this.generator.consumeUse(pin.id);

    if (usesRemaining === -1) {
      // Another concurrent request consumed the last use — treat as exhausted
      return {
        valid: false,
        reason: 'This PIN has been fully used. Please use a different scratch card.',
      };
    }

    // Log the use
    await this.useRepo.save(
      this.useRepo.create({
        pinId: pin.id,
        schoolId: opts.schoolId,
        studentId: opts.studentId,
        studentName: opts.studentName,
        admissionNumber: opts.admissionNumber,
        term: opts.term,
        academicYear: opts.academicYear,
        ipAddress: opts.ipAddress,
      }),
    );

    // Check if batch should be marked exhausted
    await this.checkAndUpdateBatchStatus(pin.batchId);

    return { valid: true, usesRemaining };
  }

  private async checkAndUpdateBatchStatus(batchId: string): Promise<void> {
    const pins = await this.pinRepo.find({ where: { batchId } });
    const allExhausted = pins.every((p) => p.usesRemaining === 0);
    if (allExhausted) {
      await this.batchRepo.update(batchId, { status: 'exhausted' });
    }
  }
}