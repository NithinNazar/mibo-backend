-- ============================================================================
-- PRODUCTION DATABASE - UPDATE EXISTING USER TO SAMEER
-- ============================================================================
-- ⚠️  IMPORTANT: Run production-check-sameer.sql FIRST to verify user exists!
-- ⚠️  This will UPDATE an existing user with phone: 918218330353
-- ============================================================================

-- SAFETY CHECK: Verify user exists before updating
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count
    FROM users
    WHERE phone = '918218330353';
    
    IF user_count = 0 THEN
        RAISE EXCEPTION 'User with phone 918218330353 does NOT exist. Use production-add-sameer.sql instead.';
    END IF;
    
    RAISE NOTICE 'User found. Proceeding with update...';
END $$;

-- ============================================================================
-- BACKUP: Show current data before update (for rollback if needed)
-- ============================================================================
SELECT 
    'BEFORE UPDATE' as status,
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
-- UPDATE TRANSACTION
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

-- Show updated data
SELECT 
    'AFTER UPDATE' as status,
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

-- ⚠️  REVIEW THE RESULTS ABOVE BEFORE COMMITTING!
-- If everything looks correct, run: COMMIT;
-- If something is wrong, run: ROLLBACK;

-- Uncomment ONE of these lines after reviewing:
-- COMMIT;    -- ✅ Apply changes
-- ROLLBACK;  -- ❌ Undo changes

-- ============================================================================
-- VERIFICATION AFTER COMMIT
-- ============================================================================
-- Run this after COMMIT to verify:
SELECT 
    u.id as user_id,
    u.full_name,
    u.phone,
    u.email,
    u.user_type,
    pp.registration_fee_paid,
    pp.registration_fee_paid_at,
    u.updated_at
FROM users u
LEFT JOIN patient_profiles pp ON u.id = pp.user_id
WHERE u.phone = '918218330353';

-- Expected Result:
-- ✅ full_name: Sameer
-- ✅ email: sameer@gmail.com
-- ✅ registration_fee_paid: true
-- ✅ registration_fee_paid_at: 2026-01-15 10:00:00+00
