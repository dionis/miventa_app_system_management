import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LogsService } from './logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('api/logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class LogsController {
    constructor(private readonly logsService: LogsService) { }

    @Get()
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('entity_type') entityType?: string,
    ) {
        return this.logsService.findAll(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 50,
            entityType,
        );
    }
}
