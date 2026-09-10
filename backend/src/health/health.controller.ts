import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { getSupabaseAdmin } from '../config/supabase';

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

  /**
   * Diagnóstico de conectividad con Supabase (sin exponer secretos).
   * Úsalo cuando veas "fetch failed" o "[object Object]":
   *   GET http://localhost:3000/api/health/db
   */
  @Get('db')
  @ApiOperation({ summary: 'Chequeo de conexión a Supabase (sin auth)' })
  async db() {
    const url = process.env.SUPABASE_URL || '';
    let host = '';
    try {
      host = new URL(url).host;
    } catch {
      host = 'INVALID_URL';
    }
    const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
    try {
      const sb = getSupabaseAdmin();
      const { error } = await sb.from('plans').select('id').limit(1);
      if (error) {
        return {
          status: 'error',
          host,
          hasServiceKey,
          code: (error as any)?.code || null,
          message: (error as any)?.message || 'supabase error',
          hint: (error as any)?.hint || null,
          fix: 'Si code=PGRST205 o "Could not find the table": falta ejecutar database/schema.sql. Si 401/403: SERVICE_ROLE_KEY incorrecta.',
        };
      }
      return { status: 'ok', host, hasServiceKey };
    } catch (e: any) {
      return {
        status: 'error',
        host,
        hasServiceKey,
        message: e?.message || String(e),
        cause: e?.cause ? String(e.cause).slice(0, 500) : null,
        fix: 'Si "fetch failed": SUPABASE_URL incorrecta, proyecto pausado, o sin internet/firewall. Verifica la URL en Supabase Settings.',
      };
    }
  }
}
