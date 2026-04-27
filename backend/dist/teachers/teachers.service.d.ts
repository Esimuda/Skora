import { Repository } from 'typeorm';
import { Teacher } from './teacher.entity';
import { InviteToken } from './invite-token.entity';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { InviteTeacherDto } from './dto/invite-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { ConfigService } from '@nestjs/config';
export declare class TeachersService {
    private repo;
    private tokenRepo;
    private users;
    private mail;
    private config;
    constructor(repo: Repository<Teacher>, tokenRepo: Repository<InviteToken>, users: UsersService, mail: MailService, config: ConfigService);
    invite(schoolId: string, dto: InviteTeacherDto, invitedByUser: any): Promise<{
        teacher: Teacher;
        inviteUrl: string;
    }>;
    acceptInvite(token: string): Promise<{
        message: string;
    }>;
    findAll(schoolId: string): Promise<Teacher[]>;
    findOne(schoolId: string, id: string): Promise<Teacher>;
    update(schoolId: string, id: string, dto: UpdateTeacherDto): Promise<Teacher>;
    activate(schoolId: string, id: string): Promise<Teacher>;
    deactivate(schoolId: string, id: string): Promise<Teacher>;
    remove(schoolId: string, id: string): Promise<void>;
    private generateTempPassword;
}
