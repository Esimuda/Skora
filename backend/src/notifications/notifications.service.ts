import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationsService {
  constructor(@InjectRepository(Notification) private repo: Repository<Notification>) {}

  create(data: Partial<Notification>) {
    return this.repo.save(this.repo.create(data));
  }

  findForUser(schoolId: string, role: string) {
    return this.repo.find({
      where: { schoolId, toUserRole: role as any },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markRead(id: string) {
    const n = await this.repo.findOne({ where: { id } });
    if (!n) throw new NotFoundException('Notification not found');
    await this.repo.update(id, { isRead: true });
    return this.repo.findOne({ where: { id } });
  }

  async markAllRead(schoolId: string, role: string) {
    await this.repo.update({ schoolId, toUserRole: role as any, isRead: false }, { isRead: true });
  }
}
