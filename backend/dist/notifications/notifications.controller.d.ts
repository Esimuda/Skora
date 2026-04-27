import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private service;
    constructor(service: NotificationsService);
    findForUser(user: any): Promise<import("./notification.entity").Notification[]>;
    markRead(id: string): Promise<import("./notification.entity").Notification | null>;
    markAllRead(user: any): Promise<void>;
}
