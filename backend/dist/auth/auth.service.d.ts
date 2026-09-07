import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private usersService;
    private jwtService;
    private config;
    constructor(usersService: UsersService, jwtService: JwtService, config: ConfigService);
    validateUser(email: string, pass: string): Promise<any>;
    private signAccess;
    private signRefresh;
    login(user: any): Promise<{
        access_token: string;
        refresh_token: string;
        user: any;
    }>;
    refresh(refreshToken: string): Promise<{
        access_token: string;
        user: any;
    }>;
    register(userData: any): Promise<{
        access_token: string;
        refresh_token: string;
        user: any;
    }>;
}
