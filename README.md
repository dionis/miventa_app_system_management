# MiVenta SaaS Platform

Backoffice + landing para gestión de planes, suscripciones, pagos QR, referidos, leads, FAQs y auditoría.

- `backend/` NestJS 11 + JWT (cookies httpOnly) + Supabase/Postgres. Docs: `GET /api/docs` (no prod salvo `SWAGGER=1`). Salud: `GET /api/health`.
- `frontend/` React 19 + Vite + Tailwind v4 + i18n (es/en). Rutas lazy en `/admin/*`.
- `database/` `schema.sql` (baseline) + `migrations/` incrementales.

## Quickstart

```bash
# 1. Backend
cp backend/.env_example.txt backend/.env   # completar secretos (JWT_SECRET 32+, etc.)
cd backend && npm ci && npm run start:dev   # :3000

# 2. Frontend (otra terminal)
cd frontend && npm ci && npm run dev        # :5173 (proxy /api -> :3000)
```

## Database Setup

Custom PostgreSQL + JWT propio; la tabla local `profiles` guarda logins (no Supabase Auth).

```bash
psql "$DATABASE_URL" -f database/schema.sql
psql "$DATABASE_URL" -f database/migrations/001_p1_indexes_triggers.sql
```

O pegar cada archivo en Supabase SQL Editor en ese orden. Detalle: `database/migrations/README.md`.

### Seed Users (solo dev — cambiar password ya)

- Admin: `admin@miempresa.com` / `admin123` / `admin`
- Customer: `cliente@ejemplo.com` / `admin123` / `customer`

## Env vars

| Backend | Req | Notas |
|---|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | sí | fail-fast sin ellas |
| `JWT_SECRET` (32+) | sí | access 15m |
| `JWT_REFRESH_SECRET` | no | default = `JWT_SECRET`, refresh 7d |
| `CORS_ORIGINS` | no | default `localhost:5173,3000` |
| `PAYMENTS_QR_SECRET` / `PAYMENTS_WEBHOOK_SECRET` | no | HMAC QR + `x-webhook-secret` en `POST /api/payments/webhook/confirm` |

Frontend: `VITE_API_BASE_URL` (default `http://localhost:3000/api`). Ver `frontend/.env.example`.

## Docker / CI

```bash
docker compose up --build   # backend :3000, frontend :8080
```

CI (`.github/workflows/ci.yml`): backend `npm test + build`, frontend `npm run test + build` en cada push/PR.

## Seguridad (P0+P1 aplicados)

- Sin fallback JWT; cookies httpOnly + Bearer compat; throttle global + específico (login/register/leads/payments); `helmet`; CORS por env; `GlobalExceptionFilter` (no filtra SQL); `POST payments/create-order` con auth + anti-spoof; QR firmado HMAC-SHA256; webhook por secreto; paginación con `limit≤100`.
- Pendiente manual: rotar keys filtradas en historial git, limpiar historial, cambiar `admin123`.

## P2 sugerido

RLS por rol, firma por proveedor (Stripe-Signature) + idempotencia, `supabase db diff`, observabilidad (Sentry), tests e2e, separar portal `/app` (customer) de `/admin`.
