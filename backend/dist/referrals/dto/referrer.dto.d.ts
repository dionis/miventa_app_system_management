export declare class CreateReferrerDto {
    full_name: string;
    email: string;
    phone?: string;
    bank_account_number?: string;
    bank_name?: string;
}
export declare class UpdateReferrerDto {
    full_name?: string;
    email?: string;
    phone?: string;
    bank_account_number?: string;
    bank_name?: string;
    is_active?: boolean;
}
