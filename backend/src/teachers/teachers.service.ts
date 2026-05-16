import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { Teacher } from './teacher.entity';
import { InviteToken } from './invite-token.entity';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { SchoolsService } from '../schools/schools.service';
import { InviteTeacherDto } from './dto/invite-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TeachersService {
  constructor(
    @InjectRepository(Teacher) private repo: Repository<Teacher>,
    @InjectRepository(InviteToken) private tokenRepo: Repository<InviteToken>,
    @InjectDataSource() private dataSource: DataSource,
    private users: UsersService,
    private mail: MailService,
    private schools: SchoolsService,
    private config: ConfigService,
  ) {}

  async invite(schoolId: string, dto: InviteTeacherDto, invitedByUser: any) {
    const existingUser = await this.users.findByEmail(dto.email);

    if (existingUser) {
      // If this user is already a pending teacher at this school, resend the invite
      const existingTeacher = await this.repo.findOne({ where: { email: dto.email, schoolId } });
      if (!existingTeacher || existingTeacher.status !== 'pending') {
        throw new ConflictException('A user with this email already exists');
      }

      // Invalidate old tokens and issue a fresh one
      await this.tokenRepo.delete({ email: dto.email, schoolId });
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await this.tokenRepo.save(this.tokenRepo.create({ token, email: dto.email, schoolId, expiresAt }));

      const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:5173');
      const inviteUrl = `${frontendUrl}/#/accept-invite?token=${token}&email=${encodeURIComponent(dto.email)}`;

      this.schools.findOne(schoolId).catch(() => null).then((schoolRecord) => {
        const schoolName = schoolRecord?.name ?? 'your school';
        this.mail.sendTeacherInvite({
          to: dto.email,
          teacherName: `${existingTeacher.firstName} ${existingTeacher.lastName}`,
          schoolName,
          principalName: `${invitedByUser.firstName} ${invitedByUser.lastName}`,
          inviteUrl,
          temporaryPassword: '(use your existing temporary password)',
        }).catch(() => { /* email failure is non-fatal */ });
      });

      return { teacher: existingTeacher, inviteUrl };
    }

    const password = dto.temporaryPassword ?? this.generateTempPassword();
    const hash = await bcrypt.hash(password, 12);

    const user = await this.users.create({
      email: dto.email,
      password: hash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: 'teacher',
      schoolId,
    });

    const teacher = await this.repo.save(
      this.repo.create({
        userId: user.id,
        schoolId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        classes: [],
        status: 'pending',
      }),
    );

    // Create a signed invite token (valid 7 days)
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.tokenRepo.save(this.tokenRepo.create({ token, email: dto.email, schoolId, expiresAt }));

    const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:5173');
    const inviteUrl = `${frontendUrl}/#/accept-invite?token=${token}&email=${encodeURIComponent(dto.email)}`;

    // Fire-and-forget — don't block the response on email delivery
    this.schools.findOne(schoolId).catch(() => null).then((schoolRecord) => {
      const schoolName = schoolRecord?.name ?? 'your school';
      this.mail.sendTeacherInvite({
        to: dto.email,
        teacherName: `${dto.firstName} ${dto.lastName}`,
        schoolName,
        principalName: `${invitedByUser.firstName} ${invitedByUser.lastName}`,
        inviteUrl,
        temporaryPassword: password,
      }).catch(() => { /* email failure is non-fatal */ });
    });

    return { teacher, inviteUrl };
  }

  async resendInvite(schoolId: string, id: string, invitedByUser: any) {
    const teacher = await this.findOne(schoolId, id);
    if (teacher.status !== 'pending') {
      throw new BadRequestException('Only pending teachers can have their invite resent. Active/inactive teachers should manage their own password.');
    }

    // Rotate the temporary password so the email contains a working credential
    // even if the teacher lost the original message. Invalidate any prior invite
    // tokens for this email + school, then issue a fresh 7-day token.
    const newPassword = this.generateTempPassword();
    await this.users.update(teacher.userId, { password: await bcrypt.hash(newPassword, 12) });
    await this.tokenRepo.delete({ email: teacher.email, schoolId });
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.tokenRepo.save(this.tokenRepo.create({ token, email: teacher.email, schoolId, expiresAt }));

    const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:5173');
    const inviteUrl = `${frontendUrl}/#/accept-invite?token=${token}&email=${encodeURIComponent(teacher.email)}`;
    const schoolRecord = await this.schools.findOne(schoolId).catch(() => null);
    const schoolName = schoolRecord?.name ?? 'your school';

    await this.mail.sendTeacherInvite({
      to: teacher.email,
      teacherName: `${teacher.firstName} ${teacher.lastName}`,
      schoolName,
      principalName: `${invitedByUser.firstName} ${invitedByUser.lastName}`,
      inviteUrl,
      temporaryPassword: newPassword,
    });

    return { teacher, inviteUrl };
  }

  async acceptInvite(token: string) {
    const invite = await this.tokenRepo.findOne({ where: { token } });
    if (!invite || invite.used) throw new BadRequestException('Invalid or already used invite link');
    if (invite.expiresAt < new Date()) throw new BadRequestException('Invite link has expired');

    const teacher = await this.repo.findOne({ where: { email: invite.email, schoolId: invite.schoolId } });
    if (teacher) {
      await this.repo.update(teacher.id, { status: 'active' });
    }
    await this.tokenRepo.update(invite.id, { used: true });

    return { message: 'Invite accepted. You can now log in with your temporary password.' };
  }

  findAll(schoolId: string) {
    return this.repo.find({ where: { schoolId } });
  }

  async findOne(schoolId: string, id: string) {
    const t = await this.repo.findOne({ where: { id, schoolId } });
    if (!t) throw new NotFoundException('Teacher not found');
    return t;
  }

  async update(schoolId: string, id: string, dto: UpdateTeacherDto) {
    await this.findOne(schoolId, id);
    await this.repo.update(id, dto);
    return this.findOne(schoolId, id);
  }

  async activate(schoolId: string, id: string) {
    return this.update(schoolId, id, { status: 'active' });
  }

  async deactivate(schoolId: string, id: string) {
    return this.update(schoolId, id, { status: 'inactive' });
  }

  async remove(schoolId: string, id: string) {
    const t = await this.findOne(schoolId, id);

    // Wipe the teacher account end-to-end so re-login is impossible without
    // a fresh invite: their user row, any pending invite tokens, and any
    // class assignments pointing at them.
    await this.dataSource.transaction(async (manager) => {
      await manager.query(`DELETE FROM "invite_tokens" WHERE "email" = $1 AND "schoolId" = $2`, [t.email, schoolId]);
      await manager.query(
        `UPDATE "classes" SET "teacherId" = NULL, "teacherName" = NULL WHERE "teacherId" = $1 AND "schoolId" = $2`,
        [t.id, schoolId],
      );
      await manager.query(`DELETE FROM "users" WHERE "id" = $1`, [t.userId]);
      await manager.query(`DELETE FROM "teachers" WHERE "id" = $1`, [t.id]);
    });
  }

  private generateTempPassword() {
    return Math.random().toString(36).slice(-8).toUpperCase() + Math.floor(Math.random() * 100);
  }
}
