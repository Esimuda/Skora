import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private users: UsersService, private jwt: JwtService) {}

  async signup(dto: SignupDto) {
    const exists = await this.users.findByEmail(dto.email);
    if (exists) throw new ConflictException('Email already registered');

    const hash = await bcrypt.hash(dto.password, 12);
    const user = await this.users.create({ ...dto, password: hash });
    return this.buildTokenResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmailWithPassword(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.buildTokenResponse(user);
  }

  private buildTokenResponse(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role, schoolId: user.schoolId };
    const token = this.jwt.sign(payload);
    const { password: _, ...safe } = user;
    return { access_token: token, user: safe };
  }
}
