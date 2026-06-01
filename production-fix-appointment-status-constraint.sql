-- ============================================================================
-- PRODUCTION Migration: Fix Appointment Status Constraint - Add IN_PROGRESS
-- ============================================================================
-- ⚠️  PRODUCTION SAFE VERSION - Uses autocommit, no manual transaction
-- 
-- Issue: Clinicians cannot start sessions - 'IN_PROGRESS' status missing
-- Solution: Update CHECK constraint to include 'IN_PROGRESS' status
-- 
-- Date: 2026-05-28
-- Environment: PRODUCTION
-- Safe to run: YES - Non-destructive schema change
-- Downtime required: NO
-- ============================================================================

-- ============================================================================
-- PRE-MIGRATION CHECKS
-- ============================================================================

-- Check current constraint
SELECT 
    '=== CURRENT CONSTRAINT ===' as info,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'appointments_status_check'
AND conrelid = 'appointments'::regclass;

-- Check for existing IN_PROGRESS appointments
SELECT 
    '=== PRE-CHECK: IN_PROGRESS APPOINTMENTS ===' as info,
    COUNT(*) as count
FROM appointments
WHERE status = 'IN_PROGRESS';

-- ============================================================================
-- MIGRATION EXECUTION
-- ============================================================================

-- Drop old constraint
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;

-- Add new constraint with IN_PROGRESS
ALTER TABLE appointments 
ADD CONSTRAINT appointments_status_check 
CHECK (
    status IN (
        'BOOKED',
        'CONFIRMED',
        'IN_PROGRESS',              -- ✅ ADDED for session tracking
        'PENDING',
        'CANCELLED',
        'COMPLETED',
        'NO_SHOW',
        'RESCHEDULED',
        'CANCELLATION_REQUESTED'
    )
);

-- ============================================================================
-- POST-MIGRATION VERIFICATION
-- ============================================================================

-- Verify new constraint
SELECT 
    '=== NEW CONSTRAINT ===' as info,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'appointments_status_check'
AND conrelid = 'appointments'::regclass;

-- Verify IN_PROGRESS is allowed
SELECT 
    '=== VERIFICATION ===' as info,
    CASE 
        WHEN pg_get_constraintdef(oid) LIKE '%IN_PROGRESS%' 
        THEN '✅ SUCCESS: IN_PROGRESS status is now allowed'
        ELSE '❌ FAILED: IN_PROGRESS status is NOT in constraint'
    END as result
FROM pg_constraint
WHERE conname = 'appointments_status_check'
AND conrelid = 'appointments'::regclass;

-- Display current appointment status distribution
SELECT 
    '=== APPOINTMENT STATUS DISTRIBUTION ===' as info,
    status,
    COUNT(*) as count
FROM appointments
WHERE is_active = true
GROUP BY status
ORDER BY count DESC;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- ✅ Constraint updated successfully
-- ✅ Clinicians can now start sessions
-- ✅ No data was modified
-- ✅ All existing appointments remain unchanged
-- ============================================================================
