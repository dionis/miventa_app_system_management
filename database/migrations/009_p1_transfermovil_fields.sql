-- Migration 009: Add Transfermóvil fields to payments table
-- Adds fields required for TM WS External Payment integration

-- Add Transfermóvil specific columns to payments table
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS tm_order_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS tm_qr_code TEXT,
  ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(20) DEFAULT 'transfermovil',
  ADD COLUMN IF NOT EXISTS refund_id VARCHAR(50);

-- Create index for faster webhook lookups by TM order ID
CREATE INDEX IF NOT EXISTS idx_payments_tm_order_id ON payments(tm_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_ref ON payments(transaction_ref);
CREATE INDEX IF NOT EXISTS idx_payments_refund_id ON payments(refund_id);

-- Add constraint for payment_provider
ALTER TABLE payments
  ADD CONSTRAINT chk_payment_provider CHECK (payment_provider IN ('transfermovil', 'enzona', 'manual', 'simulation'));

COMMENT ON COLUMN payments.tm_order_id IS 'Order ID returned by Transfermóvil WS payOrder';
COMMENT ON COLUMN payments.tm_qr_code IS 'QR code data (JSON string) for Transfermóvil payment';
COMMENT ON COLUMN payments.payment_provider IS 'Payment provider used: transfermovil, enzona, manual, simulation';
COMMENT ON COLUMN payments.refund_id IS 'Refund ID for Transfermóvil refund tracking';