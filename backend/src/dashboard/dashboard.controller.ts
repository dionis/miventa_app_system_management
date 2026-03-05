import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('api/dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('stats')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'staff')
    getStats() {
        return this.dashboardService.getStats();
    }

    // Public plans endpoint for the landing page
    @Get('plans')
    getPlans() {
        return this.dashboardService.getPlans();
    }
}
