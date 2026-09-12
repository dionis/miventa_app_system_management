# Migraciones

`schema.sql` es el baseline. Las `migrations/NNN_*.sql` son incrementales e idempotentes (`IF NOT EXISTS` / `duplicate_object`).

## Aplicar

```bash
# psql local / Supabase pooled
psql "$DATABASE_URL" -f database/schema.sql
psql "$DATABASE_URL" -f database/migrations/001_p1_indexes_triggers.sql
psql "$DATABASE_URL" -f database/migrations/002_p1_plan_keys_premium.sql
psql "$DATABASE_URL" -f database/migrations/003_p1_plan_tiers.sql
psql "$DATABASE_URL" -f database/migrations/004_p1_licenses.sql
psql "$DATABASE_URL" -f database/migrations/005_p1_guest_referrals.sql
psql "$DATABASE_URL" -f database/migrations/006_p1_channel_none.sql
psql "$DATABASE_URL" -f database/migrations/007_p1_licenses_nullable_user.sql
psql "$DATABASE_URL" -f database/migrations/008_p1_disable_rls.sql
```

En Supabase Dashboard: SQL Editor -> pegar `schema.sql` -> Run -> luego `001_*.sql` -> Run.

## Crear una nueva migración

1. `database/migrations/002_<tema>.sql` (siempre idempotente).
2. Probar en staging antes que en prod.
3. P2: mover a herramienta (Supabase CLI `supabase db diff` / Drizzle) con historial versionado.
