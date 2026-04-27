import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from './school.entity';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class SchoolsService {
  constructor(
    @InjectRepository(School) private repo: Repository<School>,
    private users: UsersService,
  ) {}

  async create(dto: CreateSchoolDto, principalId: string) {
    const school = await this.repo.save(this.repo.create(dto));
    await this.users.updateSchool(principalId, school.id);
    return school;
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

  assertSchoolAccess(schoolId: string, user: any) {
    if (user.role === 'admin') return;
    if (user.schoolId !== schoolId) throw new ForbiddenException('Access denied');
  }
}
