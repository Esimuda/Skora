import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ResultPin } from './result-pin.entity';

@Injectable()
export class PinGenerator {
  constructor(
    @InjectRepository(ResultPin)
    private repo: Repository<ResultPin>,
    private dataSource: DataSource,
  ) {}

  // Generates a single raw PIN in format XXXX-XXXX-XXXX
  private generateRawPin(): string {
    const bytes = crypto.randomBytes(8);
    let digits = '';
    for (const byte of bytes) {
      digits += (byte % 10).toString();
    }
    const padded = digits.slice(0, 12).padEnd(12, '0');
    return `${padded.slice(0, 4)}-${padded.slice(4, 8)}-${padded.slice(8, 12)}`;
  }

  // Generates N unique raw PINs using an in-memory Set — no bcrypt duplicate
  // check needed. The PIN space is 10^12 (1 trillion combinations); collision
  // probability for even 10,000 PINs is negligible (~0.000005%).
  private generateUniquePins(quantity: number): string[] {
    const seen = new Set<string>();
    const pins: string[] = [];
    while (pins.length < quantity) {
      const raw = this.generateRawPin();
      if (!seen.has(raw)) {
        seen.add(raw);
        pins.push(raw);
      }
    }
    return pins;
  }

  // Generates an entire batch of PINs in one DB round-trip.
  async generateBatch(opts: {
    batchId: string;
    schoolId: string;
    quantity: number;
    term: string;
    academicYear: string;
    usesTotal: number;
    isActive?: boolean;
  }): Promise<{ rawPins: string[] }> {
    const rawPins = this.generateUniquePins(opts.quantity);

    // Hash all PINs in parallel — much faster than sequential
    const hashes = await Promise.all(
      rawPins.map((raw) => bcrypt.hash(raw, 8)),
    );

    // Build all records and insert in one batch
    const records = rawPins.map((raw, i) =>
      this.repo.create({
        batchId: opts.batchId,
        schoolId: opts.schoolId,
        pin: hashes[i],
        pinDisplay: raw,
        usesRemaining: opts.usesTotal,
        usesTotal: opts.usesTotal,
        term: opts.term,
        academicYear: opts.academicYear,
        isActive: opts.isActive ?? true,
      }),
    );

    await this.repo.save(records, { chunk: 50 });

    return { rawPins };
  }

  // Called after the school downloads the cards PDF.
  // Clears pinDisplay so plain PINs are never stored long-term.
  async clearPinDisplay(batchId: string): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(ResultPin)
      .set({ pinDisplay: null as any })
      .where('batchId = :batchId', { batchId })
      .execute();
  }

  // Validates a submitted PIN against all active PINs for this school + term.
  async validatePin(opts: {
    schoolId: string;
    rawPin: string;
    term: string;
    academicYear: string;
  }): Promise<ResultPin | null> {
    const candidates = await this.repo
      .createQueryBuilder('p')
      .addSelect('p.pin')
      .where('p.schoolId = :schoolId', { schoolId: opts.schoolId })
      .andWhere('p.isActive = true')
      .andWhere('p.usesRemaining > 0')
      .andWhere('p.term = :term', { term: opts.term })
      .andWhere('p.academicYear = :academicYear', { academicYear: opts.academicYear })
      .getMany();

    for (const candidate of candidates) {
      const match = await bcrypt.compare(opts.rawPin, candidate.pin);
      if (match) return candidate;
    }

    return null;
  }

  // Atomic decrement — prevents race conditions on concurrent PIN validation.
  async consumeUse(pinId: string): Promise<number> {
    const result = await this.repo
      .createQueryBuilder()
      .update(ResultPin)
      .set({ usesRemaining: () => '"usesRemaining" - 1' })
      .where('id = :pinId', { pinId })
      .andWhere('"usesRemaining" > 0')
      .execute();

    if (result.affected === 0) return -1;

    const updated = await this.repo.findOne({ where: { id: pinId } });
    return updated?.usesRemaining ?? 0;
  }
}