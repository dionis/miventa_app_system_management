-- =============================================
-- P1 migration 007: licenses.user_id nullable
-- La llave SIEMPRE se emite al confirmar, incluso para guest
-- solo-teléfono (sin cuenta). El contacto queda en payments
-- (guest_email/guest_phone) + referral_uses. Idempotente.
-- Aplicar DESPUÉS de 006.
-- =============================================

DO $$ BEGIN
  ALTER TABLE public.licenses ALTER COLUMN user_id DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;
