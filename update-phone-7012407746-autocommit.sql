-- ============================================================================
-- UPDATE REGISTRATION FEE FOR PHONE 7012407746 (AUTO-COMMIT)
-- ============================================================================
-- ⚠️  WARNING: This will IMMEDIATELY apply changes when executed!
-- ⚠️  Run check-phone-7012407746.sql FIRST to verify user exists!
-- ============================================================================
-- Changes: registration_fee_paid → true, registration_fee_paid_at → past date
-- ============================================================================

-- Show current data BEFORE update
SELECT 
    '🔍 BEFORE UPDATE' as status,
    u.id as user_id,
    u.full_name,
    u.phone,
    u.email,
    pp.registration_fee_paid,
    pp.registration_fee_paid_at,
    CASE 
        WHEN pp.registration_fee_paid = true THEN 'Already paid ✅'
        ELSE 'Not paid ❌'
    END as current_status
FROM users u
LEFT JOIN patient_profiles pp ON u.id = pp.user_id
WHERE u.phone = '7012407746' OR u.phone = '917012407746';

-- ============================================================================
-- UPDATE (will commit automatically)
-- ============================================================================

-- Update patient_profiles table to mark registration fee as paid
UPDATE patient_profiles
SET 
    registration_fee_paid = true,
    registration_fee_paid_at = '2026-01-10 09:00:00+00',  -- Past date: Jan 10, 2026
    updated_at = NOW()
WHERE user_id IN (
    SELECT id FROM users WHERE phone = '7012407746' OR phone = '917012407746'
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
    u.updated_at,
    CASE 
        WHEN pp.registration_fee_paid = true THEN 'Paid ✅'
        ELSE 'Not paid ❌'
    END as new_status
FROM users u
LEFT JOIN patient_profiles pp ON u.id = pp.user_id
WHERE u.phone = '7012407746' OR u.phone = '917012407746';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT 
    '🎉 UPDATE COMPLETE!' as message,
    'User with phone 7012407746 will NOT be charged ₹100 registration fee' as note;

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================
SELECT 
    u.id as user_id,
    u.full_name,
    u.phone,
    u.email,
    pp.registration_fee_paid,
    pp.registration_fee_paid_at,
    CASE 
        WHEN pp.registration_fee_paid = true THEN '✅ Will NOT pay ₹100 registration fee'
        ELSE '❌ Will pay ₹100 registration fee'
    END as booking_status
FROM users u
LEFT JOIN patient_profiles pp ON u.id = pp.user_id
WHERE u.phone = '7012407746' OR u.phone = '917012407746';

-- ============================================================================
-- Expected Result:
-- ============================================================================
-- ✅ registration_fee_paid: true (changed from false)
-- ✅ registration_fee_paid_at: 2026-01-10 09:00:00+00 (set to past date)
-- ✅ booking_status: Will NOT pay ₹100 registration fee
-- ============================================================================
