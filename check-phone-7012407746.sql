-- ============================================================================
-- CHECK IF PHONE 7012407746 EXISTS IN PRODUCTION
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
    u.updated_at,
    CASE 
        WHEN pp.registration_fee_paid = true THEN '✅ Already paid - No action needed'
        WHEN pp.registration_fee_paid = false THEN '⚠️ Not paid - Needs update'
        ELSE '❌ No profile found'
    END as action_needed
FROM users u
LEFT JOIN patient_profiles pp ON u.id = pp.user_id
WHERE u.phone = '7012407746' OR u.phone = '917012407746';

-- ============================================================================
-- INTERPRETATION:
-- ============================================================================
-- If NO rows returned → User does NOT exist
-- If registration_fee_paid = true → Already correct, no action needed
-- If registration_fee_paid = false → Run update script
-- ============================================================================
