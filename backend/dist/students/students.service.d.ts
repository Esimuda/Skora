import { Repository } from 'typeorm';
import { Student } from './student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { ClassesService } from '../classes/classes.service';
export declare class StudentsService {
    private repo;
    private classes;
    constructor(repo: Repository<Student>, classes: ClassesService);
    create(schoolId: string, classId: string, dto: CreateStudentDto): Promise<Student>;
    findByClass(schoolId: string, classId: string): Promise<Student[]>;
    findOne(schoolId: string, id: string): Promise<Student>;
    update(schoolId: string, id: string, dto: UpdateStudentDto): Promise<Student>;
    remove(schoolId: string, id: string): Promise<void>;
}
