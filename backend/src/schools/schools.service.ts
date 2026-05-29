import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { School } from './school.entity';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class SchoolsService {
  constructor(
    @InjectRepository(School) private repo: Repository<School>,
    @InjectDataSource() private dataSource: DataSource,
    private users: UsersService,
  ) {}

  async create(dto: CreateSchoolDto, principalId: string) {
    const school = await this.repo.save(this.repo.create(dto));
    await this.users.updateSchool(principalId, school.id);
    return school;
  }

  // Returns all schools — used by super admin panel and portal
  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  // Returns school + counts for admin school detail page
  async findOneWithStats(schoolId: string) {
    const school = await this.repo.findOne({ where: { id: schoolId } });
    if (!school) throw new NotFoundException('School not found');

    // Raw counts via query builder for efficiency
    const [teacherCount, classCount, studentCount] = await Promise.all([
      this.repo.manager.count('teachers', {
        where: { schoolId },
      } as any),
      this.repo.manager.count('classes', {
        where: { schoolId },
      } as any),
      this.repo.manager.count('students', {
        where: { schoolId },
      } as any),
    ]);

    return {
      ...school,
      stats: {
        teacherCount,
        classCount,
        studentCount,
      },
    };
  }

  async findOne(id: string) {
    const school = await this.repo.findOne({ where: { id } });
    if (!school) throw new NotFoundException('School not found');
    return school;
  }

  async update(id: string, dto: UpdateSchoolDto, requestingUser: any) {
    this.assertSchoolAccess(id, requestingUser);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string, requestingUser: any) {
    this.assertSchoolAccess(id, requestingUser);
    await this.findOne(id); // 404 if not found
    await this.dataSource.transaction(async (manager) => {
      const q = (table: string) =>
        manager.query(`DELETE FROM "${table}" WHERE "schoolId" = $1`, [id]);
      await q('scores');
      await q('psychometric_assessments');
      await q('result_comments');
      await q('attendance_records');
      await q('class_results');
      await q('students');
      await q('subjects');
      await q('notifications');
      await q('messages');
      await q('invite_tokens');
      await q('teachers');
      await q('classes');
      await manager.query(`DELETE FROM "users" WHERE "schoolId" = $1`, [id]);
      await manager.query(`DELETE FROM "schools" WHERE "id" = $1`, [id]);
    });
  }

  assertSchoolAccess(schoolId: string, user: any) {
    if (user.role === 'admin' || user.role === 'super_admin') return;
    if (user.schoolId !== schoolId) throw new ForbiddenException('Access denied');
  }
}
