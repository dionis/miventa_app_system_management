import { CreateFaqDto, UpdateFaqDto } from './dto/faq.dto';
export declare class FaqsService {
    private get supabase();
    findAllPublished(): Promise<any[]>;
    findAll(): Promise<any[]>;
    create(dto: CreateFaqDto): Promise<any>;
    update(id: string, dto: UpdateFaqDto): Promise<any>;
    remove(id: string): Promise<{
        deleted: boolean;
    }>;
}
