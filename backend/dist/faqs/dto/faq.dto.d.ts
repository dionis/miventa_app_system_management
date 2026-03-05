export declare class CreateFaqDto {
    question: string;
    answer: string;
    sort_order?: number;
    is_published?: boolean;
}
export declare class UpdateFaqDto {
    question?: string;
    answer?: string;
    sort_order?: number;
    is_published?: boolean;
}
