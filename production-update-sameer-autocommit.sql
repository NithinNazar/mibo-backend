-- ============================================================================
-- PRODUCTION DATABASE - UPDATE SAMEER (AUTO-COMMIT VERSION)
-- ============================================================================
-- ⚠️  WARNING: This will IMMEDIATELY apply changes when executed!
-- ⚠️  Make sure you've verified the user exists with production-check-sameer-specific.sql
-- ============================================================================
-- Phone: 918218330353
-- Changes: TM → Sameer, null → sameer@gmail.com, registration_fee_paid → true
-- ============================================================================

-- Show current data BEFORE update
SELECT 
    '🔍 BEFORE UPDATE' as status,
    u.id as user_id,
    u.full_name,
    u.phone,
    u.email,
    pp.registration_fee_paid,
    pp.registration_fee_paid_at
FROM users u
LEFT JOIN patient_profiles pp ON u.id = pp.user_id
WHERE u.phone = '918218330353';

-- ============================================================================
-- UPDATE (will commit automatically)
-- ============================================================================

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

-- Show updated data AFTER update
SELECT 
    '✅ AFTER UPDATE' as status,
    u.id as user_id,
    u.full_name,
    u.phone,
    u.email,
    pp.registration_fee_paid,
    pp.registration_fee_paid_at,
    u.updated_at
FROM users u
LEFT JOIN patient_profiles pp ON u.id = pp.user_id
WHERE u.phone = '918218330353';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT 
    '🎉 UPDATE COMPLETE!' as message,
    'Sameer can now book appointments without ₹100 registration fee' as note;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- The changes are now PERMANENT. Verify the final state:

SELECT 
    u.id as user_id,
    u.full_name,
    u.phone,
    u.email,
    u.user_type,
    pp.registration_fee_paid,
    pp.registration_fee_paid_at,
    CASE 
        WHEN pp.registration_fee_paid = true THEN '✅ Will NOT pay ₹100 registration fee'
        ELSE '❌ Will pay ₹100 registration fee'
    END as booking_status
FROM users u
LEFT JOIN patient_profiles pp ON u.id = pp.user_id
WHERE u.phone = '918218330353';

-- ============================================================================
-- Expected Final Result:
-- ============================================================================
-- ✅ user_id: 59
-- ✅ full_name: Sameer (changed from TM)
-- ✅ phone: 918218330353
-- ✅ email: sameer@gmail.com (changed from null)
-- ✅ registration_fee_paid: true (changed from false)
-- ✅ registration_fee_paid_at: 2026-01-15 10:00:00+00
-- ✅ booking_status: Will NOT pay ₹100 registration fee
-- ============================================================================
