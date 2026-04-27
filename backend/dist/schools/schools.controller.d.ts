import { SchoolsService } from './schools.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
export declare class SchoolsController {
    private service;
    constructor(service: SchoolsService);
    create(dto: CreateSchoolDto, user: any): Promise<import("./school.entity").School>;
    findOne(id: string, user: any): Promise<import("./school.entity").School>;
    update(id: string, dto: UpdateSchoolDto, user: any): Promise<import("./school.entity").School>;
}
