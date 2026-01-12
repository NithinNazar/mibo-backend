-- Add payment link columns to payments table
-- Run this migration to support payment link functionality

ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_link_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_link_url TEXT,
ADD COLUMN IF NOT EXISTS payment_link_sent_at TIMESTAMP;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_payment_link_id ON payments(payment_link_id);

-- Add comment
COMMENT ON COLUMN payments.payment_link_id IS 'Razorpay payment link ID';
COMMENT ON COLUMN payments.payment_link_url IS 'Razorpay payment link URL (short URL)';
COMMENT ON COLUMN payments.payment_link_sent_at IS 'Timestamp when payment link was sent via WhatsApp';
