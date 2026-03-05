export declare class DashboardService {
    private get supabase();
    getStats(): Promise<{
        totalSales: number;
        totalTransactions: number;
        activeSubscriptions: number;
        totalUsers: number;
        activeReferrers: number;
        totalReferrals: any;
        pendingPayments: number;
        unreadLeads: number;
        monthlySales: {
            month: string;
            sales: number;
            transactions: number;
        }[];
    }>;
    getPlans(): Promise<any[]>;
}
