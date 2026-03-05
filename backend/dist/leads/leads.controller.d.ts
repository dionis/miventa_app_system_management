import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
export declare class LeadsController {
    private readonly leadsService;
    constructor(leadsService: LeadsService);
    create(dto: CreateLeadDto): Promise<any>;
    findAll(page?: string, limit?: string): Promise<{
        data: any[];
        total: number | null;
        page: number;
        limit: number;
    }>;
    markAsRead(id: string): Promise<any>;
}
