import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { CreateReferrerDto, UpdateReferrerDto } from './dto/referrer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { parsePagination } from '../common/helpers/pagination.helper';

@Controller('api/referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  // Validación pública del código (checkout guest, sin login)
  @Get('validate/:code')
  validate(@Param('code') code: string) {
    return this.referralsService.validateCode(code);
  }

  @Get('config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  getConfig() {
    return this.referralsService.getConfig();
  }

  @Patch('config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateConfig(@Body() dto: { referral_discount_percent?: number; referral_commission_percent?: number }) {
    return this.referralsService.updateConfig(dto);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  create(@Body() dto: CreateReferrerDto) {
    return this.referralsService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const { page: p, limit: l } = parsePagination(page, limit);
    return this.referralsService.findAll(p, l, search);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  findOne(@Param('id') id: string) {
    return this.referralsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  update(@Param('id') id: string, @Body() dto: UpdateReferrerDto) {
    return this.referralsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  remove(@Param('id') id: string) {
    return this.referralsService.remove(id);
  }
}
