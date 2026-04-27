import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from './class.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@Injectable()
export class ClassesService {
  constructor(@InjectRepository(Class) private repo: Repository<Class>) {}

  create(schoolId: string, dto: CreateClassDto) {
    return this.repo.save(this.repo.create({ ...dto, schoolId }));
  }

  findAll(schoolId: string) {
    return this.repo.find({ where: { schoolId }, order: { name: 'ASC' } });
  }

  async findOne(schoolId: string, id: string) {
    const c = await this.repo.findOne({ where: { id, schoolId } });
    if (!c) throw new NotFoundException('Class not found');
    return c;
  }

  async update(schoolId: string, id: string, dto: UpdateClassDto) {
    await this.findOne(schoolId, id);
    await this.repo.update(id, dto);
    return this.findOne(schoolId, id);
  }

  async remove(schoolId: string, id: string) {
    const c = await this.findOne(schoolId, id);
    await this.repo.remove(c);
  }

  async incrementStudentCount(classId: string, delta: number) {
    await this.repo.increment({ id: classId }, 'studentCount', delta);
  }
}
