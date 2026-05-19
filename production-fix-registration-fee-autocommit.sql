-- PRODUCTION FIX: Registration Fee Bug
-- Date: 2026-05-19
-- Issue: All users (including existing ones) are being charged registration fee
-- Root Cause: Migration script had wrong JOIN condition in UPDATE query
-- Fix: Mark existing patients with successful payments as having paid registration fee

-- This script is SAFE to run multiple times (idempotent)

DO $$
DECLARE
  v_before_paid INTEGER;
  v_before_unpaid INTEGER;
  v_after_paid INTEGER;
  v_after_unpaid INTEGER;
  v_updated_count INTEGER;
BEGIN
  -- 1. Check current state BEFORE fix
  SELECT 
    COUNT(CASE WHEN registration_fee_paid = TRUE THEN 1 END),
    COUNT(CASE WHEN registration_fee_paid = FALSE THEN 1 END)
  INTO v_before_paid, v_before_unpaid
  FROM patient_profiles;
  
  RAISE NOTICE '=== BEFORE FIX ===';
  RAISE NOTICE 'Patients marked as PAID: %', v_before_paid;
  RAISE NOTICE 'Patients marked as UNPAID: %', v_before_unpaid;
  RAISE NOTICE '';
  
  -- 2. Show patients who will be updated
  RAISE NOTICE '=== PATIENTS TO BE UPDATED ===';
  RAISE NOTICE 'These patients have successful payments but registration_fee_paid = FALSE:';
  
  FOR v_updated_count IN
    SELECT pp.id
    FROM patient_profiles pp
    WHERE pp.registration_fee_paid = FALSE
    AND EXISTS (
      SELECT 1
      FROM payments p
      JOIN appointments a ON p.appointment_id = a.id
      WHERE a.patient_id = pp.id
      AND p.status = 'SUCCESS'
    )
  LOOP
    RAISE NOTICE 'Patient Profile ID: %', v_updated_count;
  END LOOP;
  
  -- 3. Apply the FIX
  RAISE NOTICE '';
  RAISE NOTICE '=== APPLYING FIX ===';
  
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
    ),
    updated_at = NOW()
  WHERE pp.registration_fee_paid = FALSE
  AND EXISTS (
    SELECT 1
    FROM payments p
    JOIN appointments a ON p.appointment_id = a.id
    WHERE a.patient_id = pp.id
    AND p.status = 'SUCCESS'
  );
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % patient profiles', v_updated_count;
  
  -- 4. Check state AFTER fix
  SELECT 
    COUNT(CASE WHEN registration_fee_paid = TRUE THEN 1 END),
    COUNT(CASE WHEN registration_fee_paid = FALSE THEN 1 END)
  INTO v_after_paid, v_after_unpaid
  FROM patient_profiles;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== AFTER FIX ===';
  RAISE NOTICE 'Patients marked as PAID: %', v_after_paid;
  RAISE NOTICE 'Patients marked as UNPAID: %', v_after_unpaid;
  RAISE NOTICE '';
  RAISE NOTICE '✅ FIX COMPLETED SUCCESSFULLY';
  
END $$;

-- 5. Verification Query: Show sample of updated patients
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
ORDER BY pp.registration_fee_paid DESC, pp.id
LIMIT 20;
