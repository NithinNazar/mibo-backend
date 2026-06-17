-- =====================================================================
-- Investigate Booking Bug: Nithin vs Arpita
-- =====================================================================

-- Step 1: Get user IDs and patient profile IDs for both
SELECT 
    u.id as user_id,
    pp.id as patient_profile_id,
    u.phone,
    u.first_name,
    u.last_name,
    u.full_name,
    u.email
FROM users u
LEFT JOIN patient_profiles pp ON u.id = pp.user_id
WHERE u.full_name ILIKE '%Nithin%' OR u.full_name ILIKE '%Arpita%'
ORDER BY u.full_name;

-- Step 2: Check recent appointments to see which patient_profile_id they're linked to
SELECT 
    a.id as appointment_id,
    a.patient_profile_id,
    a.created_at,
    a.status,
    pp.user_id,
    u.full_name as patient_name,
    u.phone as patient_phone
FROM appointments a
JOIN patient_profiles pp ON a.patient_profile_id = pp.id
JOIN users u ON pp.user_id = u.id
WHERE u.full_name ILIKE '%Nithin%' OR u.full_name ILIKE '%Arpita%'
ORDER BY a.created_at DESC
LIMIT 10;

-- Step 3: Check if there are any appointments with mismatched data
-- (e.g., appointment says Nithin but profile_id points to Arpita)
SELECT 
    a.id as appointment_id,
    a.patient_profile_id,
    'Expected: Nithin' as expected_patient,
    u.full_name as actual_patient_from_profile,
    u.phone as actual_phone,
    a.created_at
FROM appointments a
JOIN patient_profiles pp ON a.patient_profile_id = pp.id
JOIN users u ON pp.user_id = u.id
WHERE a.created_at > NOW() - INTERVAL '7 days'
  AND u.full_name ILIKE '%Arpita%'
ORDER BY a.created_at DESC;
