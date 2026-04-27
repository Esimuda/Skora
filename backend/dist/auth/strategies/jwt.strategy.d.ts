import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private users;
    constructor(config: ConfigService, users: UsersService);
    validate(payload: {
        sub: string;
        email: string;
        role: string;
        schoolId?: string;
    }): Promise<import("../../users/user.entity").User>;
}
export {};
