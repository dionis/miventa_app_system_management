"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app_module_1 = require("./app.module");
const global_exception_filter_1 = require("./common/filters/global-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, helmet_1.default)());
    app.use((0, cookie_parser_1.default)());
    const origins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    app.enableCors({ origin: origins, credentials: true });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalFilters(new global_exception_filter_1.GlobalExceptionFilter());
    if (process.env.NODE_ENV !== 'production' || process.env.SWAGGER === '1') {
        const config = new swagger_1.DocumentBuilder()
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
        const doc = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('api/docs', app, doc);
    }
    const port = Number(process.env.PORT) || 3000;
    await app.listen(port);
    console.log(`Backend running on port ${port}`);
}
void bootstrap();
//# sourceMappingURL=main.js.map