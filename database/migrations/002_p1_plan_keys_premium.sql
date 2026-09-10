-- =============================================
-- P1 migration 002: plan keys + Premium tier
-- Aplicar DESPUÉS de 001. Idempotente.
-- =============================================

DO $$ BEGIN
  ALTER TABLE public.plans ADD COLUMN key TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Backfill desde name (datos existentes en inglés)
UPDATE public.plans SET key = 'monthly'    WHERE key IS NULL AND LOWER(name) = 'monthly';
UPDATE public.plans SET key = 'quarterly'  WHERE key IS NULL AND LOWER(name) = 'quarterly';
UPDATE public.plans SET key = 'semiannual' WHERE key IS NULL AND LOWER(name) = 'semiannual';
UPDATE public.plans SET key = 'annual'     WHERE key IS NULL AND LOWER(name) = 'annual';
UPDATE public.plans SET key = 'enterprise' WHERE key IS NULL AND (LOWER(name) = 'enterprise' OR is_enterprise);

-- Clave única para idempotencia de seeds y lookup i18n
DO $$ BEGIN
  ALTER TABLE public.plans ADD CONSTRAINT uq_plans_key UNIQUE (key);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_plans_key ON public.plans(key);

-- Premium: mismo formato anual pero más valor (12 meses, tier superior)
INSERT INTO public.plans (key, name, description, duration_months, price, currency, is_enterprise, features, is_active)
SELECT 'premium', 'Premium', 'Maximum value for growing teams', 12, 399.99, 'USD', FALSE,
  '["Everything in Annual", "20 user seats", "24/7 phone support", "SSO/SAML", "Audit log", "Custom SLA", "Onboarding manager"]'::JSONB, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE key = 'premium');
