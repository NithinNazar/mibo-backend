-- ============================================================================
-- PRODUCTION DATABASE - SPECIFIC CHECK FOR PHONE 918218330353
-- ============================================================================
-- This will show ONLY the user with this specific phone number
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
    u.created_at,
    u.updated_at
FROM users u
LEFT JOIN patient_profiles pp ON u.id = pp.user_id
WHERE u.phone = '918218330353';

-- ============================================================================
-- If this returns a row, the user EXISTS
-- If this returns no rows, there might be a database connection issue
-- ============================================================================
