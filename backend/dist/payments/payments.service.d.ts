import { LicensesService } from '../licenses/licenses.service';
export declare class PaymentsService {
    private readonly licenses;
    constructor(licenses: LicensesService);
    private get supabase();
    createOrder(plan_id: string, authUserId: string): Promise<{
        payment_id: any;
        transaction_ref: string;
        amount: any;
        currency: any;
        plan_name: any;
        qr_code: string;
        status: string;
    }>;
    getPaymentStatus(paymentId: string, authUser?: any): Promise<any>;
    findAll(page?: number, limit?: number): Promise<{
        data: any[];
        total: number | null;
        page: number;
        limit: number;
    }>;
    confirmPayment(paymentId: string): Promise<{
        status: string;
        payment_id: string;
        license_key: any;
        license: any;
        reused: boolean;
        licenseError?: undefined;
    } | {
        status: string;
        payment_id: string;
        license_key: any;
        license: any;
        reused?: undefined;
        licenseError?: undefined;
    } | {
        status: string;
        payment_id: string;
        license_key: null;
        licenseError: string;
        license?: undefined;
        reused?: undefined;
    }>;
}
