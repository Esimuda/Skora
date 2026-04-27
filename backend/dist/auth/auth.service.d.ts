import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private users;
    private jwt;
    constructor(users: UsersService, jwt: JwtService);
    signup(dto: SignupDto): Promise<{
        access_token: string;
        user: any;
    }>;
    login(dto: LoginDto): Promise<{
        access_token: string;
        user: any;
    }>;
    private buildTokenResponse;
}
