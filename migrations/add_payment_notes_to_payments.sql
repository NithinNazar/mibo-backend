-- Migration: Add payment_notes field to payments table
-- This allows staff to add remarks/notes when confirming direct payments

-- Add payment_notes column to payments table
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS payment_notes TEXT;

COMMENT ON COLUMN payments.payment_notes IS 'Optional notes/remarks added by staff when confirming direct payments (CASH/CARD/UPI)';
