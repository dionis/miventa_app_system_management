import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LogsService } from './logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { parsePagination } from '../common/helpers/pagination.helper';

@Controller('api/logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('entity_type') entityType?: string,
  ) {
    const { page: p, limit: l } = parsePagination(page, limit, 50);
    return this.logsService.findAll(p, l, entityType);
  }
}
