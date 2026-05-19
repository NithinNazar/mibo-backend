-- ============================================================================
-- PRODUCTION DATABASE - ADD NEW USER SAMEER
-- ============================================================================
-- ⚠️  IMPORTANT: Run production-check-sameer.sql FIRST to verify user doesn't exist!
-- ⚠️  This will CREATE a new user with phone: 918218330353
-- ============================================================================

-- SAFETY CHECK: Verify user doesn't already exist
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count
    FROM users
    WHERE phone = '918218330353';
    
    IF user_count > 0 THEN
        RAISE EXCEPTION 'User with phone 918218330353 already EXISTS. Use production-update-sameer.sql instead.';
    END IF;
    
    RAISE NOTICE 'Phone number available. Proceeding with creation...';
END $$;

-- ============================================================================
-- CREATE NEW USER TRANSACTION
-- ============================================================================
BEGIN;

-- Insert user and create patient profile in one transaction
WITH new_user AS (
    INSERT INTO users (
        phone,
        email,
        full_name,
        user_type,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        '918218330353',              -- Sameer's phone
        'sameer@gmail.com',          -- Sameer's email
        'Sameer',                    -- Full name
        'PATIENT',                   -- User type
        true,                        -- Active user
        NOW(),                       -- Created timestamp
        NOW()                        -- Updated timestamp
    ) RETURNING id, full_name, phone, email
)
-- Create patient profile with registration fee already paid
INSERT INTO patient_profiles (
    user_id,
    registration_fee_paid,
    registration_fee_paid_at,
    is_active,
    created_at,
    updated_at
)
SELECT 
    id,                              -- user_id from new_user
    true,                            -- Registration fee PAID
    '2026-01-15 10:00:00+00',       -- Past timestamp (Jan 15, 2026)
    true,                            -- Active profile
    NOW(),                           -- Created timestamp
    NOW()                            -- Updated timestamp
FROM new_user
RETURNING user_id;

-- Show created user
SELECT 
    'NEW USER CREATED' as status,
    u.id as user_id,
    u.full_name,
    u.phone,
    u.email,
    u.user_type,
    pp.registration_fee_paid,
    pp.registration_fee_paid_at,
    u.created_at
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
    pp.id as profile_id,
    pp.registration_fee_paid,
    pp.registration_fee_paid_at,
    u.created_at
FROM users u
LEFT JOIN patient_profiles pp ON u.id = pp.user_id
WHERE u.phone = '918218330353';

-- Expected Result:
-- ✅ full_name: Sameer
-- ✅ phone: 918218330353
-- ✅ email: sameer@gmail.com
-- ✅ registration_fee_paid: true
-- ✅ registration_fee_paid_at: 2026-01-15 10:00:00+00
