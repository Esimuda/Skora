import { Repository } from 'typeorm';
import { Subject } from './subject.entity';
import { CreateSubjectDto } from './dto/create-subject.dto';
export declare class UpdateSubjectDto extends CreateSubjectDto {
}
export declare class SubjectsService {
    private repo;
    constructor(repo: Repository<Subject>);
    create(schoolId: string, classId: string, dto: CreateSubjectDto): Promise<Subject>;
    findAll(schoolId: string, classId: string): Promise<Subject[]>;
    findOne(schoolId: string, id: string): Promise<Subject>;
    update(schoolId: string, id: string, dto: UpdateSubjectDto): Promise<Subject>;
    remove(schoolId: string, id: string): Promise<void>;
}
