import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { TeachersService } from '../teachers/teachers.service';
export declare class AuthController {
    private auth;
    private teachers;
    constructor(auth: AuthService, teachers: TeachersService);
    signup(dto: SignupDto): Promise<{
        access_token: string;
        user: any;
    }>;
    login(dto: LoginDto): Promise<{
        access_token: string;
        user: any;
    }>;
    acceptInvite(token: string): Promise<{
        message: string;
    }>;
    me(user: any): any;
}
