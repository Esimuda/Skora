import { Repository } from 'typeorm';
import { Message } from './message.entity';
import { SendMessageDto } from './dto/send-message.dto';
import { UsersService } from '../users/users.service';
export declare class MessagesService {
    private repo;
    private users;
    constructor(repo: Repository<Message>, users: UsersService);
    send(schoolId: string, sender: any, dto: SendMessageDto): Promise<Message>;
    getConversation(schoolId: string, userId: string, otherId: string): Promise<Message[]>;
    getInbox(schoolId: string, userId: string): Promise<Message[]>;
    markRead(schoolId: string, userId: string, senderId: string): Promise<void>;
    countUnread(schoolId: string, userId: string): Promise<number>;
}
