import { ConfigService } from '@nestjs/config';
export declare class MailService {
    private config;
    private transporter;
    private readonly logger;
    constructor(config: ConfigService);
    sendTeacherInvite(opts: {
        to: string;
        teacherName: string;
        schoolName: string;
        principalName: string;
        inviteUrl: string;
        temporaryPassword: string;
    }): Promise<void>;
    sendResultSubmittedAlert(opts: {
        to: string;
        principalName: string;
        teacherName: string;
        className: string;
        term: string;
        academicYear: string;
        appUrl: string;
        message?: string;
    }): Promise<void>;
    sendResultDecisionAlert(opts: {
        to: string;
        teacherName: string;
        className: string;
        term: string;
        decision: 'approved' | 'rejected';
        reason?: string;
        principalNote?: string;
        appUrl: string;
    }): Promise<void>;
}
