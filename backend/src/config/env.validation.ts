import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  SUPABASE_URL: Joi.string().uri().required(),
  SUPABASE_ANON_KEY: Joi.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().required(),
  // JWT de nuestra app (NO el de Supabase). Mínimo 32 chars.
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).optional(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  // CORS: lista separada por comas. Ej: http://localhost:5173,https://app.miventa.com
  CORS_ORIGINS: Joi.string().default('http://localhost:5173,http://localhost:3000'),
  // P1: pagos
  PAYMENTS_QR_SECRET: Joi.string().min(16).optional(),
  PAYMENTS_WEBHOOK_SECRET: Joi.string().min(16).optional(),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
});
