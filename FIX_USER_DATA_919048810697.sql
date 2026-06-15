-- =====================================================================
-- Fix User Data for Phone: 919048810697
-- =====================================================================
-- This script will correct the first_name, last_name, age, gender, and date_of_birth
-- for the user with phone number 919048810697

-- Step 1: Update users table with correct names
UPDATE users
SET 
    first_name = 'Nithin',
    last_name = 'Nazar',
    full_name = 'Nithin Nazar'
WHERE phone = '919048810697';

-- Step 2: Update patient_profiles table with age, gender, and date_of_birth
UPDATE patient_profiles
SET 
    age = 32,
    gender = 'MALE',
    date_of_birth = '1994-03-18'::date
WHERE user_id = (SELECT id FROM users WHERE phone = '919048810697');

-- Step 3: Verify the updates
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
