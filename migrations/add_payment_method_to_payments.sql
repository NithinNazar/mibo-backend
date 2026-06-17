-- Migration: Add payment_method field to payments table for tracking direct payments
-- This allows tracking payments made via cash, card, UPI in addition to online Razorpay

-- Add payment_method column to payments table
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'ONLINE'
CHECK (payment_method IN ('ONLINE', 'CASH', 'CARD', 'UPI'));

COMMENT ON COLUMN payments.payment_method IS 'Payment method: ONLINE (Razorpay), CASH, CARD, or UPI (direct payment at front desk)';

-- Update existing records to ONLINE (default for all Razorpay payments)
UPDATE payments
SET payment_method = 'ONLINE'
WHERE payment_method IS NULL;
