-- Extend appointments table for slot blocking and refund tracking
-- Adds columns to support appointment cancellation due to slot blocking and refund processing

-- Add new appointment status for admin cancellations
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    WHERE t.typname = 'appointment_status' 
    AND e.enumlabel = 'CANCELLED_BY_ADMIN'
  ) THEN
    ALTER TYPE appointment_status ADD VALUE 'CANCELLED_BY_ADMIN';
  END IF;
END $$;

-- Add refund tracking columns
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS refund_eligible BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS refund_status VARCHAR(20) CHECK (refund_status IN ('PENDING', 'PROCESSED', 'COMPLETED', 'NOT_APPLICABLE')),
  ADD COLUMN IF NOT EXISTS refund_initiated_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS blocked_slot_id INTEGER REFERENCES blocked_slots(id);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_appointments_refund_status 
  ON appointments(refund_status) 
  WHERE refund_eligible = TRUE;

CREATE INDEX IF NOT EXISTS idx_appointments_blocked_slot 
  ON appointments(blocked_slot_id);

-- Add comments for documentation
COMMENT ON COLUMN appointments.refund_eligible IS 'Whether this appointment is eligible for refund due to admin cancellation';
COMMENT ON COLUMN appointments.refund_status IS 'Current status of refund processing (PENDING, PROCESSED, COMPLETED, NOT_APPLICABLE)';
COMMENT ON COLUMN appointments.refund_initiated_at IS 'Timestamp when refund process was initiated';
COMMENT ON COLUMN appointments.blocked_slot_id IS 'Reference to blocked slot that caused appointment cancellation (if applicable)';
