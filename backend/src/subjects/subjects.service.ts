import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from './subject.entity';
import { CreateSubjectDto } from './dto/create-subject.dto';

export class UpdateSubjectDto extends CreateSubjectDto {}

@Injectable()
export class SubjectsService {
  constructor(@InjectRepository(Subject) private repo: Repository<Subject>) {}

  create(schoolId: string, classId: string, dto: CreateSubjectDto) {
    return this.repo.save(this.repo.create({ ...dto, classId, schoolId }));
  }

  findAll(schoolId: string, classId: string) {
    return this.repo.find({ where: { classId, schoolId }, order: { name: 'ASC' } });
  }

  async findOne(schoolId: string, id: string) {
    const s = await this.repo.findOne({ where: { id, schoolId } });
    if (!s) throw new NotFoundException('Subject not found');
    return s;
  }

  async update(schoolId: string, id: string, dto: UpdateSubjectDto) {
    await this.findOne(schoolId, id);
    await this.repo.update(id, dto);
    return this.findOne(schoolId, id);
  }

  async remove(schoolId: string, id: string) {
    const s = await this.findOne(schoolId, id);
    await this.repo.remove(s);
  }
}
