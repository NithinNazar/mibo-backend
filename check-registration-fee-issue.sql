-- Check patient_profiles table structure and registration fee data

-- 1. Check table structure
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'patient_profiles'
AND column_name IN ('id', 'user_id', 'registration_fee_paid', 'registration_fee_paid_at')
ORDER BY ordinal_position;

-- 2. Check sample data
SELECT 
  pp.id as patient_profile_id,
  pp.user_id,
  u.full_name,
  u.phone,
  pp.registration_fee_paid,
  pp.registration_fee_paid_at,
  COUNT(a.id) as total_appointments,
  COUNT(CASE WHEN p.status = 'SUCCESS' THEN 1 END) as successful_payments
FROM patient_profiles pp
LEFT JOIN users u ON pp.user_id = u.id
LEFT JOIN appointments a ON a.patient_id = pp.user_id
LEFT JOIN payments p ON p.appointment_id = a.id
GROUP BY pp.id, pp.user_id, u.full_name, u.phone, pp.registration_fee_paid, pp.registration_fee_paid_at
ORDER BY pp.id
LIMIT 10;

-- 3. Check if there's a mismatch between patient_id in appointments
SELECT 
  'appointments.patient_id references' as check_type,
  COUNT(DISTINCT a.patient_id) as count
FROM appointments a;

SELECT 
  'patient_profiles.id' as check_type,
  COUNT(DISTINCT pp.id) as count
FROM patient_profiles pp;

SELECT 
  'patient_profiles.user_id' as check_type,
  COUNT(DISTINCT pp.user_id) as count
FROM patient_profiles pp;
