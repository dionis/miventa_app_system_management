import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { FaqsService } from './faqs.service';
import { CreateFaqDto, UpdateFaqDto } from './dto/faq.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('api/faqs')
export class FaqsController {
  constructor(private readonly faqsService: FaqsService) {}

  // Public endpoint
  @Get('public')
  findAllPublished() {
    return this.faqsService.findAllPublished();
  }

  // Admin endpoints
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  findAll() {
    return this.faqsService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  create(@Body() dto: CreateFaqDto) {
    return this.faqsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  update(@Param('id') id: string, @Body() dto: UpdateFaqDto) {
    return this.faqsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.faqsService.remove(id);
  }
}
