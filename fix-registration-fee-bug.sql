-- FIX: Registration Fee Bug - Mark existing patients as having paid registration fee
-- Date: 2026-05-19
-- Issue: Migration script had wrong JOIN condition (a.patient_id = pp.user_id instead of a.patient_id = pp.id)
-- This caused ALL users (including existing ones) to be charged registration fee

-- BEFORE FIX: Check current state
SELECT 
  'BEFORE FIX' as status,
  COUNT(*) as total_patients,
  COUNT(CASE WHEN registration_fee_paid = TRUE THEN 1 END) as patients_marked_paid,
  COUNT(CASE WHEN registration_fee_paid = FALSE THEN 1 END) as patients_marked_unpaid
FROM patient_profiles;

-- Show patients who should have registration_fee_paid = TRUE but don't
SELECT 
  pp.id as patient_profile_id,
  pp.user_id,
  u.full_name,
  u.phone,
  pp.registration_fee_paid as current_status,
  COUNT(DISTINCT a.id) as total_appointments,
  COUNT(DISTINCT CASE WHEN p.status = 'SUCCESS' THEN p.id END) as successful_payments,
  MIN(p.paid_at) as first_payment_date
FROM patient_profiles pp
JOIN users u ON pp.user_id = u.id
LEFT JOIN appointments a ON a.patient_id = pp.id  -- CORRECT: patient_id references patient_profiles.id
LEFT JOIN payments p ON p.appointment_id = a.id
WHERE pp.registration_fee_paid = FALSE  -- Currently marked as unpaid
GROUP BY pp.id, pp.user_id, u.full_name, u.phone, pp.registration_fee_paid
HAVING COUNT(DISTINCT CASE WHEN p.status = 'SUCCESS' THEN p.id END) > 0  -- But has successful payments
ORDER BY first_payment_date;

-- FIX: Update existing patients who have successful payments
-- Mark them as having paid registration fee
UPDATE patient_profiles pp
SET 
  registration_fee_paid = TRUE,
  registration_fee_paid_at = (
    SELECT MIN(p.paid_at)
    FROM payments p
    JOIN appointments a ON p.appointment_id = a.id
    WHERE a.patient_id = pp.id  -- FIXED: Use pp.id instead of pp.user_id
    AND p.status = 'SUCCESS'
    AND p.paid_at IS NOT NULL
  ),
  updated_at = NOW()
WHERE EXISTS (
  SELECT 1
  FROM payments p
  JOIN appointments a ON p.appointment_id = a.id
  WHERE a.patient_id = pp.id  -- FIXED: Use pp.id instead of pp.user_id
  AND p.status = 'SUCCESS'
);

-- AFTER FIX: Verify the fix
SELECT 
  'AFTER FIX' as status,
  COUNT(*) as total_patients,
  COUNT(CASE WHEN registration_fee_paid = TRUE THEN 1 END) as patients_marked_paid,
  COUNT(CASE WHEN registration_fee_paid = FALSE THEN 1 END) as patients_marked_unpaid
FROM patient_profiles;

-- Show updated patients
SELECT 
  pp.id as patient_profile_id,
  pp.user_id,
  u.full_name,
  u.phone,
  pp.registration_fee_paid,
  pp.registration_fee_paid_at,
  COUNT(DISTINCT a.id) as total_appointments,
  COUNT(DISTINCT CASE WHEN p.status = 'SUCCESS' THEN p.id END) as successful_payments
FROM patient_profiles pp
JOIN users u ON pp.user_id = u.id
LEFT JOIN appointments a ON a.patient_id = pp.id
LEFT JOIN payments p ON p.appointment_id = a.id
GROUP BY pp.id, pp.user_id, u.full_name, u.phone, pp.registration_fee_paid, pp.registration_fee_paid_at
ORDER BY pp.registration_fee_paid, pp.id
LIMIT 20;
