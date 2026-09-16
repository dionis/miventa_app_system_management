import { PaymentsService } from './payments.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { GuestCreateOrderDto } from './dto/guest-create-order.dto';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    createOrder(dto: CreateOrderDto & {
        referral_code?: string;
    }, req: any): Promise<{
        payment_id: any;
        claim_token: string;
        transaction_ref: string;
        amount: number;
        amount_original: number;
        discount_percent: number;
        currency: any;
        plan_name: any;
        qr_code: string;
        qr_data: any;
        tm_order_id: number;
        status: string;
    }>;
    guestOrder(dto: GuestCreateOrderDto): Promise<{
        payment_id: any;
        claim_token: string;
        transaction_ref: string;
        amount: number;
        amount_original: number;
        discount_percent: number;
        currency: any;
        plan_name: any;
        qr_code: string;
        qr_data: any;
        tm_order_id: number;
        status: string;
    }>;
    getStatus(id: string, req: any): Promise<any>;
    getPublicStatus(id: string, claim?: string): Promise<any>;
    notify(id: string, body: {
        claim?: string;
        email?: string;
        phone?: string;
        channel?: string;
    }): Promise<{
        emailed: boolean;
        smsSent: boolean;
        toEmail: any;
        toPhone: any;
        channel: any;
        emailReason: string | undefined;
        smsReason: string | undefined;
    }>;
    claimAccount(id: string, body: {
        claim?: string;
        password?: string;
        full_name?: string;
    }): Promise<{
        claimed: boolean;
    }>;
    updateContact(id: string, body: {
        claim?: string;
        email?: string;
        phone?: string;
        channel?: string;
    }): Promise<{
        id: any;
        status: any;
        guest_email: any;
        guest_phone: any;
        contact_channel: any;
        referral_code: any;
        discount_percent: any;
        amount: any;
        amount_original: any;
        currency: any;
        transaction_ref: any;
    }>;
    simulate(id: string, body: {
        claim?: string;
    }): Promise<{
        status: string;
        payment_id: string;
        license_key: any;
        license: any;
        reused: boolean;
        licenseError?: undefined;
        licenseReason?: undefined;
        user_id?: undefined;
        account_created?: undefined;
    } | {
        status: string;
        payment_id: string;
        license_key: null;
        licenseError: string;
        licenseReason: any;
        user_id: string | null;
        license?: undefined;
        reused?: undefined;
        account_created?: undefined;
    } | {
        status: string;
        payment_id: string;
        license_key: any;
        license: any;
        user_id: string | null;
        account_created: boolean;
        reused?: undefined;
        licenseError?: undefined;
        licenseReason?: undefined;
    }>;
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
        licenseReason?: undefined;
        user_id?: undefined;
        account_created?: undefined;
    } | {
        status: string;
        payment_id: string;
        license_key: null;
        licenseError: string;
        licenseReason: any;
        user_id: string | null;
        license?: undefined;
        reused?: undefined;
        account_created?: undefined;
    } | {
        status: string;
        payment_id: string;
        license_key: any;
        license: any;
        user_id: string | null;
        account_created: boolean;
        reused?: undefined;
        licenseError?: undefined;
        licenseReason?: undefined;
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
        licenseReason?: undefined;
        user_id?: undefined;
        account_created?: undefined;
    } | {
        status: string;
        payment_id: string;
        license_key: null;
        licenseError: string;
        licenseReason: any;
        user_id: string | null;
        license?: undefined;
        reused?: undefined;
        account_created?: undefined;
    } | {
        status: string;
        payment_id: string;
        license_key: any;
        license: any;
        user_id: string | null;
        account_created: boolean;
        reused?: undefined;
        licenseError?: undefined;
        licenseReason?: undefined;
    }> | {
        ignored: boolean;
    };
}
