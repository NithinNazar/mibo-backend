-- ============================================================================
-- ADD PATIENT: Sameer (Existing User - Registration Fee Already Paid)
-- ============================================================================
-- Name: Sameer
-- Email: sameer@gmail.com
-- Phone: 918218330353
-- Registration Fee: PAID (existing user)
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
    ) RETURNING id
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
FROM new_user;

COMMIT;

-- ============================================================================
-- VERIFICATION: Check if Sameer was added successfully
-- ============================================================================

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
    u.created_at
FROM users u
LEFT JOIN patient_profiles pp ON u.id = pp.user_id
WHERE u.phone = '918218330353'
ORDER BY u.created_at DESC;

-- Expected Result:
-- ✅ user_id: (auto-generated)
-- ✅ full_name: Sameer
-- ✅ phone: 918218330353
-- ✅ email: sameer@gmail.com
-- ✅ registration_fee_paid: true
-- ✅ registration_fee_paid_at: 2026-01-15 10:00:00+00
-- 
-- This means Sameer will NOT be charged ₹100 registration fee during booking
-- He will only pay the consultation fee
