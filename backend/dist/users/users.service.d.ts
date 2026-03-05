export declare class UsersService {
    private get supabase();
    findAll(page?: number, limit?: number, search?: string): Promise<{
        data: any[];
        total: number | null;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<any>;
}
