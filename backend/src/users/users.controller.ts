import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { parsePagination } from '../common/helpers/pagination.helper';

@Controller('api/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'staff')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const { page: p, limit: l } = parsePagination(page, limit);
    return this.usersService.findAll(p, l, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
