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
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('plans')
@Controller('api/plans')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Listar todos los planes (admin: activos e inactivos, filtro ?tier=normal|premium)' })
  findAll(@Query('tier') tier?: string) {
    return this.plansService.findAllAdmin(tier);
  }

  @Post()
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Crear plan' })
  @ApiResponse({ status: 201, description: 'Plan creado' })
  create(@Body() dto: CreatePlanDto, @Request() req) {
    return this.plansService.create(dto, req.user?.id);
  }

  @Patch(':id')
  @Roles('admin', 'staff')
  @ApiOperation({
    summary: 'Editar plan: precio, servicios (features), etapas y estado',
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePlanDto,
    @Request() req,
  ) {
    return this.plansService.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Eliminar plan sin historial (solo admin)' })
  remove(@Param('id') id: string, @Request() req) {
    return this.plansService.remove(id, req.user?.id);
  }
}
