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
    const classRecord = await this.classes.findOne(schoolId, classId);

    let admissionNumber = dto.admissionNumber?.trim();

    if (!admissionNumber) {
      // Auto-generate: fetch existing students sorted alphabetically,
      // insert the new student into that order, assign a serial number.
      admissionNumber = await this.generateAdmissionNumber(
        schoolId,
        classId,
        classRecord.name,
        dto.firstName,
        dto.lastName,
      );
    } else {
      // Only check for duplicates when a number was explicitly provided
      const exists = await this.repo.findOne({ where: { schoolId, admissionNumber } });
      if (exists) throw new ConflictException('Admission number already exists in this school');
    }

    const student = await this.repo.save(
      this.repo.create({ ...dto, admissionNumber, classId, schoolId }),
    );
    await this.classes.incrementStudentCount(classId, 1);
    return student;
  }

  private async generateAdmissionNumber(
    schoolId: string,
    classId: string,
    className: string,
    newFirstName: string,
    newLastName: string,
  ): Promise<string> {
    // Fetch all existing students in the class, sorted by lastName then firstName
    const existing = await this.repo.find({
      where: { classId, schoolId },
      order: { lastName: 'ASC', firstName: 'ASC' },
    });

    // Build a clean prefix from the class name: "JSS 1A" → "JSS1A"
    const prefix = className.replace(/\s+/g, '').toUpperCase();

    // The new student's total position after sorting into the existing list
    // determines their serial number. We add them into the sorted list and
    // find their 1-based index.
    const allNames = [
      ...existing.map((s) => ({ lastName: s.lastName, firstName: s.firstName })),
      { lastName: newLastName, firstName: newFirstName },
    ].sort((a, b) => {
      const last = a.lastName.localeCompare(b.lastName, 'en', { sensitivity: 'base' });
      if (last !== 0) return last;
      return a.firstName.localeCompare(b.firstName, 'en', { sensitivity: 'base' });
    });

    const position =
      allNames.findIndex(
        (n) =>
          n.lastName.toLowerCase() === newLastName.toLowerCase() &&
          n.firstName.toLowerCase() === newFirstName.toLowerCase(),
      ) + 1;

    // Zero-pad to 3 digits: 001, 002, ... 999
    const serial = String(position).padStart(3, '0');
    return `${prefix}/${serial}`;
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