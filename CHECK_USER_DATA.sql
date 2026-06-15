-- =====================================================================
-- Check User Data for Phone: 919048810697
-- =====================================================================
-- This query will show all user and profile data to debug the display issue

-- Step 1: Check users table data
SELECT 
    id,
    phone,
    first_name,
    last_name,
    full_name,
    email,
    user_type,
    created_at
FROM users
WHERE phone = '919048810697';

-- Step 2: Check patient_profiles table data
SELECT 
    pp.id,
    pp.user_id,
    pp.age,
    pp.gender,
    pp.date_of_birth,
    pp.blood_group,
    pp.created_at,
    pp.updated_at
FROM patient_profiles pp
JOIN users u ON u.id = pp.user_id
WHERE u.phone = '919048810697';

-- Step 3: Check combined data (what the API returns)
SELECT 
    u.id as user_id,
    u.phone,
    u.first_name,
    u.last_name,
    u.full_name,
    u.email,
    pp.id as profile_id,
    pp.age,
    pp.gender,
    pp.date_of_birth
FROM users u
LEFT JOIN patient_profiles pp ON u.id = pp.user_id
WHERE u.phone = '919048810697';
