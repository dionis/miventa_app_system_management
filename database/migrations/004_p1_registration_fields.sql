-- =============================================
-- P1 migration 004: campos de registro + verificación de email
-- Aplicar DESPUÉS de 003. Idempotente.
-- =============================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS secondary_phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verification_token TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_verification_token ON public.profiles(email_verification_token);
CREATE INDEX IF NOT EXISTS idx_profiles_company ON public.profiles(company);

-- Usuarios existentes (seeds): darlos por verificados
UPDATE public.profiles SET email_verified = TRUE WHERE email_verified IS FALSE;
