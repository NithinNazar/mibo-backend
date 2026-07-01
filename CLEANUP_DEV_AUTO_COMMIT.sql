-- ============================================================================
-- DATABASE CLEANUP SCRIPT - AUTO COMMIT VERSION (DEVELOPMENT ONLY)
-- ============================================================================
-- Purpose: Remove all test patient data - AUTO COMMITS changes
-- Date: 2026-06-25
-- 
-- ⚠️ WARNING: This script AUTOMATICALLY COMMITS changes - NO UNDO!
-- ⚠️ FOR DEVELOPMENT DATABASE ONLY - TEST HERE FIRST!
-- ⚠️ BACKUP your database before running this script
-- 
-- RUN VERIFY_BEFORE_CLEANUP.sql FIRST to see what will be deleted!
-- ============================================================================

-- Display warning
SELECT '⚠️⚠️⚠️ AUTO-COMMIT MODE - CHANGES ARE PERMANENT ⚠️⚠️⚠️' as warning;
SELECT 'This script will immediately delete data - no undo available' as warning;
SELECT 'Press CANCEL now if you have not reviewed VERIFY_BEFORE_CLEANUP.sql' as warning;
SELECT 'Continuing in 3 seconds...' as warning;

-- Small delay to allow reading warnings (PostgreSQL specific)
SELECT pg_sleep(3);

-- ============================================================================
-- SECTION 1: DISPLAY CLEANUP PLAN
-- ============================================================================

SELECT '===== STARTING CLEANUP PROCESS =====' as section;
SELECT NOW() as start_time;

-- ============================================================================
-- SECTION 2: DELETE APPOINTMENT-RELATED DATA
-- ============================================================================

SELECT '===== DELETING APPOINTMENT-RELATED DATA =====' as section;

-- Delete follow-up appointments first
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM follow_up_appointments;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted follow-up appointments: %', deleted_count;
END $$;

-- Delete clinician notes history
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM clinician_notes_history;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted clinician notes history: %', deleted_count;
END $$;

-- Delete appointment status history
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM appointment_status_history;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted appointment status history: %', deleted_count;
END $$;

-- Delete video sessions
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM video_sessions;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted video sessions: %', deleted_count;
END $$;

-- Delete patient notifications
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM patient_notifications;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted patient notifications: %', deleted_count;
END $$;

-- Delete payments
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM payments;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted payments: %', deleted_count;
END $$;

-- Delete appointments
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM appointments;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted appointments: %', deleted_count;
END $$;

-- ============================================================================
-- SECTION 3: DELETE SLOT BLOCKING AND EXCEPTIONS DATA
-- ============================================================================

SELECT '===== CLEARING SLOT BLOCKS AND EXCEPTIONS =====' as section;

-- Delete slot blocking audit
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM slot_blocking_audit;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted slot blocking audit records: %', deleted_count;
END $$;

-- Delete blocked slots
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM blocked_slots;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted blocked slots: %', deleted_count;
END $$;

-- Delete slot exceptions
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM clinician_slot_exceptions;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted slot exceptions: %', deleted_count;
END $$;

-- ============================================================================
-- SECTION 4: DELETE INACTIVE CLINICIANS AND THEIR DATA
-- ============================================================================

SELECT '===== DELETING INACTIVE CLINICIANS =====' as section;

-- Delete all data related to inactive clinicians
DO $$
DECLARE
    inactive_clinician_count INTEGER;
    deleted_count INTEGER;
BEGIN
    -- Store inactive clinician IDs
    CREATE TEMP TABLE IF NOT EXISTS temp_inactive_clinicians AS
    SELECT id, user_id FROM clinician_profiles WHERE is_active = false;
    
    SELECT COUNT(*) INTO inactive_clinician_count FROM temp_inactive_clinicians;
    RAISE NOTICE 'Found inactive clinicians: %', inactive_clinician_count;
    
    -- Delete availability rules for inactive clinicians
    DELETE FROM clinician_availability_rules
    WHERE clinician_id IN (SELECT id FROM temp_inactive_clinicians);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted availability rules for inactive clinicians: %', deleted_count;
    
    -- Delete user_roles for inactive clinicians
    DELETE FROM user_roles
    WHERE user_id IN (SELECT user_id FROM temp_inactive_clinicians);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted user roles for inactive clinicians: %', deleted_count;
    
    -- Delete centre staff assignments for inactive clinicians
    DELETE FROM centre_staff_assignments
    WHERE user_id IN (SELECT user_id FROM temp_inactive_clinicians);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted centre assignments for inactive clinicians: %', deleted_count;
    
    -- Delete auth sessions for inactive clinicians
    DELETE FROM auth_sessions
    WHERE user_id IN (SELECT user_id FROM temp_inactive_clinicians);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted auth sessions for inactive clinicians: %', deleted_count;
    
    -- Delete staff profiles for inactive clinicians
    DELETE FROM staff_profiles
    WHERE user_id IN (SELECT user_id FROM temp_inactive_clinicians);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted staff profiles for inactive clinicians: %', deleted_count;
    
    -- Delete inactive clinician profiles
    DELETE FROM clinician_profiles
    WHERE id IN (SELECT id FROM temp_inactive_clinicians);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted inactive clinician profiles: %', deleted_count;
    
    -- Delete user accounts for inactive clinicians
    DELETE FROM users
    WHERE id IN (SELECT user_id FROM temp_inactive_clinicians);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted user accounts for inactive clinicians: %', deleted_count;
    
    -- Clean up temp table
    DROP TABLE IF EXISTS temp_inactive_clinicians;
END $$;

-- ============================================================================
-- SECTION 5: DELETE ALL PATIENT DATA
-- ============================================================================

SELECT '===== DELETING PATIENT DATA =====' as section;

-- Delete all patient-related data
DO $$
DECLARE
    patient_count INTEGER;
    deleted_count INTEGER;
BEGIN
    -- Store patient user IDs
    CREATE TEMP TABLE IF NOT EXISTS temp_patient_users AS
    SELECT id FROM users WHERE user_type = 'PATIENT';
    
    SELECT COUNT(*) INTO patient_count FROM temp_patient_users;
    RAISE NOTICE 'Found patient users: %', patient_count;
    
    -- Delete auth sessions for patients (important!)
    DELETE FROM auth_sessions
    WHERE user_id IN (SELECT id FROM temp_patient_users);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted auth sessions for patients: %', deleted_count;
    
    -- Delete user_roles for patients
    DELETE FROM user_roles
    WHERE user_id IN (SELECT id FROM temp_patient_users);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted user roles for patients: %', deleted_count;
    
    -- Delete patient profiles
    DELETE FROM patient_profiles
    WHERE user_id IN (SELECT id FROM temp_patient_users);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted patient profiles: %', deleted_count;
    
    -- Delete patient user accounts
    DELETE FROM users
    WHERE id IN (SELECT id FROM temp_patient_users);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted patient user accounts: %', deleted_count;
    
    -- Clean up temp table
    DROP TABLE IF EXISTS temp_patient_users;
END $$;

-- ============================================================================
-- SECTION 6: VERIFICATION - CHECK WHAT REMAINS
-- ============================================================================

SELECT '===== VERIFICATION OF REMAINING DATA =====' as section;

SELECT 'Staff users remaining' as category, COUNT(*) as count 
FROM users WHERE user_type = 'STAFF';

SELECT 'Active clinicians remaining' as category, COUNT(*) as count 
FROM clinician_profiles WHERE is_active = true;

SELECT 'Inactive clinicians remaining' as category, COUNT(*) as count 
FROM clinician_profiles WHERE is_active = false;

SELECT 'Patient users remaining' as category, COUNT(*) as count 
FROM users WHERE user_type = 'PATIENT';

SELECT 'Patient profiles remaining' as category, COUNT(*) as count 
FROM patient_profiles;

SELECT 'Appointments remaining' as category, COUNT(*) as count 
FROM appointments;

SELECT 'Payments remaining' as category, COUNT(*) as count 
FROM payments;

SELECT 'Blocked slots remaining' as category, COUNT(*) as count 
FROM blocked_slots;

SELECT 'Slot exceptions remaining' as category, COUNT(*) as count 
FROM clinician_slot_exceptions;

SELECT 'Availability rules (active clinicians)' as category, COUNT(*) as count 
FROM clinician_availability_rules car
WHERE EXISTS (
    SELECT 1 FROM clinician_profiles cp 
    WHERE cp.id = car.clinician_id AND cp.is_active = true
);

-- ============================================================================
-- FINAL CONFIRMATION
-- ============================================================================

SELECT '===== ✅ CLEANUP COMPLETE ✅ =====' as section;
SELECT NOW() as end_time;
SELECT 'Database cleaned successfully' as result;
SELECT 'All changes have been committed' as result;
SELECT '' as separator;
SELECT 'NEXT STEP: Run VERIFY_AFTER_CLEANUP.sql to verify everything' as next_step;

-- ============================================================================
-- END OF AUTO-COMMIT CLEANUP SCRIPT
-- ============================================================================
