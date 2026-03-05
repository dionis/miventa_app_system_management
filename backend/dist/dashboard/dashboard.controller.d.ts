import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
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
