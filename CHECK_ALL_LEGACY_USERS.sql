-- =====================================================================
-- Check All Legacy Users - Find users with incomplete data
-- =====================================================================
-- This query identifies legacy users who might have data issues

-- Step 1: Find users where first_name or last_name is NULL or looks wrong
SELECT 
    u.id,
    u.phone,
    u.first_name,
    u.last_name,
    u.full_name,
    u.created_at,
    CASE 
        WHEN u.first_name IS NULL THEN 'Missing first_name'
        WHEN u.last_name IS NULL THEN 'Missing last_name'
        WHEN u.first_name = u.last_name THEN 'first_name = last_name (likely wrong)'
        ELSE 'OK'
    END as name_status
FROM users u
WHERE u.user_type = 'PATIENT'
  AND (u.first_name IS NULL 
       OR u.last_name IS NULL 
       OR u.first_name = u.last_name)
ORDER BY u.created_at DESC;

-- Step 2: Find patient profiles with missing age/gender/date_of_birth
SELECT 
    u.id as user_id,
    u.phone,
    u.full_name,
    pp.age,
    pp.gender,
    pp.date_of_birth,
    u.created_at,
    CASE 
        WHEN pp.age IS NULL THEN 'Missing age'
        WHEN pp.gender IS NULL THEN 'Missing gender'
        WHEN pp.date_of_birth IS NULL THEN 'Missing DOB'
        ELSE 'Complete'
    END as profile_status
FROM users u
LEFT JOIN patient_profiles pp ON u.id = pp.user_id
WHERE u.user_type = 'PATIENT'
  AND (pp.age IS NULL OR pp.gender IS NULL OR pp.date_of_birth IS NULL)
ORDER BY u.created_at DESC;

-- Step 3: Count total legacy users vs complete users
SELECT 
    COUNT(*) as total_patients,
    COUNT(CASE WHEN u.first_name IS NOT NULL AND u.last_name IS NOT NULL THEN 1 END) as has_names,
    COUNT(CASE WHEN pp.age IS NOT NULL AND pp.gender IS NOT NULL THEN 1 END) as has_profile_data,
    COUNT(CASE WHEN u.first_name IS NOT NULL AND u.last_name IS NOT NULL 
                AND pp.age IS NOT NULL AND pp.gender IS NOT NULL THEN 1 END) as complete_profiles
FROM users u
LEFT JOIN patient_profiles pp ON u.id = pp.user_id
WHERE u.user_type = 'PATIENT';
