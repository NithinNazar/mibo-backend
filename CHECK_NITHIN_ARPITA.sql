-- =====================================================================
-- Check Nithin Nazar and Arpita Patient Records
-- =====================================================================

-- Step 1: Find both patients in users and patient_profiles
SELECT 
    u.id as user_id,
    u.phone,
    u.first_name,
    u.last_name,
    u.full_name,
    u.email,
    pp.id as patient_profile_id,
    pp.age,
    pp.gender
FROM users u
LEFT JOIN patient_profiles pp ON u.id = pp.user_id
WHERE u.user_type = 'PATIENT'
  AND (u.full_name ILIKE '%Nithin%' OR u.full_name ILIKE '%Arpita%')
ORDER BY u.full_name;

-- Step 2: Check recent appointments for these patients
SELECT 
    a.id as appointment_id,
    a.patient_profile_id,
    pp.user_id,
    u.full_name as patient_name,
    u.phone as patient_phone,
    a.status,
    a.created_at,
    a.created_by_user_id,
    creator.full_name as created_by_name
FROM appointments a
JOIN patient_profiles pp ON a.patient_profile_id = pp.id
JOIN users u ON pp.user_id = u.id
LEFT JOIN users creator ON a.created_by_user_id = creator.id
WHERE u.full_name ILIKE '%Nithin%' OR u.full_name ILIKE '%Arpita%'
ORDER BY a.created_at DESC
LIMIT 20;
