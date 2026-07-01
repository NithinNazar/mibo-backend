-- ============================================================================
-- PRODUCTION DATABASE CLEANUP
-- ============================================================================
-- ⚠️⚠️⚠️ CRITICAL WARNING ⚠️⚠️⚠️
-- This script permanently deletes production data!
-- 1. BACKUP YOUR PRODUCTION DATABASE FIRST!
-- 2. Run PRODUCTION_VERIFY_BEFORE_CLEANUP.sql first
-- 3. Review what will be deleted and kept
-- 4. Only proceed if you're certain
-- ============================================================================
-- Purpose: Clean all test/patient data from production
-- Date: 2026-06-25
-- 
-- DELETES:
-- - All patient users and profiles
-- - All appointments and payments
-- - All blocked slots and exceptions
-- - All inactive clinicians
-- - All notifications
-- - All auth sessions
--
-- KEEPS:
-- - All staff users (Admin, Front Desk, Managers, Care Coordinators)
-- - All active clinicians
-- - All availability rules for active clinicians
-- - All user roles and permissions
-- ============================================================================

SELECT '===== ⚠️ STARTING PRODUCTION CLEANUP ⚠️ =====' as section;
SELECT NOW() as cleanup_started_at;

-- ============================================================================
-- STEP 1: Delete ALL appointment-related data first
-- ============================================================================

SELECT '===== Step 1: Deleting ALL appointment-related data =====' as section;

-- Delete follow-up appointments
DO $$
DECLARE deleted_count INTEGER;
BEGIN
    DELETE FROM follow_up_appointments;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted follow-up appointments: %', deleted_count;
END $$;

-- Delete clinician notes history
DO $$
DECLARE deleted_count INTEGER;
BEGIN
    DELETE FROM clinician_notes_history;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted clinician notes history: %', deleted_count;
END $$;

-- Delete appointment status history
DO $$
DECLARE deleted_count INTEGER;
BEGIN
    DELETE FROM appointment_status_history;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted appointment status history: %', deleted_count;
END $$;

-- Delete video sessions
DO $$
DECLARE deleted_count INTEGER;
BEGIN
    DELETE FROM video_sessions;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted video sessions: %', deleted_count;
END $$;

-- Delete patient notifications
DO $$
DECLARE deleted_count INTEGER;
BEGIN
    DELETE FROM patient_notifications;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted patient notifications: %', deleted_count;
END $$;

-- Delete payments
DO $$
DECLARE deleted_count INTEGER;
BEGIN
    DELETE FROM payments;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted payments: %', deleted_count;
END $$;

-- Delete ALL appointments
DO $$
DECLARE deleted_count INTEGER;
BEGIN
    DELETE FROM appointments;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted appointments: %', deleted_count;
END $$;

-- ============================================================================
-- STEP 2: Clean up slot blocks and exceptions
-- ============================================================================

SELECT '===== Step 2: Cleaning slot blocks and exceptions =====' as section;

DO $$
DECLARE deleted_count INTEGER;
BEGIN
    DELETE FROM slot_blocking_audit;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted slot blocking audit: %', deleted_count;
    
    DELETE FROM blocked_slots;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted blocked slots: %', deleted_count;
    
    DELETE FROM clinician_slot_exceptions;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted slot exceptions: %', deleted_count;
END $$;

-- ============================================================================
-- STEP 3: Delete patient data (with ALL foreign key dependencies)
-- ============================================================================

SELECT '===== Step 3: Deleting patient data with ALL dependencies =====' as section;

DO $$
DECLARE
    patient_count INTEGER;
    deleted_count INTEGER;
BEGIN
    -- Count patients
    SELECT COUNT(*) INTO patient_count FROM users WHERE user_type = 'PATIENT';
    RAISE NOTICE 'Found patient users: %', patient_count;
    
    -- Delete notifications for patients (this was the critical missing piece!)
    DELETE FROM notifications
    WHERE user_id IN (SELECT id FROM users WHERE user_type = 'PATIENT');
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted notifications for patients: %', deleted_count;
    
    -- Delete auth sessions for patients
    DELETE FROM auth_sessions
    WHERE user_id IN (SELECT id FROM users WHERE user_type = 'PATIENT');
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted auth sessions for patients: %', deleted_count;
    
    -- Delete user_roles for patients
    DELETE FROM user_roles
    WHERE user_id IN (SELECT id FROM users WHERE user_type = 'PATIENT');
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted user roles for patients: %', deleted_count;
    
    -- Delete patient profiles
    DELETE FROM patient_profiles;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted patient profiles: %', deleted_count;
    
    -- Delete patient users (now safe - all foreign keys handled)
    DELETE FROM users WHERE user_type = 'PATIENT';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted patient users: %', deleted_count;
END $$;

-- ============================================================================
-- STEP 4: Delete inactive clinicians (with ALL dependencies)
-- ============================================================================

SELECT '===== Step 4: Deleting inactive clinicians =====' as section;

DO $$
DECLARE
    inactive_count INTEGER;
    deleted_count INTEGER;
BEGIN
    -- Count inactive clinicians
    SELECT COUNT(*) INTO inactive_count FROM clinician_profiles WHERE is_active = false;
    RAISE NOTICE 'Found inactive clinicians: %', inactive_count;
    
    -- Create temp table
    CREATE TEMP TABLE IF NOT EXISTS temp_inactive_clinicians AS
    SELECT id, user_id FROM clinician_profiles WHERE is_active = false;
    
    -- Delete availability rules
    DELETE FROM clinician_availability_rules
    WHERE clinician_id IN (SELECT id FROM temp_inactive_clinicians);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted availability rules for inactive clinicians: %', deleted_count;
    
    -- Delete notifications for inactive clinicians
    DELETE FROM notifications
    WHERE user_id IN (SELECT user_id FROM temp_inactive_clinicians);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted notifications for inactive clinicians: %', deleted_count;
    
    -- Delete auth sessions
    DELETE FROM auth_sessions
    WHERE user_id IN (SELECT user_id FROM temp_inactive_clinicians);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted auth sessions for inactive clinicians: %', deleted_count;
    
    -- Delete user roles
    DELETE FROM user_roles
    WHERE user_id IN (SELECT user_id FROM temp_inactive_clinicians);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted user roles for inactive clinicians: %', deleted_count;
    
    -- Delete centre assignments
    DELETE FROM centre_staff_assignments
    WHERE user_id IN (SELECT user_id FROM temp_inactive_clinicians);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted centre assignments for inactive clinicians: %', deleted_count;
    
    -- Delete staff profiles
    DELETE FROM staff_profiles
    WHERE user_id IN (SELECT user_id FROM temp_inactive_clinicians);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted staff profiles for inactive clinicians: %', deleted_count;
    
    -- Delete clinician profiles
    DELETE FROM clinician_profiles WHERE is_active = false;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted inactive clinician profiles: %', deleted_count;
    
    -- Delete user accounts
    DELETE FROM users
    WHERE id IN (SELECT user_id FROM temp_inactive_clinicians);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted user accounts for inactive clinicians: %', deleted_count;
    
    DROP TABLE IF EXISTS temp_inactive_clinicians;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT '===== IMMEDIATE VERIFICATION =====' as section;

SELECT 'Patients remaining' as item, COUNT(*) as count FROM users WHERE user_type = 'PATIENT';
SELECT 'Patient profiles remaining' as item, COUNT(*) as count FROM patient_profiles;
SELECT 'Appointments remaining' as item, COUNT(*) as count FROM appointments;
SELECT 'Payments remaining' as item, COUNT(*) as count FROM payments;
SELECT 'Inactive clinicians remaining' as item, COUNT(*) as count FROM clinician_profiles WHERE is_active = false;
SELECT 'Auth sessions (patient)' as item, COUNT(*) as count FROM auth_sessions WHERE user_id IN (SELECT id FROM users WHERE user_type = 'PATIENT');
SELECT 'Notifications (patient)' as item, COUNT(*) as count FROM notifications WHERE user_id IN (SELECT id FROM users WHERE user_type = 'PATIENT');

SELECT '===== PRODUCTION CLEANUP COMPLETE =====' as section;
SELECT NOW() as cleanup_completed_at;
SELECT 'All test data deleted from PRODUCTION' as result;
SELECT 'Run PRODUCTION_VERIFY_AFTER_CLEANUP.sql for full verification' as next_step;

-- ============================================================================
-- END OF PRODUCTION CLEANUP
-- ============================================================================
