import { Repository } from 'typeorm';
import { School } from './school.entity';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { UsersService } from '../users/users.service';
export declare class SchoolsService {
    private repo;
    private users;
    constructor(repo: Repository<School>, users: UsersService);
    create(dto: CreateSchoolDto, principalId: string): Promise<School>;
    findOne(id: string): Promise<School>;
    update(id: string, dto: UpdateSchoolDto, requestingUser: any): Promise<School>;
    assertSchoolAccess(schoolId: string, user: any): void;
}
