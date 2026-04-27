import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PsychometricAssessment } from './psychometric-assessment.entity';
import { UpsertPsychometricDto } from './dto/upsert-psychometric.dto';

export const DEFAULT_PSYCHOMETRIC_SKILLS = [
  { id: 'ps1', name: 'Punctuality', category: 'affective' },
  { id: 'ps2', name: 'Attentiveness', category: 'affective' },
  { id: 'ps3', name: 'Obedience', category: 'affective' },
  { id: 'ps4', name: 'Resilience', category: 'affective' },
  { id: 'ps5', name: 'Teamwork', category: 'affective' },
  { id: 'ps6', name: 'Neatness', category: 'affective' },
  { id: 'ps7', name: 'Honesty', category: 'affective' },
  { id: 'ps8', name: 'Leadership', category: 'affective' },
  { id: 'ps9', name: 'Handwriting', category: 'psychomotor' },
  { id: 'ps10', name: 'Drawing/Art', category: 'psychomotor' },
  { id: 'ps11', name: 'Sports/Games', category: 'psychomotor' },
  { id: 'ps12', name: 'Practical Skills', category: 'psychomotor' },
];

@Injectable()
export class PsychometricService {
  constructor(@InjectRepository(PsychometricAssessment) private repo: Repository<PsychometricAssessment>) {}

  getSkills() {
    return DEFAULT_PSYCHOMETRIC_SKILLS;
  }

  async upsert(schoolId: string, dto: UpsertPsychometricDto) {
    const existing = await this.repo.findOne({
      where: { studentId: dto.studentId, classId: dto.classId, term: dto.term, academicYear: dto.academicYear },
    });
    if (existing) {
      await this.repo.update(existing.id, { ratings: dto.ratings });
      return this.repo.findOne({ where: { id: existing.id } });
    }
    return this.repo.save(this.repo.create({ ...dto, schoolId }));
  }

  findByClass(schoolId: string, classId: string, term: string, academicYear: string) {
    return this.repo.find({ where: { classId, schoolId, term: term as any, academicYear } });
  }

  findByStudent(schoolId: string, studentId: string, term: string, academicYear: string) {
    return this.repo.find({ where: { studentId, schoolId, term: term as any, academicYear } });
  }
}
