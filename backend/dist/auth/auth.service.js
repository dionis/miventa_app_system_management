"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const users_service_1 = require("../users/users.service");
const jwt_1 = require("@nestjs/jwt");
const supabase_1 = require("../config/supabase");
const mail_service_1 = require("../mail/mail.service");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
function newVerificationToken() {
    const token = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    return { token, hash };
}
let AuthService = class AuthService {
    usersService;
    jwtService;
    config;
    mail;
    constructor(usersService, jwtService, config, mail) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.config = config;
        this.mail = mail;
    }
    async validateUser(email, pass) {
        const normalized = email?.trim().toLowerCase();
        const user = await this.usersService.findByEmail(normalized);
        if (user && (await bcrypt.compare(pass, user.password_hash))) {
            const { password_hash, email_verification_token, ...result } = user;
            return result;
        }
        return null;
    }
    signAccess(user) {
        const payload = { email: user.email, sub: user.id, role: user.role };
        return this.jwtService.sign(payload, {
            secret: this.config.get('JWT_SECRET'),
            expiresIn: this.config.get('JWT_EXPIRES_IN') || '15m',
        });
    }
    signRefresh(user) {
        const refreshSecret = this.config.get('JWT_REFRESH_SECRET') ||
            this.config.get('JWT_SECRET');
        const payload = { sub: user.id, type: 'refresh' };
        return this.jwtService.sign(payload, {
            secret: refreshSecret,
            expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN') || '7d',
        });
    }
    async login(user) {
        return {
            access_token: this.signAccess(user),
            refresh_token: this.signRefresh(user),
            user,
        };
    }
    async refresh(refreshToken) {
        const refreshSecret = this.config.get('JWT_REFRESH_SECRET') ||
            this.config.get('JWT_SECRET');
        try {
            const decoded = this.jwtService.verify(refreshToken, {
                secret: refreshSecret,
            });
            if (decoded?.type !== 'refresh' || !decoded?.sub) {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            const profile = await this.usersService.findOne(decoded.sub);
            return {
                access_token: this.signAccess(profile),
                user: profile,
            };
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async register(userData) {
        const { role: _ignored, ...safe } = userData;
        const fullName = [safe.first_name?.trim(), safe.last_name?.trim()]
            .filter(Boolean)
            .join(' ') || safe.full_name?.trim() || '';
        const { token, hash } = newVerificationToken();
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        let user;
        try {
            user = await this.usersService.create({
                email: safe.email?.trim().toLowerCase(),
                password: safe.password,
                full_name: fullName,
                company: safe.company?.trim() || null,
                phone: safe.phone?.trim() || null,
                secondary_phone: safe.secondary_phone?.trim() || null,
                email_verified: false,
                email_verification_token: hash,
                email_verification_expires: expires,
            });
        }
        catch (err) {
            if (err?.code === '23505')
                throw new common_1.ConflictException('Email already exists');
            throw err;
        }
        const { sent } = await this.mail.sendVerificationEmail(user.email, fullName, token, safe.lang || 'es');
        const session = await this.login(user);
        return { ...session, email_sent: sent };
    }
    async verifyEmail(token) {
        if (!token)
            throw new common_1.BadRequestException('Missing token');
        const hash = crypto.createHash('sha256').update(token).digest('hex');
        const sb = (0, supabase_1.getSupabaseAdmin)();
        const { data, error } = await sb
            .from('profiles')
            .select('id, email_verified, email_verification_expires')
            .eq('email_verification_token', hash)
            .single();
        if (error || !data)
            throw new common_1.BadRequestException('Invalid token');
        if (data.email_verified)
            return { verified: true, already: true };
        if (data.email_verification_expires &&
            new Date(data.email_verification_expires).getTime() < Date.now()) {
            throw new common_1.BadRequestException('Token expired. Request a new email.');
        }
        const { error: upErr } = await sb
            .from('profiles')
            .update({
            email_verified: true,
            email_verification_token: null,
            email_verification_expires: null,
            updated_at: new Date().toISOString(),
        })
            .eq('id', data.id);
        if (upErr)
            throw upErr;
        await sb.from('event_logs').insert({
            actor_id: data.id,
            action: 'email_verified',
            entity_type: 'profile',
            entity_id: data.id,
        });
        return { verified: true };
    }
    async resendVerification(email, lang = 'es') {
        const normalized = email?.trim().toLowerCase();
        if (!normalized)
            throw new common_1.BadRequestException('Email required');
        const sb = (0, supabase_1.getSupabaseAdmin)();
        const { data, error } = await sb
            .from('profiles')
            .select('id, full_name, email_verified')
            .eq('email', normalized)
            .single();
        if (error || !data)
            return { sent: false };
        if (data.email_verified)
            return { sent: false, already: true };
        const { token, hash } = newVerificationToken();
        await sb
            .from('profiles')
            .update({
            email_verification_token: hash,
            email_verification_expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
        })
            .eq('id', data.id);
        const { sent } = await this.mail.sendVerificationEmail(normalized, data.full_name || '', token, lang);
        return { sent };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map