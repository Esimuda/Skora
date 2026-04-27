import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
export declare class NotificationsService {
    private repo;
    constructor(repo: Repository<Notification>);
    create(data: Partial<Notification>): Promise<Notification>;
    findForUser(schoolId: string, role: string): Promise<Notification[]>;
    markRead(id: string): Promise<Notification | null>;
    markAllRead(schoolId: string, role: string): Promise<void>;
}
