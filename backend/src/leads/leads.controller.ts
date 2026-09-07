import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { parsePagination } from '../common/helpers/pagination.helper';

@Controller('api/leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60 * 1000 } })
  create(@Body() dto: CreateLeadDto) {
    return this.leadsService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const { page: p, limit: l } = parsePagination(page, limit);
    return this.leadsService.findAll(p, l);
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  markAsRead(@Param('id') id: string) {
    return this.leadsService.markAsRead(id);
  }
}
