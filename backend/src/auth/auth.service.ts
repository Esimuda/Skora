import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { SchoolsService } from '../schools/schools.service';
import { MailService } from '../mail/mail.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private schools: SchoolsService,
    private jwt: JwtService,
    private config: ConfigService,
    private mail: MailService,
  ) {}

  async signup(dto: SignupDto) {
    const exists = await this.users.findByEmail(dto.email);
    if (exists) throw new ConflictException('Email already registered');

    const hash = await bcrypt.hash(dto.password, 12);

    // Option B super admin detection
    const superAdminEmail = this.config.get<string>('SUPER_ADMIN_EMAIL', '');
    const isSuperAdmin =
      superAdminEmail &&
      dto.email.trim().toLowerCase() === superAdminEmail.trim().toLowerCase();

    const role = isSuperAdmin ? 'super_admin' : (dto.role ?? 'school_admin');

    const user = await this.users.create({ ...dto, password: hash, role });
    return this.buildTokenResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmailWithPassword(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      if (!user.schoolId) {
        throw new UnauthorizedException(
          'This account no longer has an active school. Please register again.',
        );
      }
      const school = await this.schools.findOne(user.schoolId).catch(() => null);
      if (!school) {
        throw new UnauthorizedException(
          'This account no longer has an active school. Please register again.',
        );
      }
    }

    return this.buildTokenResponse(user);
  }

  async forgotPassword(email: string) {
    // Always return the same response regardless of whether email exists —
    // this prevents user enumeration attacks
    const user = await this.users.findByEmail(email);
    if (!user) {
      // Burn equivalent CPU so response time doesn't leak whether the email exists.
      // bcrypt.hash with cost 10 takes ~200-400ms on a typical server.
      await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
      return { message: 'If that email exists, a reset link has been sent.' };
    }

    // Generate a cryptographically random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(rawToken, 10);

    // Token expires in 1 hour
    const expiry = new Date(Date.now() + 60 * 60 * 1000);
    await this.users.setResetToken(user.id, hashedToken, expiry);

    const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:5173');
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

    // Fire and forget — don't block response on email delivery
    this.mail.sendPasswordReset({
      to: user.email,
      firstName: user.firstName,
      resetUrl,
    }).catch(() => {});

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(email: string, token: string, newPassword: string) {
    const user = await this.users.findByEmailWithResetToken(email);
    if (!user || !user.passwordResetToken || !user.passwordResetExpiry) {
      throw new BadRequestException('Invalid or expired reset link.');
    }

    // Check expiry
    if (new Date() > new Date(user.passwordResetExpiry)) {
      await this.users.clearResetToken(user.id);
      throw new BadRequestException('This reset link has expired. Please request a new one.');
    }

    // Validate token
    const tokenValid = await bcrypt.compare(token, user.passwordResetToken);
    if (!tokenValid) {
      throw new BadRequestException('Invalid or expired reset link.');
    }

    // Hash new password and save
    const hashed = await bcrypt.hash(newPassword, 12);
    await this.users.update(user.id, { password: hashed });

    // Invalidate the token so it can't be reused
    await this.users.clearResetToken(user.id);

    return { message: 'Password reset successfully. You can now log in.' };
  }

  private buildTokenResponse(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
    };
    const token = this.jwt.sign(payload);
    const { password: _, ...safe } = user;
    return { access_token: token, user: safe };
  }
}