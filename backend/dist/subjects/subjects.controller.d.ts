import { SubjectsService, UpdateSubjectDto } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
export declare class SubjectsController {
    private service;
    constructor(service: SubjectsService);
    create(schoolId: string, classId: string, dto: CreateSubjectDto): Promise<import("./subject.entity").Subject>;
    findAll(schoolId: string, classId: string): Promise<import("./subject.entity").Subject[]>;
    update(schoolId: string, id: string, dto: UpdateSubjectDto): Promise<import("./subject.entity").Subject>;
    remove(schoolId: string, id: string): Promise<void>;
}
