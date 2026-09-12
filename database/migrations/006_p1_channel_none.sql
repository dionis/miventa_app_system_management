-- =============================================
-- P1 migration 006: contact_channel 'none' (sin notificación)
-- La opción "Ninguno" en "Dónde enviar la licencia" no exige
-- email/teléfono ni envía aviso al confirmar.
-- Idempotente. Aplicar DESPUÉS de 005.
-- =============================================

DO $$ BEGIN
  ALTER TABLE public.payments DROP CONSTRAINT chk_payments_channel;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.payments ADD CONSTRAINT chk_payments_channel CHECK (contact_channel IN ('email','sms','both','none'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
