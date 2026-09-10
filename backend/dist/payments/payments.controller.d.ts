import { PaymentsService } from './payments.service';
import { CreateOrderDto } from './dto/create-order.dto';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    createOrder(dto: CreateOrderDto, req: any): Promise<{
        payment_id: any;
        transaction_ref: string;
        amount: any;
        currency: any;
        plan_name: any;
        qr_code: string;
        status: string;
    }>;
    getStatus(id: string, req: any): Promise<any>;
    findAll(page?: string, limit?: string): Promise<{
        data: any[];
        total: number | null;
        page: number;
        limit: number;
    }>;
    confirmPayment(id: string): Promise<{
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
    webhookConfirm(body: {
        payment_id?: string;
        status?: string;
    }, secret?: string): Promise<{
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
    }> | {
        ignored: boolean;
    };
}
