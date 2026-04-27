import { Repository } from 'typeorm';
import { User } from './user.entity';
export declare class UsersService {
    private repo;
    constructor(repo: Repository<User>);
    create(data: Partial<User>): Promise<User>;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByEmailWithPassword(email: string): Promise<User | null>;
    findBySchool(schoolId: string): Promise<User[]>;
    update(id: string, data: Partial<User>): Promise<User | null>;
    updateSchool(userId: string, schoolId: string): Promise<void>;
}
