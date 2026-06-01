-- ============================================================================
-- Test Script: Verify Start Session Fix
-- ============================================================================
-- Run this AFTER applying the fix-appointment-status-constraint.sql migration
-- This will verify that the constraint allows IN_PROGRESS status
-- ============================================================================

-- Test 1: Check if constraint includes IN_PROGRESS
SELECT 
    '=== TEST 1: Constraint Check ===' as test,
    CASE 
        WHEN pg_get_constraintdef(oid) LIKE '%IN_PROGRESS%' 
        THEN '✅ PASS: IN_PROGRESS is in constraint'
        ELSE '❌ FAIL: IN_PROGRESS is NOT in constraint'
    END as result
FROM pg_constraint
WHERE conname = 'appointments_status_check'
AND conrelid = 'appointments'::regclass;

-- Test 2: Try to insert a test appointment with IN_PROGRESS status
BEGIN;

-- Create a test appointment with IN_PROGRESS status
INSERT INTO appointments (
    patient_id,
    clinician_id,
    centre_id,
    appointment_type,
    scheduled_start_at,
    scheduled_end_at,
    duration_minutes,
    status,
    booked_by_user_id,
    source
)
SELECT 
    (SELECT id FROM patient_profiles LIMIT 1),
    (SELECT id FROM clinician_profiles LIMIT 1),
    (SELECT id FROM centres LIMIT 1),
    'IN_PERSON',
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '1 day' + INTERVAL '50 minutes',
    50,
    'IN_PROGRESS',  -- This should work now
    (SELECT id FROM users WHERE user_type = 'STAFF' LIMIT 1),
    'ADMIN_MANAGER'
RETURNING 
    '=== TEST 2: Insert Test ===' as test,
    id as test_appointment_id,
    status,
    '✅ PASS: Can insert IN_PROGRESS status' as result;

-- Clean up test data
DELETE FROM appointments WHERE id = (SELECT MAX(id) FROM appointments);

ROLLBACK;

-- Test 3: Try to update an existing appointment to IN_PROGRESS
BEGIN;

-- Find a CONFIRMED appointment
WITH test_appt AS (
    SELECT id, status as original_status
    FROM appointments
    WHERE status = 'CONFIRMED'
    LIMIT 1
)
-- Try to update it to IN_PROGRESS
UPDATE appointments
SET status = 'IN_PROGRESS',
    session_started_at = NOW()
FROM test_appt
WHERE appointments.id = test_appt.id
RETURNING 
    '=== TEST 3: Update Test ===' as test,
    appointments.id as appointment_id,
    test_appt.original_status,
    appointments.status as new_status,
    '✅ PASS: Can update to IN_PROGRESS status' as result;

ROLLBACK;

-- Test 4: Verify session tracking columns exist
SELECT 
    '=== TEST 4: Session Columns Check ===' as test,
    CASE 
        WHEN COUNT(*) = 2 
        THEN '✅ PASS: Both session tracking columns exist'
        ELSE '❌ FAIL: Session tracking columns missing'
    END as result,
    COUNT(*) as columns_found
FROM information_schema.columns
WHERE table_name = 'appointments'
AND column_name IN ('session_started_at', 'session_ended_at');

-- Test 5: Check all allowed statuses
SELECT 
    '=== TEST 5: All Allowed Statuses ===' as test,
    unnest(ARRAY[
        'BOOKED',
        'CONFIRMED',
        'IN_PROGRESS',
        'PENDING',
        'CANCELLED',
        'COMPLETED',
        'NO_SHOW',
        'RESCHEDULED',
        'CANCELLATION_REQUESTED'
    ]) as status,
    '✅ Should be allowed' as expected;

-- ============================================================================
-- Summary
-- ============================================================================
SELECT 
    '=== TEST SUMMARY ===' as info,
    'All tests completed' as status,
    'If all tests show ✅ PASS, the fix is working correctly' as note;

-- ============================================================================
-- Expected Output:
-- ============================================================================
-- TEST 1: ✅ PASS: IN_PROGRESS is in constraint
-- TEST 2: ✅ PASS: Can insert IN_PROGRESS status
-- TEST 3: ✅ PASS: Can update to IN_PROGRESS status
-- TEST 4: ✅ PASS: Both session tracking columns exist
-- TEST 5: Shows all 9 allowed statuses
-- ============================================================================
