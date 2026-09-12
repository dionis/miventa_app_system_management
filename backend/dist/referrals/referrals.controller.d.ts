import { ReferralsService } from './referrals.service';
import { CreateReferrerDto, UpdateReferrerDto } from './dto/referrer.dto';
export declare class ReferralsController {
    private readonly referralsService;
    constructor(referralsService: ReferralsService);
    validate(code: string): Promise<{
        valid: boolean;
        referral_code: any;
        referrer_name: any;
        discount_percent: number;
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
    create(dto: CreateReferrerDto): Promise<any>;
    findAll(page?: string, limit?: string, search?: string): Promise<{
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
}
