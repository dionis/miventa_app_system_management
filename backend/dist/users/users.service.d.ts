export declare class UsersService {
    private get supabase();
    findAll(page?: number, limit?: number, search?: string): Promise<{
        data: any[];
        total: number | null;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<any>;
    findByEmail(email: string): Promise<any>;
    create(userData: any): Promise<any>;
}
