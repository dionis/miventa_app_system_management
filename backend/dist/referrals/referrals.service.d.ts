import { CreateReferrerDto, UpdateReferrerDto } from './dto/referrer.dto';
export declare class ReferralsService {
    private get supabase();
    private generateReferralCode;
    create(dto: CreateReferrerDto): Promise<any>;
    findAll(page?: number, limit?: number, search?: string): Promise<{
        data: any[];
        total: number | null;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<any>;
    update(id: string, dto: UpdateReferrerDto): Promise<any>;
    remove(id: string): Promise<{
        deleted: boolean;
    }>;
    getConfig(): Promise<{
        referral_discount_percent: number;
        referral_commission_percent: number;
    }>;
    updateConfig(dto: {
        referral_discount_percent?: number;
        referral_commission_percent?: number;
    }): Promise<{
        referral_discount_percent: number;
        referral_commission_percent: number;
    }>;
    validateCode(raw: string): Promise<{
        valid: boolean;
        referral_code: any;
        referrer_name: any;
        discount_percent: number;
    }>;
}
