-- ============================================================================
-- VERIFICATION SCRIPT - RUN THIS BEFORE CLEANUP
-- ============================================================================
-- Purpose: Verify what data exists before cleanup
-- Date: 2026-06-25
-- 
-- This script shows counts of all data that will be affected by cleanup
-- Review these numbers carefully before running the cleanup script
-- ============================================================================

-- Display current timestamp
SELECT NOW() as verification_timestamp;

-- ============================================================================
-- SECTION 1: DATA THAT WILL BE KEPT (Real Admin Users)
-- ============================================================================

SELECT '===== DATA TO KEEP =====' as section;

-- Real staff users (Admin, Clinicians, Front Desk, Managers, Care Coordinators)
SELECT 
    'Staff Users' as category,
    COUNT(*) as count
FROM users u
WHERE u.user_type = 'STAFF';

-- Active clinicians
SELECT 
    'Active Clinicians' as category,
    COUNT(*) as count
FROM clinician_profiles
WHERE is_active = true;

-- Inactive clinicians (will be deleted)
SELECT 
    'Inactive Clinicians (TO DELETE)' as category,
    COUNT(*) as count
FROM clinician_profiles
WHERE is_active = false;

-- Availability rules for active clinicians (keep)
SELECT 
    'Availability Rules (Active Clinicians)' as category,
    COUNT(*) as count
FROM clinician_availability_rules car
WHERE EXISTS (
    SELECT 1 FROM clinician_profiles cp 
    WHERE cp.id = car.clinician_id AND cp.is_active = true
);

-- User roles for staff (keep)
SELECT 
    'Staff User Roles' as category,
    COUNT(*) as count
FROM user_roles ur
WHERE EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = ur.user_id AND u.user_type = 'STAFF'
);

-- ============================================================================
-- SECTION 2: DATA THAT WILL BE DELETED (Test Patient Data)
-- ============================================================================

SELECT '===== DATA TO DELETE =====' as section;

-- Patient users (all will be deleted)
SELECT 
    'Patient Users (TO DELETE)' as category,
    COUNT(*) as count
FROM users u
WHERE u.user_type = 'PATIENT';

-- Patient profiles (all will be deleted)
SELECT 
    'Patient Profiles (TO DELETE)' as category,
    COUNT(*) as count
FROM patient_profiles;

-- Appointments (all will be deleted)
SELECT 
    'Appointments (TO DELETE)' as category,
    COUNT(*) as count
FROM appointments;

-- Payments (all will be deleted)
SELECT 
    'Payments (TO DELETE)' as category,
    COUNT(*) as count
FROM payments;

-- Blocked slots (all will be cleared)
SELECT 
    'Blocked Slots (TO DELETE)' as category,
    COUNT(*) as count
FROM blocked_slots;

-- Slot exceptions (all will be cleared)
SELECT 
    'Slot Exceptions (TO DELETE)' as category,
    COUNT(*) as count
FROM clinician_slot_exceptions;

-- Patient notifications (all will be deleted)
SELECT 
    'Patient Notifications (TO DELETE)' as category,
    COUNT(*) as count
FROM patient_notifications;

-- Appointment status history (all will be deleted)
SELECT 
    'Appointment Status History (TO DELETE)' as category,
    COUNT(*) as count
FROM appointment_status_history;

-- Clinician notes history (all will be deleted)
SELECT 
    'Clinician Notes History (TO DELETE)' as category,
    COUNT(*) as count
FROM clinician_notes_history;

-- Follow-up appointments (all will be deleted)
SELECT 
    'Follow-up Appointments (TO DELETE)' as category,
    COUNT(*) as count
FROM follow_up_appointments;

-- Slot blocking audit (all will be deleted)
SELECT 
    'Slot Blocking Audit (TO DELETE)' as category,
    COUNT(*) as count
FROM slot_blocking_audit;

-- Video sessions (all will be deleted)
SELECT 
    'Video Sessions (TO DELETE)' as category,
    COUNT(*) as count
FROM video_sessions;

-- Auth sessions (all patient sessions will be deleted)
SELECT 
    'Auth Sessions - Patients (TO DELETE)' as category,
    COUNT(*) as count
FROM auth_sessions
WHERE user_id IN (SELECT id FROM users WHERE user_type = 'PATIENT');

-- Auth sessions (staff sessions will be kept)
SELECT 
    'Auth Sessions - Staff (KEEP)' as category,
    COUNT(*) as count
FROM auth_sessions
WHERE user_id IN (SELECT id FROM users WHERE user_type = 'STAFF');

-- ============================================================================
-- SECTION 3: DETAILED BREAKDOWN OF ACTIVE CLINICIANS (KEEP)
-- ============================================================================

SELECT '===== ACTIVE CLINICIANS TO KEEP =====' as section;

SELECT 
    cp.id as clinician_id,
    u.full_name,
    u.email,
    cp.specialization,
    cp.is_active,
    COUNT(DISTINCT car.id) as availability_rules_count
FROM clinician_profiles cp
JOIN users u ON cp.user_id = u.id
LEFT JOIN clinician_availability_rules car ON cp.id = car.clinician_id
WHERE cp.is_active = true
GROUP BY cp.id, u.full_name, u.email, cp.specialization, cp.is_active
ORDER BY u.full_name;

-- ============================================================================
-- SECTION 4: DETAILED BREAKDOWN OF INACTIVE CLINICIANS (DELETE)
-- ============================================================================

SELECT '===== INACTIVE CLINICIANS TO DELETE =====' as section;

SELECT 
    cp.id as clinician_id,
    u.full_name,
    u.email,
    cp.specialization,
    cp.is_active
FROM clinician_profiles cp
JOIN users u ON cp.user_id = u.id
WHERE cp.is_active = false
ORDER BY u.full_name;

-- ============================================================================
-- END OF VERIFICATION SCRIPT
-- ============================================================================
