import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Or, Equal } from 'typeorm';
import { Message } from './message.entity';
import { SendMessageDto } from './dto/send-message.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message) private repo: Repository<Message>,
    private users: UsersService,
  ) {}

  async send(schoolId: string, sender: any, dto: SendMessageDto) {
    const recipient = await this.users.findById(dto.recipientId);
    if (!recipient) throw new NotFoundException('Recipient not found');

    return this.repo.save(
      this.repo.create({
        schoolId,
        senderId: sender.id,
        senderName: `${sender.firstName} ${sender.lastName}`,
        senderRole: sender.role,
        recipientId: dto.recipientId,
        recipientName: `${recipient.firstName} ${recipient.lastName}`,
        recipientRole: recipient.role,
        content: dto.content,
        classId: dto.classId,
        className: dto.className,
      }),
    );
  }

  // Returns the full conversation thread between two users
  getConversation(schoolId: string, userId: string, otherId: string) {
    return this.repo.find({
      where: [
        { schoolId, senderId: userId, recipientId: otherId },
        { schoolId, senderId: otherId, recipientId: userId },
      ],
      order: { createdAt: 'ASC' },
    });
  }

  // Returns the inbox: all unique threads for a user (latest message per thread)
  async getInbox(schoolId: string, userId: string) {
    // Get all messages where user is sender or recipient
    const all = await this.repo.find({
      where: [
        { schoolId, senderId: userId },
        { schoolId, recipientId: userId },
      ],
      order: { createdAt: 'DESC' },
    });

    // Deduplicate by conversation partner
    const threads = new Map<string, Message>();
    for (const msg of all) {
      const partnerId = msg.senderId === userId ? msg.recipientId : msg.senderId;
      if (!threads.has(partnerId)) threads.set(partnerId, msg);
    }

    return Array.from(threads.values());
  }

  async markRead(schoolId: string, userId: string, senderId: string) {
    await this.repo
      .createQueryBuilder()
      .update(Message)
      .set({ isRead: true })
      .where('schoolId = :schoolId AND senderId = :senderId AND recipientId = :userId AND isRead = false', {
        schoolId,
        senderId,
        userId,
      })
      .execute();
  }

  countUnread(schoolId: string, userId: string) {
    return this.repo.count({ where: { schoolId, recipientId: userId, isRead: false } });
  }
}
