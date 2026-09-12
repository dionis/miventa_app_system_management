import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
export declare class AuthService {
    private usersService;
    private jwtService;
    private config;
    private mail;
    constructor(usersService: UsersService, jwtService: JwtService, config: ConfigService, mail: MailService);
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
        email_sent: boolean;
        access_token: string;
        refresh_token: string;
        user: any;
    }>;
    verifyEmail(token: string): Promise<{
        verified: boolean;
        already: boolean;
    } | {
        verified: boolean;
        already?: undefined;
    }>;
    resendVerification(email: string, lang?: string): Promise<{
        sent: boolean;
        already?: undefined;
    } | {
        sent: boolean;
        already: boolean;
    }>;
}
