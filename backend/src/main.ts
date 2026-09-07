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
      .setDescription('SaaS management API (JWT + cookies httpOnly)')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const doc = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, doc);
  }

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  console.log(`Backend running on port ${port}`);
}
void bootstrap();
