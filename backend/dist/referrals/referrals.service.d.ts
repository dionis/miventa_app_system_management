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
}
