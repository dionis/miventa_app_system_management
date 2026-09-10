import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

function toLogText(err: any): string {
  if (!err) return 'unknown error';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  // Supabase/postgrest devuelve objetos {message, code, details, hint}
  try {
    const parts = [
      err.message,
      err.code ? `code=${err.code}` : null,
      err.details ? `details=${err.details}` : null,
      err.hint ? `hint=${err.hint}` : null,
      err.status ? `status=${err.status}` : null,
    ].filter(Boolean);
    if (parts.length) return parts.join(' | ');
    return JSON.stringify(err).slice(0, 2000);
  } catch {
    return String(err);
  }
}

/**
 * Evita filtrar detalles internos (Supabase/Postgres) al cliente.
 * Loguea el error real en servidor y devuelve mensaje genérico.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let clientMessage = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      // HttpException ya es segura: propagar mensaje pero sin stack
      clientMessage =
        typeof body === 'string'
          ? body
          : (body as any)?.message || exception.message;
    } else {
      // Error crudo (Supabase, Postgres, QR, etc.): NO exponer al cliente,
      // pero SÍ loguearlo legible (antes salía "[object Object]").
      const err: any = exception;
      this.logger.error(`${req.method} ${req.url} -> ${toLogText(err)}`);
      if (err?.stack) this.logger.debug(String(err.stack).slice(0, 2000));
      // Mapear códigos Postgres conocidos a respuestas seguras
      if (err?.code === '23505') {
        status = HttpStatus.CONFLICT;
        clientMessage = 'Resource already exists';
      } else if (err?.code === 'PGRST116') {
        status = HttpStatus.NOT_FOUND;
        clientMessage = 'Resource not found';
      } else if (err?.message === 'fetch failed' || err?.cause) {
        clientMessage = 'Database unreachable (check SUPABASE_URL/keys)';
      }
    }

    res.status(status).json({
      statusCode: status,
      message: clientMessage,
      path: req.url,
      timestamp: new Date().toISOString(),
    });
  }
}
