-- Migration: Add Registration Fee Tracking
-- Date: 2026-05-09
-- Description: Adds fields to track one-time registration fee (₹100) for new patients

-- 1. Add registration_fee_paid flag to patient_profiles
ALTER TABLE patient_profiles 
ADD COLUMN IF NOT EXISTS registration_fee_paid BOOLEAN DEFAULT FALSE NOT NULL;

-- 2. Add registration_fee_paid_at timestamp to track when it was paid
ALTER TABLE patient_profiles 
ADD COLUMN IF NOT EXISTS registration_fee_paid_at TIMESTAMP WITH TIME ZONE;

-- 3. Add registration_fee amount to payments table to track the fee separately
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS registration_fee NUMERIC(10,2) DEFAULT 0 NOT NULL;

-- 4. Add consultation_fee to payments table to separate consultation fee from registration fee
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS consultation_fee NUMERIC(10,2) DEFAULT 0 NOT NULL;

-- 5. Create index on registration_fee_paid for faster lookups
CREATE INDEX IF NOT EXISTS idx_patient_profiles_registration_fee_paid 
ON patient_profiles(registration_fee_paid);

-- 6. Add comments to columns
COMMENT ON COLUMN patient_profiles.registration_fee_paid IS 'Whether patient has paid the one-time registration fee of ₹100';
COMMENT ON COLUMN patient_profiles.registration_fee_paid_at IS 'Timestamp when registration fee was paid';
COMMENT ON COLUMN payments.registration_fee IS 'One-time registration fee amount (₹100 for new patients)';
COMMENT ON COLUMN payments.consultation_fee IS 'Clinician consultation fee (separate from registration fee)';

-- 7. Update existing patients who have successful payments to mark registration fee as paid
-- This ensures existing patients don't have to pay registration fee again
-- FIXED: Changed a.patient_id = pp.user_id to a.patient_id = pp.id
-- (appointments.patient_id references patient_profiles.id, not patient_profiles.user_id)
UPDATE patient_profiles pp
SET 
  registration_fee_paid = TRUE,
  registration_fee_paid_at = (
    SELECT MIN(p.paid_at)
    FROM payments p
    JOIN appointments a ON p.appointment_id = a.id
    WHERE a.patient_id = pp.id 
    AND p.status = 'SUCCESS'
    AND p.paid_at IS NOT NULL
  )
WHERE EXISTS (
  SELECT 1
  FROM payments p
  JOIN appointments a ON p.appointment_id = a.id
  WHERE a.patient_id = pp.id 
  AND p.status = 'SUCCESS'
);

-- 8. Verify the changes
SELECT 
  COUNT(*) as total_patients,
  COUNT(CASE WHEN registration_fee_paid = TRUE THEN 1 END) as patients_with_reg_fee_paid,
  COUNT(CASE WHEN registration_fee_paid = FALSE THEN 1 END) as patients_without_reg_fee_paid
FROM patient_profiles;

-- 9. Show sample of updated patients
SELECT 
  pp.user_id,
  pp.registration_fee_paid,
  pp.registration_fee_paid_at,
  COUNT(a.id) as total_appointments
FROM patient_profiles pp
LEFT JOIN appointments a ON a.patient_id = pp.user_id
GROUP BY pp.user_id, pp.registration_fee_paid, pp.registration_fee_paid_at
ORDER BY pp.user_id
LIMIT 10;
