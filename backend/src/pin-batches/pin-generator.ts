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

  // Checks if a plain PIN already exists by comparing against stored bcrypt hashes.
  // This is slow (O(n) bcrypt comparisons) but correct and collision-safe.
  // For production scale (hundreds of PINs per school), this is fine.
  private async isDuplicate(rawPin: string, schoolId: string): Promise<boolean> {
    // Pull all hashed PINs for this school — select: false columns need addSelect
    const existing = await this.repo
      .createQueryBuilder('p')
      .addSelect('p.pin')
      .where('p.schoolId = :schoolId', { schoolId })
      .getMany();

    for (const record of existing) {
      const match = await bcrypt.compare(rawPin, record.pin);
      if (match) return true;
    }
    return false;
  }

  // Generates a unique raw PIN — retries up to 10 times on collision
  private async generateUniqueRawPin(schoolId: string): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
      const raw = this.generateRawPin();
      const duplicate = await this.isDuplicate(raw, schoolId);
      if (!duplicate) return raw;
    }
    throw new Error('PIN generation failed after 10 attempts — please try again');
  }

  // Generates an entire batch of PINs inside a single DB transaction.
  // All PINs are created atomically — if any fail, none are saved.
  async generateBatch(opts: {
    batchId: string;
    schoolId: string;
    quantity: number;
    term: string;
    academicYear: string;
    usesTotal: number;
  }): Promise<{ rawPins: string[] }> {
    const rawPins: string[] = [];

    await this.dataSource.transaction(async (manager) => {
      for (let i = 0; i < opts.quantity; i++) {
        const raw = await this.generateUniqueRawPin(opts.schoolId);
        const hashed = await bcrypt.hash(raw, 10);

        const pin = manager.create(ResultPin, {
          batchId: opts.batchId,
          schoolId: opts.schoolId,
          pin: hashed,
          pinDisplay: raw,
          usesRemaining: opts.usesTotal,
          usesTotal: opts.usesTotal,
          term: opts.term,
          academicYear: opts.academicYear,
          isActive: true,
        });

        await manager.save(ResultPin, pin);
        rawPins.push(raw);
      }
    });

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
  // Returns the matching ResultPin if valid, null otherwise.
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

  // Decrements uses on a validated PIN using a WHERE guard to prevent race conditions.
  // Returns the new usesRemaining value, or -1 if the PIN was already exhausted
  // (another concurrent request consumed the last use simultaneously).
  async consumeUse(pinId: string): Promise<number> {
    // Atomic decrement — only decrements if usesRemaining > 0
    const result = await this.repo
      .createQueryBuilder()
      .update(ResultPin)
      .set({ usesRemaining: () => '"usesRemaining" - 1' })
      .where('id = :pinId', { pinId })
      .andWhere('"usesRemaining" > 0')
      .execute();

    if (result.affected === 0) {
      // Race condition: another request consumed the last use before us
      return -1;
    }

    const updated = await this.repo.findOne({ where: { id: pinId } });
    return updated?.usesRemaining ?? 0;
  }
}