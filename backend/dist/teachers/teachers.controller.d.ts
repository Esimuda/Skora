import { TeachersService } from './teachers.service';
import { InviteTeacherDto } from './dto/invite-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
export declare class TeachersController {
    private service;
    constructor(service: TeachersService);
    invite(schoolId: string, dto: InviteTeacherDto, user: any): Promise<{
        teacher: import("./teacher.entity").Teacher;
        inviteUrl: string;
    }>;
    findAll(schoolId: string): Promise<import("./teacher.entity").Teacher[]>;
    findOne(schoolId: string, id: string): Promise<import("./teacher.entity").Teacher>;
    update(schoolId: string, id: string, dto: UpdateTeacherDto): Promise<import("./teacher.entity").Teacher>;
    activate(schoolId: string, id: string): Promise<import("./teacher.entity").Teacher>;
    deactivate(schoolId: string, id: string): Promise<import("./teacher.entity").Teacher>;
    remove(schoolId: string, id: string): Promise<void>;
}
