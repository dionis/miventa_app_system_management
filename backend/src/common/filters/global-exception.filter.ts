import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

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
      // Error crudo (Supabase, Postgres, QR, etc.): NO exponer
      const err: any = exception;
      this.logger.error(
        `${req.method} ${req.url} -> ${err?.message || err}`,
        err?.stack,
      );
      // Mapear códigos Postgres conocidos a respuestas seguras
      if (err?.code === '23505') {
        status = HttpStatus.CONFLICT;
        clientMessage = 'Resource already exists';
      } else if (err?.code === 'PGRST116') {
        status = HttpStatus.NOT_FOUND;
        clientMessage = 'Resource not found';
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
