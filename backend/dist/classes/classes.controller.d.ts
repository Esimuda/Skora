import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
export declare class ClassesController {
    private service;
    constructor(service: ClassesService);
    create(schoolId: string, dto: CreateClassDto): Promise<import("./class.entity").Class>;
    findAll(schoolId: string): Promise<import("./class.entity").Class[]>;
    findOne(schoolId: string, id: string): Promise<import("./class.entity").Class>;
    update(schoolId: string, id: string, dto: UpdateClassDto): Promise<import("./class.entity").Class>;
    remove(schoolId: string, id: string): Promise<void>;
}
