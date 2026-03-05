import { ReferralsService } from './referrals.service';
import { CreateReferrerDto, UpdateReferrerDto } from './dto/referrer.dto';
export declare class ReferralsController {
    private readonly referralsService;
    constructor(referralsService: ReferralsService);
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
