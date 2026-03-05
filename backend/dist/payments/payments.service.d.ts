import { CreateOrderDto } from './dto/create-order.dto';
export declare class PaymentsService {
    private get supabase();
    createOrder(dto: CreateOrderDto): Promise<{
        payment_id: any;
        transaction_ref: string;
        amount: any;
        currency: any;
        plan_name: any;
        qr_code: string;
        status: string;
    }>;
    getPaymentStatus(paymentId: string): Promise<any>;
    findAll(page?: number, limit?: number): Promise<{
        data: any[];
        total: number | null;
        page: number;
        limit: number;
    }>;
    confirmPayment(paymentId: string): Promise<{
        status: string;
        payment_id: string;
    }>;
}
