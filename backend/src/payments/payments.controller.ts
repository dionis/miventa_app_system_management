import { Controller, Post, Get, Param, Body, UseGuards, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('api/payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post('create-order')
    createOrder(@Body() dto: CreateOrderDto) {
        return this.paymentsService.createOrder(dto);
    }

    @Get(':id/status')
    getStatus(@Param('id') id: string) {
        return this.paymentsService.getPaymentStatus(id);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'staff')
    findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
        return this.paymentsService.findAll(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 20,
        );
    }

    // Placeholder webhook/callback endpoint
    @Post(':id/confirm')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    confirmPayment(@Param('id') id: string) {
        return this.paymentsService.confirmPayment(id);
    }
}
