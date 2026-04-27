import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { ClassesService } from '../classes/classes.service';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student) private repo: Repository<Student>,
    private classes: ClassesService,
  ) {}

  async create(schoolId: string, classId: string, dto: CreateStudentDto) {
    await this.classes.findOne(schoolId, classId);
    const exists = await this.repo.findOne({ where: { schoolId, admissionNumber: dto.admissionNumber } });
    if (exists) throw new ConflictException('Admission number already exists in this school');

    const student = await this.repo.save(this.repo.create({ ...dto, classId, schoolId }));
    await this.classes.incrementStudentCount(classId, 1);
    return student;
  }

  findByClass(schoolId: string, classId: string) {
    return this.repo.find({ where: { classId, schoolId }, order: { lastName: 'ASC' } });
  }

  async findOne(schoolId: string, id: string) {
    const s = await this.repo.findOne({ where: { id, schoolId } });
    if (!s) throw new NotFoundException('Student not found');
    return s;
  }

  async update(schoolId: string, id: string, dto: UpdateStudentDto) {
    await this.findOne(schoolId, id);
    await this.repo.update(id, dto);
    return this.findOne(schoolId, id);
  }

  async remove(schoolId: string, id: string) {
    const s = await this.findOne(schoolId, id);
    await this.repo.remove(s);
    await this.classes.incrementStudentCount(s.classId, -1);
  }
}
