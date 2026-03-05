import { FaqsService } from './faqs.service';
import { CreateFaqDto, UpdateFaqDto } from './dto/faq.dto';
export declare class FaqsController {
    private readonly faqsService;
    constructor(faqsService: FaqsService);
    findAllPublished(): Promise<any[]>;
    findAll(): Promise<any[]>;
    create(dto: CreateFaqDto): Promise<any>;
    update(id: string, dto: UpdateFaqDto): Promise<any>;
    remove(id: string): Promise<{
        deleted: boolean;
    }>;
}
