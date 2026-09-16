import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(cookieParser());

  // CORS desde env (coma-separado). credentials:true para cookies httpOnly.
  const origins = (
    process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000'
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins, credentials: true });

  // Global validation pipe (class-validator)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  // P1: OpenAPI en /api/docs (deshabilitar en prod si se desea con env)
  if (process.env.NODE_ENV !== 'production' || process.env.SWAGGER === '1') {
    const config = new DocumentBuilder()
      .setTitle('MiVenta API')
      .setDescription(`
# MiVenta SaaS Management API

## Autenticación
- **JWT Access Token**: 15 min, en header \`Authorization: Bearer <token>\`
- **Refresh Token**: 7 días, en cookie httpOnly \`refresh_token\`

## Pagos Transfermóvil & Enzona

### Flujo de Pago (Guest / Autenticado)
1. **POST /api/payments/guest-order** o **POST /api/payments/create-order** → Crea orden + QR firmado
2. **POST /api/payments/{id}/tm/initiate** → Envía a Transfermóvil WS, retorna QR TM + tm_order_id
3. **GET /api/payments/{id}/public-status?claim=xxx** → Polling estado (guest, sin JWT)
4. **Webhook POST /api/payments/webhook/tm/notification** → TM notifica completion (header \`x-tm-secret\`)
5. **POST /api/payments/{id}/notify** → Reenviar licencia por email/SMS

### Testing Transfermóvil
- Usa \`VITE_PAYMENT_SIMULATE=true\` en frontend para demo (simula cobro a los 7s)
- En staging: configurar \`TM_MERCHANT_NOTIFY_URL\` con ngrok/VPN IP directa
- Webhook requiere header \`x-tm-secret\` = \`PAYMENTS_WEBHOOK_SECRET\`

### Devoluciones
- **POST /api/payments/{id}/tm/refund** (admin) → Solicita refund en TM
- **Webhook POST /api/payments/webhook/tm/refund** → TM notifica resultado refund
      `)
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('payments', 'Gestión de pagos y suscripciones (guest + auth)')
      .addTag('transfermovil', 'Integración Transfermóvil WS External Payment')
      .addTag('webhooks', 'Notificaciones de pasarelas (sin JWT, con header x-tm-secret)')
      .addTag('auth', 'Autenticación JWT + cookies httpOnly')
      .addTag('users', 'Gestión de usuarios y perfiles')
      .addTag('plans', 'Planes de suscripción')
      .addTag('licenses', 'Licencias POS')
      .addTag('referrals', 'Sistema de referidos')
      .build();
    const doc = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, doc);
  }

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  console.log(`Backend running on port ${port}`);
}
void bootstrap();
