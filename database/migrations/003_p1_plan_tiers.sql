-- =============================================
-- P1 migration 003: tiers normal/premium
-- Mismo catálogo por tier con precios independientes.
-- Aplicar DESPUÉS de 002. Idempotente.
-- =============================================

DO $$ BEGIN
  ALTER TABLE public.plans ADD COLUMN tier TEXT DEFAULT 'normal';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Backfill: premium existente -> tier premium, resto normal
UPDATE public.plans SET tier = 'premium' WHERE tier IS NULL AND key LIKE 'premium%';
UPDATE public.plans SET tier = 'normal' WHERE tier IS NULL;

-- El premium único pasa a ser el anual del tier premium
-- (sin "Premium" en el nombre: el switcher ya indica el tier)
UPDATE public.plans
SET key = 'premium-annual', name = 'Annual'
WHERE key = 'premium';

DO $$ BEGIN
  ALTER TABLE public.plans ADD CONSTRAINT chk_plans_tier CHECK (tier IN ('normal', 'premium'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_plans_tier ON public.plans(tier);
CREATE INDEX IF NOT EXISTS idx_plans_tier_active ON public.plans(tier, is_active);

-- Tier premium: mismos planes (mensual/trimestral/semestral), precios propios
-- Nombres sin "Premium": el switcher Normal/Premium ya indica el tier
INSERT INTO public.plans (key, tier, name, description, duration_months, price, currency, is_enterprise, features, is_active)
SELECT v.key, 'premium', v.name, v.description, v.duration_months, v.price, 'USD', FALSE,
  '["Everything in Premium Annual", "Priority onboarding", "Advanced analytics", "API access"]'::JSONB, TRUE
FROM (VALUES
  ('premium-monthly', 'Monthly', 'Premium billing, monthly', 1, 49.99),
  ('premium-quarterly', 'Quarterly', 'Premium billing, quarterly', 3, 127.47),
  ('premium-semiannual', 'Semiannual', 'Premium billing, semiannual', 6, 224.96)
) AS v(key, name, description, duration_months, price)
WHERE NOT EXISTS (SELECT 1 FROM public.plans p WHERE p.key = v.key);

-- Renombrar por si la migración ya se aplicó con los nombres antiguos
UPDATE public.plans SET name = 'Monthly'   WHERE key = 'premium-monthly' AND name <> 'Monthly';
UPDATE public.plans SET name = 'Quarterly' WHERE key = 'premium-quarterly' AND name <> 'Quarterly';
UPDATE public.plans SET name = 'Semiannual' WHERE key = 'premium-semiannual' AND name <> 'Semiannual';
UPDATE public.plans SET name = 'Annual'    WHERE key = 'premium-annual' AND name <> 'Annual';
