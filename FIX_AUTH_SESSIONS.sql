-- ============================================================================
-- FIX SCRIPT: Clean up remaining auth_sessions after partial cleanup
-- ============================================================================
-- Purpose: Delete auth sessions that are blocking patient user deletion
-- Run this if you got the foreign key error
-- ============================================================================

SELECT '===== CLEANING UP AUTH SESSIONS =====' as section;

-- Delete auth sessions for all patient users
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM auth_sessions
    WHERE user_id IN (
        SELECT id FROM users WHERE user_type = 'PATIENT'
    );
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted auth sessions for patients: %', deleted_count;
END $$;

-- Delete auth sessions for inactive clinicians
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM auth_sessions
    WHERE user_id IN (
        SELECT user_id FROM clinician_profiles WHERE is_active = false
    );
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted auth sessions for inactive clinicians: %', deleted_count;
END $$;

-- Now delete remaining patient profiles and users
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete any remaining patient profiles
    DELETE FROM patient_profiles
    WHERE user_id IN (SELECT id FROM users WHERE user_type = 'PATIENT');
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted remaining patient profiles: %', deleted_count;
    
    -- Delete patient users
    DELETE FROM users WHERE user_type = 'PATIENT';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted remaining patient users: %', deleted_count;
END $$;

SELECT '===== FIX COMPLETE =====' as section;
SELECT 'Now run VERIFY_AFTER_CLEANUP.sql to check results' as next_step;
