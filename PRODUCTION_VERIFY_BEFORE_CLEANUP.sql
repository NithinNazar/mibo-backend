-- ============================================================================
-- PRODUCTION DATABASE - VERIFY BEFORE CLEANUP
-- ============================================================================
-- ⚠️ CRITICAL: RUN THIS ON PRODUCTION DATABASE FIRST!
-- ⚠️ BACKUP YOUR PRODUCTION DATABASE BEFORE RUNNING ANY CLEANUP!
-- ============================================================================
-- Purpose: See what will be deleted and what will be kept
-- Date: 2026-06-25
-- ============================================================================

SELECT NOW() as verification_timestamp;

SELECT '===== PRODUCTION PRE-CLEANUP VERIFICATION =====' as section;

-- ============================================================================
-- WHAT WILL BE DELETED
-- ============================================================================

SELECT '===== DATA THAT WILL BE DELETED =====' as section;

SELECT 'Patient users' as category, COUNT(*) as count 
FROM users WHERE user_type = 'PATIENT';

SELECT 'Patient profiles' as category, COUNT(*) as count 
FROM patient_profiles;

SELECT 'Appointments' as category, COUNT(*) as count 
FROM appointments;

SELECT 'Payments' as category, COUNT(*) as count 
FROM payments;

SELECT 'Video sessions' as category, COUNT(*) as count 
FROM video_sessions;

SELECT 'Appointment status history' as category, COUNT(*) as count 
FROM appointment_status_history;

SELECT 'Clinician notes history' as category, COUNT(*) as count 
FROM clinician_notes_history;

SELECT 'Follow-up appointments' as category, COUNT(*) as count 
FROM follow_up_appointments;

SELECT 'Patient notifications' as category, COUNT(*) as count 
FROM patient_notifications;

SELECT 'Notifications (all users)' as category, COUNT(*) as count 
FROM notifications;

SELECT 'Auth sessions (all users)' as category, COUNT(*) as count 
FROM auth_sessions;

SELECT 'Blocked slots' as category, COUNT(*) as count 
FROM blocked_slots;

SELECT 'Slot exceptions' as category, COUNT(*) as count 
FROM clinician_slot_exceptions;

SELECT 'Slot blocking audit' as category, COUNT(*) as count 
FROM slot_blocking_audit;

SELECT 'Inactive clinicians' as category, COUNT(*) as count 
FROM clinician_profiles WHERE is_active = false;

-- ============================================================================
-- WHAT WILL BE KEPT
-- ============================================================================

SELECT '===== DATA THAT WILL BE KEPT =====' as section;

SELECT 'Staff users (Admin, Front Desk, etc.)' as category, COUNT(*) as count 
FROM users WHERE user_type = 'STAFF';

SELECT 'Active clinicians' as category, COUNT(*) as count 
FROM clinician_profiles WHERE is_active = true;

SELECT 'Staff profiles' as category, COUNT(*) as count 
FROM staff_profiles;

SELECT 'Availability rules (active clinicians)' as category, COUNT(*) as count 
FROM clinician_availability_rules car
WHERE EXISTS (
    SELECT 1 FROM clinician_profiles cp 
    WHERE cp.id = car.clinician_id AND cp.is_active = true
);

SELECT 'Centre staff assignments' as category, COUNT(*) as count 
FROM centre_staff_assignments;

SELECT 'User roles (staff)' as category, COUNT(*) as count 
FROM user_roles ur
WHERE EXISTS (SELECT 1 FROM users u WHERE u.id = ur.user_id AND u.user_type = 'STAFF');

-- ============================================================================
-- DETAILED BREAKDOWN
-- ============================================================================

SELECT '===== STAFF USERS THAT WILL BE KEPT =====' as section;

SELECT 
    u.id,
    u.full_name,
    u.email,
    u.phone,
    u.user_type,
    STRING_AGG(DISTINCT r.name, ', ') as roles,
    CASE 
        WHEN cp.id IS NOT NULL THEN 'Clinician (Active: ' || cp.is_active || ')'
        WHEN sp.id IS NOT NULL THEN 'Staff'
        ELSE 'No profile'
    END as profile_type
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
LEFT JOIN clinician_profiles cp ON u.id = cp.user_id
LEFT JOIN staff_profiles sp ON u.id = sp.user_id
WHERE u.user_type = 'STAFF'
GROUP BY u.id, u.full_name, u.email, u.phone, u.user_type, cp.id, sp.id, cp.is_active
ORDER BY u.full_name;

SELECT '===== ACTIVE CLINICIANS THAT WILL BE KEPT =====' as section;

SELECT 
    cp.id as clinician_id,
    u.full_name,
    u.email,
    cp.specialization,
    cp.consultation_fee,
    COUNT(DISTINCT car.id) as availability_rules,
    cp.is_active
FROM clinician_profiles cp
JOIN users u ON cp.user_id = u.id
LEFT JOIN clinician_availability_rules car ON cp.id = car.clinician_id
WHERE cp.is_active = true
GROUP BY cp.id, u.full_name, u.email, cp.specialization, cp.consultation_fee, cp.is_active
ORDER BY u.full_name;

-- ============================================================================
-- SUMMARY
-- ============================================================================

SELECT '===== SUMMARY =====' as section;

SELECT 
    'Ready to clean production' as status,
    (SELECT COUNT(*) FROM users WHERE user_type = 'PATIENT') as patients_to_delete,
    (SELECT COUNT(*) FROM appointments) as appointments_to_delete,
    (SELECT COUNT(*) FROM payments) as payments_to_delete,
    (SELECT COUNT(*) FROM users WHERE user_type = 'STAFF') as staff_to_keep,
    (SELECT COUNT(*) FROM clinician_profiles WHERE is_active = true) as active_clinicians_to_keep;

SELECT '===== NEXT STEPS =====' as section;
SELECT '1. Review the counts above' as step;
SELECT '2. BACKUP YOUR PRODUCTION DATABASE!' as step;
SELECT '3. Run PRODUCTION_CLEANUP.sql' as step;
SELECT '4. Run PRODUCTION_VERIFY_AFTER_CLEANUP.sql' as step;

-- ============================================================================
-- END OF VERIFICATION
-- ============================================================================
