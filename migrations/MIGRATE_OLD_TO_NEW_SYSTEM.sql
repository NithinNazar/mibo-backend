-- ================================================================
-- MIGRATION: Old Slot Exceptions System → New Blocked Slots System
-- ================================================================
-- This script safely migrates all slot blocks from clinician_slot_exceptions
-- to blocked_slots table, then removes old system logic
-- 
-- RUN THIS ON PRODUCTION DATABASE
-- ================================================================

-- STEP 1: Check current state
-- ================================================================
SELECT 'STEP 1: Current State Check' as migration_step;

-- Count records in old system
SELECT 
    'Old System (clinician_slot_exceptions)' as system,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE exception_date >= CURRENT_DATE) as future_records
FROM clinician_slot_exceptions;

-- Count records in new system
SELECT 
    'New System (blocked_slots)' as system,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE blocked_date >= CURRENT_DATE AND is_blocked = TRUE) as future_blocked
FROM blocked_slots;


-- STEP 2: Migrate future blocks from old system to new system
-- ================================================================
SELECT 'STEP 2: Migrating future blocks' as migration_step;

-- Insert records that DON'T already exist in new system
-- Using ON CONFLICT DO NOTHING to safely handle any duplicates
INSERT INTO blocked_slots (
    clinician_id,
    centre_id,
    blocked_date,
    start_time,
    end_time,
    reason,
    blocked_by_admin_id,
    blocked_at,
    is_blocked
)
SELECT DISTINCT
    cse.clinician_id,
    cse.centre_id,
    cse.exception_date,
    cse.start_time,
    cse.end_time,
    COALESCE(cse.reason, 'Migrated from old system') as reason,
    cse.created_by_user_id,
    COALESCE(cse.created_at, NOW()) as blocked_at,
    TRUE as is_blocked
FROM clinician_slot_exceptions cse
WHERE cse.exception_date >= CURRENT_DATE
ORDER BY cse.exception_date, cse.start_time
ON CONFLICT (clinician_id, centre_id, blocked_date, start_time, end_time) 
DO NOTHING;

-- Show how many were migrated
SELECT 
    'Migration Result' as result,
    COUNT(*) as records_migrated
FROM blocked_slots
WHERE blocked_at >= NOW() - INTERVAL '5 seconds';


-- STEP 3: Verify migration
-- ================================================================
SELECT 'STEP 3: Verification' as migration_step;

-- Check new system now has all future blocks
SELECT 
    'New System After Migration' as system,
    COUNT(*) as total_blocked_slots,
    COUNT(DISTINCT clinician_id) as clinicians_affected
FROM blocked_slots
WHERE is_blocked = TRUE
AND blocked_date >= CURRENT_DATE;

-- Verify no duplicates were created
SELECT 
    clinician_id,
    centre_id,
    blocked_date,
    start_time,
    COUNT(*) as duplicate_count
FROM blocked_slots
WHERE is_blocked = TRUE
GROUP BY clinician_id, centre_id, blocked_date, start_time
HAVING COUNT(*) > 1;
-- Should return 0 rows


-- STEP 4: Archive old system data (OPTIONAL - keep for backup)
-- ================================================================
SELECT 'STEP 4: Archival (Optional)' as migration_step;

-- Option A: Keep old table but mark as archived (RECOMMENDED)
-- Add a comment to the table
COMMENT ON TABLE clinician_slot_exceptions IS 
'DEPRECATED: Migrated to blocked_slots table on 2026-06-07. Keep for historical reference only.';

-- Option B: Rename table for backup (ALTERNATIVE)
-- ALTER TABLE clinician_slot_exceptions RENAME TO clinician_slot_exceptions_archived_20260607;

-- Option C: Delete old future records (ONLY if you're confident)
-- DELETE FROM clinician_slot_exceptions WHERE exception_date >= CURRENT_DATE;


-- STEP 5: Final verification
-- ================================================================
SELECT 'STEP 5: Final Verification' as migration_step;

-- Show blocks by clinician
SELECT 
    cp.id as clinician_id,
    u.full_name as clinician_name,
    COUNT(*) as blocked_slots_count
FROM blocked_slots bs
JOIN clinician_profiles cp ON bs.clinician_id = cp.id
JOIN users u ON cp.user_id = u.id
WHERE bs.is_blocked = TRUE
AND bs.blocked_date >= CURRENT_DATE
GROUP BY cp.id, u.full_name
ORDER BY blocked_slots_count DESC;


-- ================================================================
-- MIGRATION COMPLETE
-- ================================================================
-- Next steps:
-- 1. Remove old system logic from backend code (staff.service.ts)
-- 2. Remove old system API endpoints (staff.routes.ts, staff.controller.ts)
-- 3. Deploy updated backend
-- 4. Monitor for any issues
-- ================================================================
