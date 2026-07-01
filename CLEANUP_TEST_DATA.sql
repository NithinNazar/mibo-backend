-- ============================================================================
-- DATABASE CLEANUP SCRIPT - REMOVE TEST PATIENT DATA
-- ============================================================================
-- Purpose: Remove all test patient data while preserving real admin users and active clinicians
-- Date: 2026-06-25
-- Author: Database Cleanup Script
-- 
-- IMPORTANT: 
-- 1. RUN VERIFY_BEFORE_CLEANUP.sql FIRST and review the output
-- 2. BACKUP your database before running this script
-- 3. This script is IRREVERSIBLE - data will be permanently deleted
-- 4. Test on development database first before running on production
-- ============================================================================

-- Start transaction for safety
BEGIN;

-- ============================================================================
-- SECTION 1: DISPLAY CLEANUP PLAN
-- ============================================================================

SELECT '===== CLEANUP PLAN =====' as section;
SELECT 'This script will:' as info;
SELECT '1. DELETE: All patient users and profiles' as info;
SELECT '2. DELETE: All appointments and related data' as info;
SELECT '3. DELETE: All payments' as info;
SELECT '4. DELETE: All blocked slots and exceptions' as info;
SELECT '5. DELETE: All inactive clinicians and their data' as info;
SELECT '6. KEEP: All staff users (Admin, Front Desk, Managers, etc.)' as info;
SELECT '7. KEEP: All active clinicians and their availability rules' as info;
SELECT '' as separator;

-- ============================================================================
-- SECTION 2: DELETE APPOINTMENT-RELATED DATA (CASCADE WILL HANDLE MOST)
-- ============================================================================

SELECT '===== DELETING APPOINTMENT-RELATED DATA =====' as section;

-- Delete follow-up appointments first (references appointments)
DELETE FROM follow_up_appointments;
SELECT 'Deleted follow-up appointments: ' || ROW_COUNT() as result;

-- Delete clinician notes history (references appointments)
DELETE FROM clinician_notes_history;
SELECT 'Deleted clinician notes history: ' || ROW_COUNT() as result;

-- Delete appointment status history
DELETE FROM appointment_status_history;
SELECT 'Deleted appointment status history: ' || ROW_COUNT() as result;

-- Delete video sessions (references appointments)
DELETE FROM video_sessions;
SELECT 'Deleted video sessions: ' || ROW_COUNT() as result;

-- Delete patient notifications (references both patients and appointments)
DELETE FROM patient_notifications;
SELECT 'Deleted patient notifications: ' || ROW_COUNT() as result;

-- Delete payments (references appointments)
DELETE FROM payments;
SELECT 'Deleted payments: ' || ROW_COUNT() as result;

-- Delete appointments (this is the main table)
DELETE FROM appointments;
SELECT 'Deleted appointments: ' || ROW_COUNT() as result;

-- ============================================================================
-- SECTION 3: DELETE SLOT BLOCKING AND EXCEPTIONS DATA
-- ============================================================================

SELECT '===== CLEARING SLOT BLOCKS AND EXCEPTIONS =====' as section;

-- Delete slot blocking audit (references blocked_slots)
DELETE FROM slot_blocking_audit;
SELECT 'Deleted slot blocking audit records: ' || ROW_COUNT() as result;

-- Delete blocked slots
DELETE FROM blocked_slots;
SELECT 'Deleted blocked slots: ' || ROW_COUNT() as result;

-- Delete slot exceptions
DELETE FROM clinician_slot_exceptions;
SELECT 'Deleted slot exceptions: ' || ROW_COUNT() as result;

-- ============================================================================
-- SECTION 4: DELETE INACTIVE CLINICIANS AND THEIR DATA
-- ============================================================================

SELECT '===== DELETING INACTIVE CLINICIANS =====' as section;

-- Store inactive clinician IDs for cleanup
CREATE TEMP TABLE inactive_clinician_ids AS
SELECT id FROM clinician_profiles WHERE is_active = false;

SELECT 'Found inactive clinicians: ' || COUNT(*) as result FROM inactive_clinician_ids;

-- Delete availability rules for inactive clinicians
DELETE FROM clinician_availability_rules
WHERE clinician_id IN (SELECT id FROM inactive_clinician_ids);
SELECT 'Deleted availability rules for inactive clinicians: ' || ROW_COUNT() as result;

-- Delete user_roles for inactive clinician users
DELETE FROM user_roles
WHERE user_id IN (
    SELECT cp.user_id 
    FROM clinician_profiles cp
    WHERE cp.id IN (SELECT id FROM inactive_clinician_ids)
);
SELECT 'Deleted user roles for inactive clinicians: ' || ROW_COUNT() as result;

-- Delete centre staff assignments for inactive clinicians
DELETE FROM centre_staff_assignments
WHERE user_id IN (
    SELECT cp.user_id 
    FROM clinician_profiles cp
    WHERE cp.id IN (SELECT id FROM inactive_clinician_ids)
);
SELECT 'Deleted centre assignments for inactive clinicians: ' || ROW_COUNT() as result;

-- Delete staff profiles for inactive clinicians (if they have staff profiles)
DELETE FROM staff_profiles
WHERE user_id IN (
    SELECT cp.user_id 
    FROM clinician_profiles cp
    WHERE cp.id IN (SELECT id FROM inactive_clinician_ids)
);
SELECT 'Deleted staff profiles for inactive clinicians: ' || ROW_COUNT() as result;

-- Delete inactive clinician profiles
DELETE FROM clinician_profiles
WHERE id IN (SELECT id FROM inactive_clinician_ids);
SELECT 'Deleted inactive clinician profiles: ' || ROW_COUNT() as result;

-- Delete user accounts for inactive clinicians
DELETE FROM users
WHERE id IN (
    SELECT user_id FROM (
        SELECT cp.user_id 
        FROM clinician_profiles cp
        WHERE cp.id IN (SELECT id FROM inactive_clinician_ids)
    ) subquery
);
SELECT 'Deleted user accounts for inactive clinicians: ' || ROW_COUNT() as result;

-- Clean up temp table
DROP TABLE inactive_clinician_ids;

-- ============================================================================
-- SECTION 5: DELETE ALL PATIENT DATA
-- ============================================================================

SELECT '===== DELETING PATIENT DATA =====' as section;

-- Store patient user IDs
CREATE TEMP TABLE patient_user_ids AS
SELECT id FROM users WHERE user_type = 'PATIENT';

SELECT 'Found patient users: ' || COUNT(*) as result FROM patient_user_ids;

-- Delete user_roles for patients
DELETE FROM user_roles
WHERE user_id IN (SELECT id FROM patient_user_ids);
SELECT 'Deleted user roles for patients: ' || ROW_COUNT() as result;

-- Delete patient profiles (CASCADE should handle related data)
DELETE FROM patient_profiles
WHERE user_id IN (SELECT id FROM patient_user_ids);
SELECT 'Deleted patient profiles: ' || ROW_COUNT() as result;

-- Delete patient user accounts
DELETE FROM users
WHERE id IN (SELECT id FROM patient_user_ids);
SELECT 'Deleted patient user accounts: ' || ROW_COUNT() as result;

-- Clean up temp table
DROP TABLE patient_user_ids;

-- ============================================================================
-- SECTION 6: VERIFICATION - CHECK WHAT REMAINS
-- ============================================================================

SELECT '===== VERIFICATION OF REMAINING DATA =====' as section;

SELECT 'Staff users remaining: ' || COUNT(*) as result 
FROM users WHERE user_type = 'STAFF';

SELECT 'Active clinicians remaining: ' || COUNT(*) as result 
FROM clinician_profiles WHERE is_active = true;

SELECT 'Inactive clinicians remaining: ' || COUNT(*) as result 
FROM clinician_profiles WHERE is_active = false;

SELECT 'Patient users remaining: ' || COUNT(*) as result 
FROM users WHERE user_type = 'PATIENT';

SELECT 'Patient profiles remaining: ' || COUNT(*) as result 
FROM patient_profiles;

SELECT 'Appointments remaining: ' || COUNT(*) as result 
FROM appointments;

SELECT 'Payments remaining: ' || COUNT(*) as result 
FROM payments;

SELECT 'Blocked slots remaining: ' || COUNT(*) as result 
FROM blocked_slots;

SELECT 'Slot exceptions remaining: ' || COUNT(*) as result 
FROM clinician_slot_exceptions;

SELECT 'Availability rules for active clinicians: ' || COUNT(*) as result 
FROM clinician_availability_rules car
WHERE EXISTS (
    SELECT 1 FROM clinician_profiles cp 
    WHERE cp.id = car.clinician_id AND cp.is_active = true
);

-- ============================================================================
-- SECTION 7: RESET SEQUENCES (OPTIONAL)
-- ============================================================================
-- Uncomment these if you want to reset ID sequences to start from 1

-- SELECT '===== RESETTING SEQUENCES =====' as section;
-- 
-- ALTER SEQUENCE appointments_id_seq RESTART WITH 1;
-- ALTER SEQUENCE payments_id_seq RESTART WITH 1;
-- ALTER SEQUENCE patient_notifications_id_seq RESTART WITH 1;
-- ALTER SEQUENCE blocked_slots_id_seq RESTART WITH 1;
-- ALTER SEQUENCE clinician_slot_exceptions_id_seq RESTART WITH 1;
-- ALTER SEQUENCE appointment_status_history_id_seq RESTART WITH 1;
-- ALTER SEQUENCE clinician_notes_history_id_seq RESTART WITH 1;
-- ALTER SEQUENCE follow_up_appointments_id_seq RESTART WITH 1;
-- ALTER SEQUENCE slot_blocking_audit_id_seq RESTART WITH 1;
-- 
-- SELECT 'Sequences reset successfully' as result;

-- ============================================================================
-- FINAL CONFIRMATION
-- ============================================================================

SELECT '===== CLEANUP COMPLETE =====' as section;
SELECT 'Database is now ready for real patient data' as result;
SELECT 'All staff users and active clinicians preserved' as result;
SELECT 'All patient test data deleted' as result;
SELECT '' as separator;
SELECT 'IMPORTANT: Review the verification counts above' as warning;
SELECT 'If everything looks correct, COMMIT the transaction' as warning;
SELECT 'If something is wrong, ROLLBACK the transaction' as warning;

-- ============================================================================
-- COMMIT OR ROLLBACK
-- ============================================================================
-- Review the output above carefully!
-- If everything is correct, run: COMMIT;
-- If something is wrong, run: ROLLBACK;

-- COMMIT;  -- Uncomment this line to commit changes
-- ROLLBACK;  -- Uncomment this line to rollback changes

-- ============================================================================
-- END OF CLEANUP SCRIPT
-- ============================================================================
