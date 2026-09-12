import type { Response } from 'express';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
export declare class AuthController {
    private authService;
    private usersService;
    constructor(authService: AuthService, usersService: UsersService);
    login(dto: LoginDto, res: Response): Promise<{
        access_token: string;
        refresh_token: string;
        user: any;
    }>;
    register(dto: RegisterDto, res: Response): Promise<{
        email_sent: boolean;
        access_token: string;
        refresh_token: string;
        user: any;
    }>;
    refresh(body: {
        refresh_token?: string;
    }, req: any, res: Response): Promise<{
        access_token: string;
        user: any;
    }>;
    logout(res: Response): Promise<{
        logged_out: boolean;
    }>;
    verifyEmail(token: string): Promise<{
        verified: boolean;
        already: boolean;
    } | {
        verified: boolean;
        already?: undefined;
    }>;
    resendVerification(body: {
        email?: string;
        lang?: string;
    }): Promise<{
        sent: boolean;
        already?: undefined;
    } | {
        sent: boolean;
        already: boolean;
    }>;
    getProfile(req: any): Promise<any>;
}
