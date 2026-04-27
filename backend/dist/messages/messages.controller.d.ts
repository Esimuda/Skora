import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
export declare class MessagesController {
    private service;
    constructor(service: MessagesService);
    send(schoolId: string, user: any, dto: SendMessageDto): Promise<import("./message.entity").Message>;
    inbox(schoolId: string, user: any): Promise<import("./message.entity").Message[]>;
    unreadCount(schoolId: string, user: any): Promise<number>;
    conversation(schoolId: string, partnerId: string, user: any): Promise<import("./message.entity").Message[]>;
    markRead(schoolId: string, partnerId: string, user: any): Promise<void>;
}
