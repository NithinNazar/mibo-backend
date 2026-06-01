-- ============================================================================
-- Migration: Fix Appointment Status Constraint - Add IN_PROGRESS Status
-- ============================================================================
-- Issue: Clinicians cannot start sessions because 'IN_PROGRESS' status is
--        missing from the database CHECK constraint, causing 500 errors
-- 
-- Root Cause: Database constraint doesn't include 'IN_PROGRESS' status that
--             the application code expects and uses for session tracking
--
-- Solution: Update the CHECK constraint to include 'IN_PROGRESS' status
--
-- Date: 2026-05-28
-- Safe to run: YES - This is a non-destructive schema change
-- Rollback: Can be rolled back by removing 'IN_PROGRESS' from constraint
-- ============================================================================

-- Start transaction for safety
BEGIN;

-- ============================================================================
-- STEP 1: Display Current Constraint
-- ============================================================================
SELECT 
    '=== CURRENT CONSTRAINT ===' as info,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'appointments_status_check'
AND conrelid = 'appointments'::regclass;

-- ============================================================================
-- STEP 2: Check for any appointments that might have IN_PROGRESS status
-- ============================================================================
SELECT 
    '=== CHECKING FOR IN_PROGRESS APPOINTMENTS ===' as info,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) > 0 THEN '⚠️  Found appointments with IN_PROGRESS status'
        ELSE '✅ No appointments with IN_PROGRESS status found'
    END as status
FROM appointments
WHERE status = 'IN_PROGRESS';

-- ============================================================================
-- STEP 3: Drop the old constraint
-- ============================================================================
DO $$
BEGIN
    -- Check if constraint exists before dropping
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'appointments_status_check'
        AND conrelid = 'appointments'::regclass
    ) THEN
        ALTER TABLE appointments DROP CONSTRAINT appointments_status_check;
        RAISE NOTICE '✅ Old constraint dropped successfully';
    ELSE
        RAISE NOTICE '⚠️  Constraint appointments_status_check does not exist';
    END IF;
END $$;

-- ============================================================================
-- STEP 4: Add new constraint with IN_PROGRESS included
-- ============================================================================
ALTER TABLE appointments 
ADD CONSTRAINT appointments_status_check 
CHECK (
    status IN (
        'BOOKED',
        'CONFIRMED',
        'IN_PROGRESS',              -- ✅ ADDED: Required for session tracking
        'PENDING',
        'CANCELLED',
        'COMPLETED',
        'NO_SHOW',
        'RESCHEDULED',
        'CANCELLATION_REQUESTED'
    )
);

-- ============================================================================
-- STEP 5: Verify the new constraint
-- ============================================================================
SELECT 
    '=== NEW CONSTRAINT VERIFICATION ===' as info,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'appointments_status_check'
AND conrelid = 'appointments'::regclass;

-- ============================================================================
-- STEP 6: Test the constraint with a sample update (will be rolled back)
-- ============================================================================
DO $$
DECLARE
    test_appointment_id INTEGER;
    original_status VARCHAR(50);
BEGIN
    -- Find a CONFIRMED appointment to test with
    SELECT id, status INTO test_appointment_id, original_status
    FROM appointments
    WHERE status = 'CONFIRMED'
    LIMIT 1;

    IF test_appointment_id IS NOT NULL THEN
        RAISE NOTICE '=== TESTING CONSTRAINT ===';
        RAISE NOTICE 'Testing with appointment ID: %', test_appointment_id;
        RAISE NOTICE 'Original status: %', original_status;
        
        -- Try to update to IN_PROGRESS (this should succeed now)
        UPDATE appointments 
        SET status = 'IN_PROGRESS',
            session_started_at = NOW()
        WHERE id = test_appointment_id;
        
        RAISE NOTICE '✅ Successfully updated status to IN_PROGRESS';
        
        -- Rollback the test change
        UPDATE appointments 
        SET status = original_status,
            session_started_at = NULL
        WHERE id = test_appointment_id;
        
        RAISE NOTICE '✅ Test completed - changes rolled back';
    ELSE
        RAISE NOTICE '⚠️  No CONFIRMED appointments found for testing';
    END IF;
END $$;

-- ============================================================================
-- STEP 7: Display summary of all appointment statuses
-- ============================================================================
SELECT 
    '=== APPOINTMENT STATUS SUMMARY ===' as info,
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM appointments
WHERE is_active = true
GROUP BY status
ORDER BY count DESC;

-- ============================================================================
-- STEP 8: Verify session tracking columns exist
-- ============================================================================
SELECT 
    '=== SESSION TRACKING COLUMNS ===' as info,
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_name IN ('session_started_at', 'session_ended_at') 
        THEN '✅ Required for session tracking'
        ELSE ''
    END as notes
FROM information_schema.columns
WHERE table_name = 'appointments'
AND column_name IN ('status', 'session_started_at', 'session_ended_at')
ORDER BY 
    CASE column_name
        WHEN 'status' THEN 1
        WHEN 'session_started_at' THEN 2
        WHEN 'session_ended_at' THEN 3
    END;

-- ============================================================================
-- STEP 9: Display migration summary
-- ============================================================================
SELECT 
    '=== MIGRATION SUMMARY ===' as info,
    'Constraint Updated' as action,
    'appointments_status_check' as constraint_name,
    'Added IN_PROGRESS status' as change,
    '✅ READY FOR COMMIT' as status;

-- ============================================================================
-- COMMIT THE TRANSACTION
-- ============================================================================
-- Review the output above. If everything looks good, the changes will be committed.
-- If you see any errors, the transaction will be rolled back automatically.

COMMIT;

-- ============================================================================
-- POST-MIGRATION VERIFICATION
-- ============================================================================

-- Verify the constraint is in place
SELECT 
    '=== POST-MIGRATION CHECK ===' as info,
    CASE 
        WHEN pg_get_constraintdef(oid) LIKE '%IN_PROGRESS%' 
        THEN '✅ IN_PROGRESS status is now allowed'
        ELSE '❌ IN_PROGRESS status is NOT in constraint'
    END as verification_result
FROM pg_constraint
WHERE conname = 'appointments_status_check'
AND conrelid = 'appointments'::regclass;

-- ============================================================================
-- EXPECTED RESULTS
-- ============================================================================
-- After running this migration:
-- 1. ✅ Clinicians can start sessions from admin panel
-- 2. ✅ Status can be updated to 'IN_PROGRESS'
-- 3. ✅ session_started_at timestamp will be set automatically
-- 4. ✅ No more 500 errors when clicking "Start Session"
-- 5. ✅ All existing appointments remain unchanged
-- 6. ✅ All other status transitions continue to work
-- ============================================================================

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================
-- If you need to rollback this change, run:
--
-- BEGIN;
-- ALTER TABLE appointments DROP CONSTRAINT appointments_status_check;
-- ALTER TABLE appointments ADD CONSTRAINT appointments_status_check 
-- CHECK (status IN (
--     'BOOKED', 'CONFIRMED', 'PENDING', 'CANCELLED', 
--     'COMPLETED', 'NO_SHOW', 'RESCHEDULED', 'CANCELLATION_REQUESTED'
-- ));
-- COMMIT;
-- ============================================================================

-- ============================================================================
-- TESTING CHECKLIST (After Migration)
-- ============================================================================
-- □ Log in to admin panel as a clinician
-- □ Find a CONFIRMED appointment at or past scheduled time
-- □ Click "Start Session" button
-- □ Verify no error occurs
-- □ Verify status changes to IN_PROGRESS
-- □ Verify session_started_at is set
-- □ Click "End Session" button
-- □ Verify status changes to COMPLETED
-- □ Verify session_ended_at is set
-- ============================================================================
