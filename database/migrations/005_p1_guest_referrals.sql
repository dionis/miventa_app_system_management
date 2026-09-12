-- =============================================
-- P1 migration 005: guest checkout + referidos con descuento configurable
-- - Pago sin login: guest_email/phone + claim_token en payments.
-- - Referido: referral_code en pago + % descuento configurable (admin).
-- - Atribución: referral_uses para contabilizar comisión del referidor.
-- Idempotente.
-- =============================================

-- 0. Permitir pagos/suscripciones guest pendientes (user se crea al confirmar)
DO $$ BEGIN
  ALTER TABLE public.payments ALTER COLUMN user_id DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.subscriptions ALTER COLUMN user_id DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

-- 1. Config global (descuentos/comisiones editables por admin)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.app_settings (key, value) VALUES
  ('referral_discount_percent', '10'),
  ('referral_commission_percent', '10')
ON CONFLICT (key) DO NOTHING;

-- 2. Columnas guest + referido en payments
DO $$ BEGIN
  ALTER TABLE public.payments ADD COLUMN guest_email TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.payments ADD COLUMN guest_phone TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.payments ADD COLUMN contact_channel TEXT NOT NULL DEFAULT 'email';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.payments ADD COLUMN claim_token TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.payments ADD COLUMN referral_code TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.payments ADD COLUMN referrer_id UUID REFERENCES public.referrers(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.payments ADD COLUMN discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.payments ADD COLUMN amount_original NUMERIC(10,2);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.payments ADD COLUMN commission_amount NUMERIC(10,2) NOT NULL DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.payments ADD CONSTRAINT chk_payments_channel CHECK (contact_channel IN ('email','sms','both','none'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.payments ADD CONSTRAINT uq_payments_claim_token UNIQUE (claim_token);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_payments_claim ON public.payments(claim_token);
CREATE INDEX IF NOT EXISTS idx_payments_referrer ON public.payments(referrer_id);
CREATE INDEX IF NOT EXISTS idx_payments_guest_email ON public.payments(guest_email);

-- 3. Atribución por referido (1 fila por pago con código, para liquidar al referidor)
CREATE TABLE IF NOT EXISTS public.referral_uses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES public.referrers(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL UNIQUE REFERENCES public.payments(id) ON DELETE CASCADE,
  buyer_email TEXT,
  buyer_phone TEXT,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  commission_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_uses_referrer ON public.referral_uses(referrer_id);
