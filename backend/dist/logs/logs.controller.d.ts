import { LogsService } from './logs.service';
export declare class LogsController {
    private readonly logsService;
    constructor(logsService: LogsService);
    findAll(page?: string, limit?: string, entityType?: string): Promise<{
        data: any[];
        total: number | null;
        page: number;
        limit: number;
    }>;
}
