import { CreateLeadDto } from './dto/create-lead.dto';
export declare class LeadsService {
    private get supabase();
    create(dto: CreateLeadDto): Promise<any>;
    findAll(page?: number, limit?: number): Promise<{
        data: any[];
        total: number | null;
        page: number;
        limit: number;
    }>;
    markAsRead(id: string): Promise<any>;
}
