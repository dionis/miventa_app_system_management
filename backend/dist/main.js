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
            .setDescription('SaaS management API (JWT + cookies httpOnly)')
            .setVersion('1.0')
            .addBearerAuth()
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