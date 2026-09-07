import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('health')
@Controller('api/health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Liveness probe (sin auth)' })
  check() {
    return {
      status: 'ok',
      uptime_s: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
