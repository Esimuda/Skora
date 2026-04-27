import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
export declare class StudentsController {
    private service;
    constructor(service: StudentsService);
    create(schoolId: string, classId: string, dto: CreateStudentDto): Promise<import("./student.entity").Student>;
    findAll(schoolId: string, classId: string): Promise<import("./student.entity").Student[]>;
    findOne(schoolId: string, id: string): Promise<import("./student.entity").Student>;
    update(schoolId: string, id: string, dto: UpdateStudentDto): Promise<import("./student.entity").Student>;
    remove(schoolId: string, id: string): Promise<void>;
}
