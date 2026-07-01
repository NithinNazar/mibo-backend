-- ============================================================================
-- PRODUCTION DATABASE - POST-CLEANUP VERIFICATION
-- ============================================================================
-- Purpose: Verify production database state after cleanup
-- Date: 2026-06-25
-- 
-- Run this script after PRODUCTION_CLEANUP.sql to verify everything is correct
-- ============================================================================

SELECT NOW() as verification_timestamp;

SELECT '===== PRODUCTION POST-CLEANUP VERIFICATION =====' as section;

-- ============================================================================
-- VERIFY: All patient data is deleted
-- ============================================================================

SELECT '===== PATIENT DATA (MUST BE 0) =====' as section;

SELECT 'Patient users' as category, COUNT(*) as count 
FROM users WHERE user_type = 'PATIENT';

SELECT 'Patient profiles' as category, COUNT(*) as count 
FROM patient_profiles;

SELECT 'Appointments' as category, COUNT(*) as count 
FROM appointments;

SELECT 'Payments' as category, COUNT(*) as count 
FROM payments;

SELECT 'Patient notifications' as category, COUNT(*) as count 
FROM patient_notifications;

SELECT 'Appointment status history' as category, COUNT(*) as count 
FROM appointment_status_history;

SELECT 'Video sessions' as category, COUNT(*) as count 
FROM video_sessions;

SELECT 'Auth sessions (all)' as category, COUNT(*) as count 
FROM auth_sessions;

SELECT 'Notifications (all)' as category, COUNT(*) as count 
FROM notifications;

SELECT 'Clinician notes history' as category, COUNT(*) as count 
FROM clinician_notes_history;

SELECT 'Follow-up appointments' as category, COUNT(*) as count 
FROM follow_up_appointments;

-- ============================================================================
-- VERIFY: Slot blocks and exceptions are cleared
-- ============================================================================

SELECT '===== SLOT BLOCKS/EXCEPTIONS (MUST BE 0) =====' as section;

SELECT 'Blocked slots' as category, COUNT(*) as count 
FROM blocked_slots;

SELECT 'Slot exceptions' as category, COUNT(*) as count 
FROM clinician_slot_exceptions;

SELECT 'Slot blocking audit' as category, COUNT(*) as count 
FROM slot_blocking_audit;

-- ============================================================================
-- VERIFY: Only active clinicians remain
-- ============================================================================

SELECT '===== INACTIVE CLINICIANS (MUST BE 0) =====' as section;

SELECT 'Inactive clinicians' as category, COUNT(*) as count 
FROM clinician_profiles WHERE is_active = false;

-- ============================================================================
-- VERIFY: Staff users and active clinicians are intact
-- ============================================================================

SELECT '===== PRESERVED DATA (MUST HAVE COUNTS) =====' as section;

SELECT 'Staff users' as category, COUNT(*) as count 
FROM users WHERE user_type = 'STAFF';

SELECT 'Active clinicians' as category, COUNT(*) as count 
FROM clinician_profiles WHERE is_active = true;

SELECT 'Staff profiles' as category, COUNT(*) as count 
FROM staff_profiles;

SELECT 'User roles (staff)' as category, COUNT(*) as count 
FROM user_roles ur
WHERE EXISTS (SELECT 1 FROM users u WHERE u.id = ur.user_id AND u.user_type = 'STAFF');

SELECT 'Availability rules (active clinicians)' as category, COUNT(*) as count 
FROM clinician_availability_rules car
WHERE EXISTS (
    SELECT 1 FROM clinician_profiles cp 
    WHERE cp.id = car.clinician_id AND cp.is_active = true
);

SELECT 'Centre staff assignments' as category, COUNT(*) as count 
FROM centre_staff_assignments;

-- ============================================================================
-- VERIFY: Login test - List all staff users who can log in
-- ============================================================================

SELECT '===== STAFF USERS WHO CAN LOG IN =====' as section;

SELECT 
    u.id,
    u.full_name,
    u.email,
    u.phone,
    u.user_type,
    STRING_AGG(DISTINCT r.name, ', ') as roles,
    CASE 
        WHEN cp.id IS NOT NULL THEN 'Yes (Clinician)'
        WHEN sp.id IS NOT NULL THEN 'Yes (Staff)'
        ELSE 'No profile'
    END as has_profile,
    cp.is_active as clinician_active
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
LEFT JOIN clinician_profiles cp ON u.id = cp.user_id
LEFT JOIN staff_profiles sp ON u.id = sp.user_id
WHERE u.user_type = 'STAFF'
GROUP BY u.id, u.full_name, u.email, u.phone, u.user_type, cp.id, sp.id, cp.is_active
ORDER BY u.full_name;

-- ============================================================================
-- VERIFY: Active clinicians with availability rules
-- ============================================================================

SELECT '===== ACTIVE CLINICIANS WITH AVAILABILITY =====' as section;

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
-- VERIFY: Production database is ready for real patients
-- ============================================================================

SELECT '===== FINAL STATUS =====' as section;

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM users WHERE user_type = 'PATIENT') = 0 
        THEN '✓ PASS' 
        ELSE '✗ FAIL' 
    END as patient_data_deleted,
    CASE 
        WHEN (SELECT COUNT(*) FROM appointments) = 0 
        THEN '✓ PASS' 
        ELSE '✗ FAIL' 
    END as appointments_deleted,
    CASE 
        WHEN (SELECT COUNT(*) FROM payments) = 0 
        THEN '✓ PASS' 
        ELSE '✗ FAIL' 
    END as payments_deleted,
    CASE 
        WHEN (SELECT COUNT(*) FROM blocked_slots) = 0 
        THEN '✓ PASS' 
        ELSE '✗ FAIL' 
    END as slot_blocks_cleared,
    CASE 
        WHEN (SELECT COUNT(*) FROM clinician_profiles WHERE is_active = false) = 0 
        THEN '✓ PASS' 
        ELSE '✗ FAIL' 
    END as inactive_clinicians_deleted,
    CASE 
        WHEN (SELECT COUNT(*) FROM users WHERE user_type = 'STAFF') > 0 
        THEN '✓ PASS' 
        ELSE '✗ FAIL' 
    END as staff_preserved,
    CASE 
        WHEN (SELECT COUNT(*) FROM clinician_profiles WHERE is_active = true) > 0 
        THEN '✓ PASS' 
        ELSE '✗ FAIL' 
    END as active_clinicians_preserved;

SELECT 
    CASE 
        WHEN (
            (SELECT COUNT(*) FROM users WHERE user_type = 'PATIENT') = 0 AND
            (SELECT COUNT(*) FROM appointments) = 0 AND
            (SELECT COUNT(*) FROM payments) = 0 AND
            (SELECT COUNT(*) FROM blocked_slots) = 0 AND
            (SELECT COUNT(*) FROM clinician_profiles WHERE is_active = false) = 0 AND
            (SELECT COUNT(*) FROM users WHERE user_type = 'STAFF') > 0 AND
            (SELECT COUNT(*) FROM clinician_profiles WHERE is_active = true) > 0
        )
        THEN '✓✓✓ PRODUCTION DATABASE IS READY FOR REAL PATIENTS ✓✓✓'
        ELSE '✗✗✗ ISSUES DETECTED - REVIEW RESULTS ABOVE ✗✗✗'
    END as final_status;

-- ============================================================================
-- NEXT STEPS AFTER SUCCESSFUL VERIFICATION
-- ============================================================================

SELECT '===== NEXT STEPS =====' as section;
SELECT '1. Test admin panel login with existing staff credentials' as step;
SELECT '2. Test clinician dashboard access' as step;
SELECT '3. Test patient registration (new patient)' as step;
SELECT '4. Test booking a new appointment' as step;
SELECT '5. Verify appointment appears in admin panel' as step;
SELECT '6. Monitor for any issues in production' as step;

-- ============================================================================
-- END OF PRODUCTION VERIFICATION SCRIPT
-- ============================================================================
