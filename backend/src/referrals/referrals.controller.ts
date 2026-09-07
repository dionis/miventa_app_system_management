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
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'staff')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Post()
  create(@Body() dto: CreateReferrerDto) {
    return this.referralsService.create(dto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const { page: p, limit: l } = parsePagination(page, limit);
    return this.referralsService.findAll(p, l, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.referralsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReferrerDto) {
    return this.referralsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.referralsService.remove(id);
  }
}
