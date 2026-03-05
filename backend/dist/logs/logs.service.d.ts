export declare class LogsService {
    private get supabase();
    findAll(page?: number, limit?: number, entityType?: string): Promise<{
        data: any[];
        total: number | null;
        page: number;
        limit: number;
    }>;
}
