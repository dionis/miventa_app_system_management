import { LicensesService } from '../licenses/licenses.service';
import { LicenseMailService } from '../licenses/mail.service';
import { SmsService } from '../notify/sms.service';
import { TransfermovilService } from '../transfermovil/transfermovil.service';
export declare class PaymentsService {
    private readonly licenses;
    private readonly licenseMail;
    private readonly sms;
    private readonly tmService;
    private readonly logger;
    constructor(licenses: LicensesService, licenseMail: LicenseMailService, sms: SmsService, tmService: TransfermovilService);
    private get supabase();
    private getReferralConfig;
    private findReferrer;
    private newClaimToken;
    private buildOrder;
    createOrder(plan_id: string, authUserId: string, opts?: {
        referral_code?: string;
        contact_channel?: string;
    }): Promise<{
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
    createGuestOrder(dto: {
        plan_id: string;
        email?: string;
        phone?: string;
        contact_channel?: string;
        referral_code?: string;
    }): Promise<{
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
    private checkClaim;
    getPaymentStatus(paymentId: string, authUser?: any): Promise<any>;
    getPublicStatus(paymentId: string, claim: string): Promise<any>;
    findAll(page?: number, limit?: number): Promise<{
        data: any[];
        total: number | null;
        page: number;
        limit: number;
    }>;
    private ensureUserForPayment;
    confirmPayment(paymentId: string): Promise<{
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
    notifyBuyer(paymentId: string, opts: {
        claim?: string;
        email?: string;
        phone?: string;
        channel?: string;
    }, internal?: boolean): Promise<{
        emailed: boolean;
        smsSent: boolean;
        toEmail: any;
        toPhone: any;
        channel: any;
        emailReason: string | undefined;
        smsReason: string | undefined;
    }>;
    updateContact(paymentId: string, dto: {
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
    simulatePayment(paymentId: string, claim?: string): Promise<{
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
    claimAccount(paymentId: string, dto: {
        claim: string;
        password: string;
        full_name?: string;
    }): Promise<{
        claimed: boolean;
    }>;
}
