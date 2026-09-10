-- =============================================
-- P1 migration 004: licenses (llaves POS INOIDSOFT)
-- Port de dart_licences_generator a stack NestJS+Supabase.
-- Formato llave: V1-DATA(13)-SALT(13)-SIG(4), charset A-Z2-7.
-- Aplicar DESPUÉS de 003. Idempotente.
-- =============================================

-- POS permitidos por plan (Dart: defaultPosCount=5, 1..255)
DO $$ BEGIN
  ALTER TABLE public.plans ADD COLUMN pos_count INT NOT NULL DEFAULT 5;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Días de licencia por plan (Dart: 30/90/180/365).
-- duration_months*30 es aproximado; se materializa para no recalcular.
DO $$ BEGIN
  ALTER TABLE public.plans ADD COLUMN duration_days INT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

UPDATE public.plans SET duration_days = CASE
  WHEN duration_months <= 0 THEN 0
  WHEN duration_months = 1 THEN 30
  WHEN duration_months = 3 THEN 90
  WHEN duration_months = 6 THEN 180
  WHEN duration_months = 12 THEN 365
  ELSE duration_months * 30
END WHERE duration_days IS NULL;

-- Tabla de licencias emitidas: 1 licencia por pago (idempotencia webhook)
CREATE TABLE IF NOT EXISTS public.licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID NOT NULL UNIQUE REFERENCES public.payments(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  license_key TEXT NOT NULL UNIQUE,
  key_hash TEXT NOT NULL UNIQUE,
  license_type TEXT NOT NULL DEFAULT 'normal' CHECK (license_type IN ('normal', 'premium')),
  pos_count INT NOT NULL DEFAULT 5 CHECK (pos_count >= 1 AND pos_count <= 255),
  days INT NOT NULL CHECK (days >= 1 AND days <= 9999),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  expires_at TIMESTAMPTZ,
  emailed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_licenses_payment ON public.licenses(payment_id);
CREATE INDEX IF NOT EXISTS idx_licenses_user ON public.licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_licenses_key_hash ON public.licenses(key_hash);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON public.licenses(status);
