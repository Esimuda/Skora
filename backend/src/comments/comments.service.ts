import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResultComment } from './comment.entity';
import { UpsertCommentDto } from './dto/upsert-comment.dto';

@Injectable()
export class CommentsService {
  constructor(@InjectRepository(ResultComment) private repo: Repository<ResultComment>) {}

  async upsert(schoolId: string, dto: UpsertCommentDto) {
    const existing = await this.repo.findOne({
      where: { studentId: dto.studentId, classId: dto.classId, term: dto.term, academicYear: dto.academicYear },
    });
    if (existing) {
      const update: Partial<ResultComment> = {};
      if (dto.teacherComment !== undefined) update.teacherComment = dto.teacherComment;
      if (dto.principalComment !== undefined) update.principalComment = dto.principalComment;
      await this.repo.update(existing.id, update);
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
