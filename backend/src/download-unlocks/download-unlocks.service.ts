import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DownloadUnlock } from './download-unlock.entity';
import { RequestDownloadUnlockDto } from './dto/request-download-unlock.dto';
import { ActivateDownloadUnlockDto } from './dto/activate-download-unlock.dto';
import { SchoolsService } from '../schools/schools.service';
import { MailService } from '../mail/mail.service';
import { Class } from '../classes/class.entity';
import { Student } from '../students/student.entity';

// Pricing constants (Naira)
const PER_CLASS_UNIT_PRICE  = 1_000;   // ₦1,000 per student when downloading one class
const WHOLE_SCHOOL_UNIT_PRICE = 700;   // ₦700  per student when downloading entire school (discount)

@Injectable()
export class DownloadUnlocksService {
  constructor(
    @InjectRepository(DownloadUnlock) private repo: Repository<DownloadUnlock>,
    @InjectRepository(Class)          private classRepo: Repository<Class>,
    @InjectRepository(Student)        private studentRepo: Repository<Student>,
    private schools: SchoolsService,
    private mail: MailService,
  ) {}

  // ── Principal: request a download unlock ─────────────────────────────────

  async requestUnlock(
    schoolId: string,
    dto: RequestDownloadUnlockDto,
    principalUser: any,
  ): Promise<DownloadUnlock> {
    const school = await this.schools.findOne(schoolId);
    if (!school) throw new NotFoundException('School not found');

    if (dto.scope === 'class' && !dto.classId) {
      throw new BadRequestException('classId is required when scope is "class"');
    }

    // Prevent duplicate pending requests for the same scope/term
    const existing = await this.repo.findOne({
      where: {
        schoolId,
        term: dto.term,
        academicYear: dto.academicYear,
        scope: dto.scope,
        ...(dto.scope === 'class' ? { classId: dto.classId } : {}),
        status: 'pending_payment',
      },
    });
    if (existing) {
      throw new BadRequestException(
        'A download unlock request for this term is already pending. Please wait for activation or contact Skora support.',
      );
    }

    // Also block if already active for this scope/term
    const alreadyActive = await this.checkUnlock(
      schoolId, dto.term, dto.academicYear, dto.scope, dto.classId,
    );
    if (alreadyActive) {
      throw new BadRequestException(
        'Downloads are already unlocked for this term. You can download freely from the Downloads page.',
      );
    }

    let studentCount = 0;
    let className: string | null = null;

    if (dto.scope === 'class') {
      const cls = await this.classRepo.findOne({
        where: { id: dto.classId!, schoolId },
      });
      if (!cls) throw new NotFoundException('Class not found');
      studentCount = cls.studentCount;
      className = cls.name;
    } else {
      // Whole school — count all students across all classes
      studentCount = await this.studentRepo.count({ where: { schoolId } });
    }

    if (studentCount === 0) {
      throw new BadRequestException(
        'No students found. Please add students before requesting a download unlock.',
      );
    }

    const unitPrice = dto.scope === 'school' ? WHOLE_SCHOOL_UNIT_PRICE : PER_CLASS_UNIT_PRICE;
    const totalAmount = studentCount * unitPrice;

    const unlock = await this.repo.save(
      this.repo.create({
        schoolId,
        schoolName: school.name,
        principalName: `${principalUser.firstName} ${principalUser.lastName}`,
        principalEmail: principalUser.email,
        term: dto.term,
        academicYear: dto.academicYear,
        scope: dto.scope,
        classId: dto.classId ?? null,
        className,
        studentCount,
        unitPrice,
        totalAmount,
        status: 'pending_payment',
      }),
    );

    // Notify admin
    this.mail.sendDownloadUnlockRequestNotification({
      schoolName: school.name,
      principalName: unlock.principalName,
      principalEmail: unlock.principalEmail,
      scope: dto.scope,
      className,
      studentCount,
      totalAmount,
      term: dto.term,
      academicYear: dto.academicYear,
    }).catch(() => {});

    return unlock;
  }

  // ── Super Admin: activate an unlock after confirming payment ──────────────

  async activateUnlock(
    unlockId: string,
    dto: ActivateDownloadUnlockDto,
    adminUser: any,
  ): Promise<DownloadUnlock> {
    const unlock = await this.repo.findOne({ where: { id: unlockId } });
    if (!unlock) throw new NotFoundException('Download unlock not found');
    if (unlock.status !== 'pending_payment') {
      throw new BadRequestException('This unlock has already been activated');
    }

    await this.repo.update(unlockId, {
      status: 'active',
      paymentReference: dto.paymentReference,
      notes: dto.notes,
      activatedAt: new Date(),
      activatedBy: adminUser.id,
    });

    // Notify principal
    this.mail.sendDownloadUnlockActivatedNotification({
      to: unlock.principalEmail,
      principalName: unlock.principalName,
      schoolName: unlock.schoolName,
      scope: unlock.scope,
      className: unlock.className,
      term: unlock.term,
      academicYear: unlock.academicYear,
    }).catch(() => {});

    return (await this.repo.findOne({ where: { id: unlockId } }))!;
  }

  // ── Principal: check if a specific scope/term is unlocked ────────────────
  // Used by the frontend to decide whether to show the download button or the
  // "request unlock" panel.

  async checkUnlock(
    schoolId: string,
    term: string,
    academicYear: string,
    scope: 'class' | 'school',
    classId?: string | null,
  ): Promise<DownloadUnlock | null> {
    // A 'school' scope unlock covers all classes — so check that first
    const schoolUnlock = await this.repo.findOne({
      where: { schoolId, term, academicYear, scope: 'school', status: 'active' },
    });
    if (schoolUnlock) return schoolUnlock;

    // If requesting a class-level check, look for a class-specific unlock too
    if (scope === 'class' && classId) {
      const classUnlock = await this.repo.findOne({
        where: { schoolId, term, academicYear, scope: 'class', classId, status: 'active' },
      });
      if (classUnlock) return classUnlock;
    }

    return null;
  }

  // ── Principal: get all their unlock records ───────────────────────────────

  findBySchool(schoolId: string): Promise<DownloadUnlock[]> {
    return this.repo.find({
      where: { schoolId },
      order: { requestedAt: 'DESC' },
    });
  }

  // ── Super Admin: get all unlock requests ─────────────────────────────────

  findAll(): Promise<DownloadUnlock[]> {
    return this.repo.find({ order: { requestedAt: 'DESC' } });
  }

  // ── Super Admin: pending count for dashboard badge ────────────────────────

  async getPendingCount(): Promise<number> {
    return this.repo.count({ where: { status: 'pending_payment' } });
  }
}
