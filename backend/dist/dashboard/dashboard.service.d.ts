export declare function invalidateDashboardCache(): void;
export declare class DashboardService {
    private get supabase();
    getStats(): Promise<any>;
    getPlans(): Promise<any[]>;
}
