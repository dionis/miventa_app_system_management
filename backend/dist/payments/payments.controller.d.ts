import { PaymentsService } from './payments.service';
import { CreateOrderDto } from './dto/create-order.dto';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    createOrder(dto: CreateOrderDto): Promise<{
        payment_id: any;
        transaction_ref: string;
        amount: any;
        currency: any;
        plan_name: any;
        qr_code: string;
        status: string;
    }>;
    getStatus(id: string): Promise<any>;
    findAll(page?: string, limit?: string): Promise<{
        data: any[];
        total: number | null;
        page: number;
        limit: number;
    }>;
    confirmPayment(id: string): Promise<{
        status: string;
        payment_id: string;
    }>;
}
