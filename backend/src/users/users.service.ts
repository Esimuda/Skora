import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  create(data: Partial<User>) {
    return this.repo.save(this.repo.create(data));
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  findByEmailWithPassword(email: string) {
    return this.repo
      .createQueryBuilder('u')
      .addSelect('u.password')
      .where('u.email = :email', { email })
      .getOne();
  }

  findBySchool(schoolId: string) {
    return this.repo.find({ where: { schoolId } });
  }

  async update(id: string, data: Partial<User>) {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async updateSchool(userId: string, schoolId: string) {
    await this.repo.update(userId, { schoolId });
  }

  // Used by forgot-password flow — stores hashed token + expiry
  async setResetToken(userId: string, hashedToken: string, expiry: Date) {
    await this.repo.update(userId, {
      passwordResetToken: hashedToken,
      passwordResetExpiry: expiry,
    });
  }

  // Finds user and exposes the reset token for comparison
  findByEmailWithResetToken(email: string) {
    return this.repo
      .createQueryBuilder('u')
      .addSelect('u.passwordResetToken')
      .addSelect('u.password')
      .where('u.email = :email', { email })
      .getOne();
  }

  // Clears the reset token after use
  async clearResetToken(userId: string) {
    await this.repo.update(userId, {
      passwordResetToken: null as any,
      passwordResetExpiry: null as any,
    });
  }
}