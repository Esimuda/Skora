import { Repository } from 'typeorm';
import { Class } from './class.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
export declare class ClassesService {
    private repo;
    constructor(repo: Repository<Class>);
    create(schoolId: string, dto: CreateClassDto): Promise<Class>;
    findAll(schoolId: string): Promise<Class[]>;
    findOne(schoolId: string, id: string): Promise<Class>;
    update(schoolId: string, id: string, dto: UpdateClassDto): Promise<Class>;
    remove(schoolId: string, id: string): Promise<void>;
    incrementStudentCount(classId: string, delta: number): Promise<void>;
}
