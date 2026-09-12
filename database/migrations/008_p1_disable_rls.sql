-- =============================================
-- P1 migration 008: RLS desactivado en tablas de la app
-- Arquitectura del proyecto (schema.sql): SIN RLS, el gatekeeper
-- único es la API NestJS con JWT propio + service_role.
-- Las tablas creadas desde el Dashboard nacen con RLS activado y
-- sin policies => "violates row-level security policy" en inserts.
-- Idempotente. Aplicar DESPUÉS de 007.
-- =============================================

DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles','plans','referrers','subscriptions','payments',
    'licenses','referral_uses','app_settings',
    'leads','faqs','event_logs'
  ] LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', t);
    EXCEPTION WHEN undefined_table THEN NULL;
    END;
  END LOOP;
END $$;
