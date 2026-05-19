-- ============================================================================
-- PRODUCTION DATABASE - CHECK IF SAMEER EXISTS
-- ============================================================================
-- Run this in pgAdmin connected to PRODUCTION database
-- Phone: 918218330353
-- ============================================================================

-- Step 1: Check if user exists with this phone number
SELECT 
    u.id as user_id,
    u.full_name,
    u.phone,
    u.email,
    u.user_type,
    u.is_active as user_active,
    pp.id as profile_id,
    pp.mrn,
    pp.registration_fee_paid,
    pp.registration_fee_paid_at,
    pp.is_active as profile_active,
    u.created_at,
    u.updated_at
FROM users u
LEFT JOIN patient_profiles pp ON u.id = pp.user_id
WHERE u.phone = '918218330353'
ORDER BY u.created_at DESC;

-- ============================================================================
-- INTERPRETATION OF RESULTS:
-- ============================================================================
-- 
-- CASE 1: No rows returned
--   → User does NOT exist in production
--   → You need to CREATE a new user (use production-add-sameer.sql)
--
-- CASE 2: User exists with correct details
--   → full_name = 'Sameer'
--   → email = 'sameer@gmail.com'
--   → registration_fee_paid = true
--   → No action needed! ✅
--
-- CASE 3: User exists but details are wrong
--   → full_name is different (e.g., 'TM')
--   → email is null or different
--   → registration_fee_paid = false
--   → You need to UPDATE the user (use production-update-sameer.sql)
--
-- ============================================================================

-- Additional check: Count total patients in production
SELECT COUNT(*) as total_patients
FROM users
WHERE user_type = 'PATIENT';

-- Check recent patients (last 5)
SELECT 
    u.id,
    u.full_name,
    u.phone,
    u.email,
    pp.registration_fee_paid,
    u.created_at
FROM users u
LEFT JOIN patient_profiles pp ON u.id = pp.user_id
WHERE u.user_type = 'PATIENT'
ORDER BY u.created_at DESC
LIMIT 5;
