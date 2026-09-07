-- =============================================
-- P1 migration 001: pgcrypto + índices + updated_at + integridad
-- Aplicar DESPUÉS de database/schema.sql
-- psql: psql $DATABASE_URL -f database/migrations/001_p1_indexes_triggers.sql
-- Supabase: SQL Editor -> pegar y Run
-- =============================================

-- 1. pgcrypto (gen_random_uuid) sin deprecación de uuid-ossp
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Índices faltantes (lecturas calientes del dashboard/admin)
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_sub ON public.payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status_created ON public.payments(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower ON public.profiles(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_referrers_code ON public.referrers(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrers_active ON public.referrers(is_active);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_is_read ON public.leads(is_read);
CREATE INDEX IF NOT EXISTS idx_plans_active ON public.plans(is_active);

-- 3. Trigger genérico updated_at (el código lo setea a mano e inconsistente)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated ON public.profiles;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_plans_updated ON public.plans;
CREATE TRIGGER trg_plans_updated BEFORE UPDATE ON public.plans
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_referrers_updated ON public.referrers;
CREATE TRIGGER trg_referrers_updated BEFORE UPDATE ON public.referrers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_subscriptions_updated ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_payments_updated ON public.payments;
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_faqs_updated ON public.faqs;
CREATE TRIGGER trg_faqs_updated BEFORE UPDATE ON public.faqs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Integridad mínima de negocio
DO $$ BEGIN
  ALTER TABLE public.plans ADD CONSTRAINT chk_plans_price_nonneg CHECK (price >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.payments ADD CONSTRAINT chk_payments_amount_pos CHECK (amount > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.plans ADD CONSTRAINT chk_plans_duration CHECK (duration_months >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- referral_code_used -> referrers(referral_code), nullable, sin borrar en cascada
DO $$ BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT fk_profiles_referral_code
    FOREIGN KEY (referral_code_used) REFERENCES public.referrers(referral_code)
    ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
