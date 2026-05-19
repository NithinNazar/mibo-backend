-- ============================================================================
-- UPDATE EXISTING USER (Phone: 918218330353) TO SAMEER
-- ============================================================================
-- Current: Name = "TM", Email = null, registration_fee_paid = false
-- Update to: Name = "Sameer", Email = "sameer@gmail.com", registration_fee_paid = true
-- ============================================================================

BEGIN;

-- Update users table
UPDATE users
SET 
    full_name = 'Sameer',
    email = 'sameer@gmail.com',
    updated_at = NOW()
WHERE phone = '918218330353';

-- Update patient_profiles table
UPDATE patient_profiles
SET 
    registration_fee_paid = true,
    registration_fee_paid_at = '2026-01-15 10:00:00+00',
    updated_at = NOW()
WHERE user_id = (
    SELECT id FROM users WHERE phone = '918218330353'
);

COMMIT;

-- ============================================================================
-- VERIFICATION: Check updated data
-- ============================================================================

SELECT 
    u.id as user_id,
    u.full_name,
    u.phone,
    u.email,
    u.user_type,
    pp.id as profile_id,
    pp.registration_fee_paid,
    pp.registration_fee_paid_at,
    u.updated_at
FROM users u
LEFT JOIN patient_profiles pp ON u.id = pp.user_id
WHERE u.phone = '918218330353';

-- Expected Result:
-- ✅ full_name: Sameer (updated from "TM")
-- ✅ email: sameer@gmail.com (updated from null)
-- ✅ registration_fee_paid: true (updated from false)
-- ✅ registration_fee_paid_at: 2026-01-15 10:00:00+00
