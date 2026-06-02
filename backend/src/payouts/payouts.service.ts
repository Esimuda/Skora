import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payout } from './payout.entity';
import { SchoolsService } from '../schools/schools.service';

@Injectable()
export class PayoutsService {
  constructor(
    @InjectRepository(Payout) private repo: Repository<Payout>,
    private schools: SchoolsService,
  ) {}

  async create(
    dto: {
      schoolId: string;
      amount: number;
      bankName?: string;
      accountNumber?: string;
      accountName?: string;
      reference: string;
      notes?: string;
    },
    adminUser: any,
  ): Promise<Payout> {
    const school = await this.schools.findOne(dto.schoolId);
    if (!school) throw new NotFoundException('School not found');

    return this.repo.save(
      this.repo.create({
        schoolId: dto.schoolId,
        schoolName: school.name,
        amount: dto.amount,
        bankName: dto.bankName,
        accountNumber: dto.accountNumber,
        accountName: dto.accountName,
        reference: dto.reference,
        notes: dto.notes,
        processedBy: adminUser.id,
      }),
    );
  }

  findAll(): Promise<Payout[]> {
    return this.repo.find({ order: { processedAt: 'DESC' } });
  }

  findBySchool(schoolId: string): Promise<Payout[]> {
    return this.repo.find({
      where: { schoolId },
      order: { processedAt: 'DESC' },
    });
  }
}