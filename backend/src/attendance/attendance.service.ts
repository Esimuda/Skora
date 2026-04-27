import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceRecord } from './attendance.entity';
import { UpsertAttendanceDto } from './dto/upsert-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(@InjectRepository(AttendanceRecord) private repo: Repository<AttendanceRecord>) {}

  async upsert(schoolId: string, dto: UpsertAttendanceDto) {
    const existing = await this.repo.findOne({
      where: { studentId: dto.studentId, classId: dto.classId, term: dto.term, academicYear: dto.academicYear },
    });
    if (existing) {
      await this.repo.update(existing.id, { daysSchoolOpened: dto.daysSchoolOpened, daysPresent: dto.daysPresent });
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
