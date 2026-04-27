import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Score } from './score.entity';
import { UpsertScoreDto } from './dto/upsert-score.dto';

const GRADING = [
  { grade: 'A1', min: 75, max: 100, remark: 'Excellent' },
  { grade: 'B2', min: 70, max: 74, remark: 'Very Good' },
  { grade: 'B3', min: 65, max: 69, remark: 'Good' },
  { grade: 'C4', min: 60, max: 64, remark: 'Credit' },
  { grade: 'C5', min: 55, max: 59, remark: 'Credit' },
  { grade: 'C6', min: 50, max: 54, remark: 'Credit' },
  { grade: 'D7', min: 45, max: 49, remark: 'Pass' },
  { grade: 'E8', min: 40, max: 44, remark: 'Pass' },
  { grade: 'F9', min: 0, max: 39, remark: 'Fail' },
];

function gradeFor(total: number) {
  return GRADING.find((g) => total >= g.min && total <= g.max) ?? GRADING[GRADING.length - 1];
}

@Injectable()
export class ScoresService {
  constructor(@InjectRepository(Score) private repo: Repository<Score>) {}

  async upsert(schoolId: string, dto: UpsertScoreDto) {
    const total = dto.ca1 + dto.ca2 + dto.exam;
    const { grade, remark } = gradeFor(total);

    const existing = await this.repo.findOne({
      where: { studentId: dto.studentId, subjectId: dto.subjectId, term: dto.term, academicYear: dto.academicYear },
    });

    if (existing) {
      await this.repo.update(existing.id, { ca1: dto.ca1, ca2: dto.ca2, exam: dto.exam, total, grade, remark });
      return this.repo.findOne({ where: { id: existing.id } });
    }

    return this.repo.save(this.repo.create({ ...dto, schoolId, total, grade, remark }));
  }

  async upsertBulk(schoolId: string, scores: UpsertScoreDto[]) {
    return Promise.all(scores.map((s) => this.upsert(schoolId, s)));
  }

  findByClass(schoolId: string, classId: string, term: string, academicYear: string) {
    return this.repo.find({ where: { classId, schoolId, term: term as any, academicYear } });
  }

  findByStudent(schoolId: string, studentId: string, term: string, academicYear: string) {
    return this.repo.find({ where: { studentId, schoolId, term: term as any, academicYear } });
  }

  findBySubject(classId: string, subjectId: string, term: string, academicYear: string) {
    return this.repo.find({ where: { classId, subjectId, term: term as any, academicYear } });
  }
}
