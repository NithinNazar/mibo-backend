-- ============================================================================
-- MANUAL PATIENT USER CREATION SCRIPT
-- ============================================================================
-- This script creates a new patient user in the database
-- Run this in pgAdmin Query Tool
-- ============================================================================

-- STEP 1: Insert into users table
-- Replace the values with actual patient information
INSERT INTO users (
    phone,
    email,
    full_name,
    user_type,
    is_active,
    created_at,
    updated_at
) VALUES (
    '919876543210',              -- Phone number (required, must be unique)
    'patient@example.com',       -- Email (optional, can be NULL)
    'John Doe',                  -- Full name (required)
    'PATIENT',                   -- User type (must be 'PATIENT')
    true,                        -- Is active (true/false)
    NOW(),                       -- Created timestamp
    NOW()                        -- Updated timestamp
) RETURNING id;                  -- This will return the user_id

-- IMPORTANT: Note the returned 'id' from above query
-- You'll need it for the next step

-- ============================================================================
-- STEP 2: Insert into patient_profiles table
-- Replace <USER_ID> with the id returned from STEP 1
-- ============================================================================

INSERT INTO patient_profiles (
    user_id,
    date_of_birth,
    gender,
    blood_group,
    emergency_contact_name,
    emergency_contact_phone,
    notes,
    mrn,
    registration_fee_paid,
    registration_fee_paid_at,
    is_active,
    created_at,
    updated_at
) VALUES (
    <USER_ID>,                   -- Replace with user_id from STEP 1
    '1990-01-15',                -- Date of birth (optional, format: YYYY-MM-DD)
    'male',                      -- Gender: 'male', 'female', 'other' (optional)
    'O+',                        -- Blood group (optional)
    'Jane Doe',                  -- Emergency contact name (optional)
    '919876543211',              -- Emergency contact phone (optional)
    'Patient has anxiety',       -- Clinical notes (optional)
    'MRN2024001',                -- Medical Record Number (optional, must be unique)
    false,                       -- Registration fee paid (true/false)
    NULL,                        -- Registration fee paid timestamp (NULL if not paid)
    true,                        -- Is active (true/false)
    NOW(),                       -- Created timestamp
    NOW()                        -- Updated timestamp
);

-- ============================================================================
-- ALTERNATIVE: Single Transaction (Recommended)
-- ============================================================================
-- This approach does both steps in one transaction
-- Safer and ensures data consistency

BEGIN;

-- Insert user and get the ID
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
        '919876543210',              -- Phone number (CHANGE THIS)
        'patient@example.com',       -- Email (optional)
        'John Doe',                  -- Full name (CHANGE THIS)
        'PATIENT',
        true,
        NOW(),
        NOW()
    ) RETURNING id
)
-- Insert patient profile using the new user ID
INSERT INTO patient_profiles (
    user_id,
    date_of_birth,
    gender,
    blood_group,
    emergency_contact_name,
    emergency_contact_phone,
    notes,
    mrn,
    registration_fee_paid,
    registration_fee_paid_at,
    is_active,
    created_at,
    updated_at
)
SELECT 
    id,                          -- user_id from new_user
    '1990-01-15',                -- Date of birth (optional)
    'male',                      -- Gender (optional)
    'O+',                        -- Blood group (optional)
    'Jane Doe',                  -- Emergency contact name (optional)
    '919876543211',              -- Emergency contact phone (optional)
    'Patient has anxiety',       -- Clinical notes (optional)
    'MRN2024001',                -- MRN (optional, must be unique if provided)
    false,                       -- Registration fee paid
    NULL,                        -- Registration fee paid timestamp
    true,                        -- Is active
    NOW(),                       -- Created timestamp
    NOW()                        -- Updated timestamp
FROM new_user;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if user was created successfully
SELECT 
    u.id as user_id,
    u.full_name,
    u.phone,
    u.email,
    u.user_type,
    pp.id as profile_id,
    pp.mrn,
    pp.registration_fee_paid
FROM users u
LEFT JOIN patient_profiles pp ON u.id = pp.user_id
WHERE u.phone = '919876543210'  -- Replace with the phone number you used
ORDER BY u.created_at DESC;

-- ============================================================================
-- EXAMPLE: Create a NEW USER (First time patient)
-- ============================================================================

BEGIN;

WITH new_user AS (
    INSERT INTO users (
        phone,
        email,
        full_name,
        user_type,
        is_active
    ) VALUES (
        '919999888877',              -- New phone number
        'newpatient@example.com',    -- Email
        'Alice Smith',               -- Full name
        'PATIENT',
        true
    ) RETURNING id
)
INSERT INTO patient_profiles (
    user_id,
    registration_fee_paid,
    is_active
)
SELECT 
    id,
    false,                       -- New user hasn't paid registration fee
    true
FROM new_user;

COMMIT;

-- ============================================================================
-- EXAMPLE: Create an EXISTING USER (Already paid registration fee)
-- ============================================================================

BEGIN;

WITH new_user AS (
    INSERT INTO users (
        phone,
        email,
        full_name,
        user_type,
        is_active
    ) VALUES (
        '919999888866',              -- Existing patient phone
        'existing@example.com',      -- Email
        'Bob Johnson',               -- Full name
        'PATIENT',
        true
    ) RETURNING id
)
INSERT INTO patient_profiles (
    user_id,
    mrn,
    registration_fee_paid,
    registration_fee_paid_at,
    is_active
)
SELECT 
    id,
    'MRN2024002',                -- Assign MRN
    true,                        -- Already paid registration fee
    NOW(),                       -- Paid timestamp
    true
FROM new_user;

COMMIT;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. Phone number must be unique (will fail if duplicate)
-- 2. Email can be NULL or unique
-- 3. MRN must be unique if provided
-- 4. user_type must be 'PATIENT' for patients
-- 5. registration_fee_paid determines if ₹100 fee is charged during booking
-- 6. All optional fields can be NULL
-- ============================================================================
