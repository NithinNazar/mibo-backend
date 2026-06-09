-- TEST MIGRATION ON DEVELOPMENT DATABASE
-- This tests the migration logic without affecting production

-- 1. Check current state
SELECT 'Old System' as system, COUNT(*) as count FROM clinician_slot_exceptions;
SELECT 'New System' as system, COUNT(*) as count FROM blocked_slots WHERE is_blocked = TRUE;

-- 2. Test the INSERT with ON CONFLICT (dry run simulation)
-- This shows what WOULD be inserted
SELECT 
    'Would Insert' as action,
    cse.clinician_id,
    cse.centre_id,
    cse.exception_date,
    cse.start_time,
    cse.end_time
FROM clinician_slot_exceptions cse
WHERE cse.exception_date >= CURRENT_DATE
ORDER BY cse.exception_date, cse.start_time;

-- 3. Check for any potential conflicts
SELECT 
    'Potential Conflicts' as check_type,
    COUNT(*) as conflict_count
FROM clinician_slot_exceptions cse
WHERE cse.exception_date >= CURRENT_DATE
AND EXISTS (
    SELECT 1 
    FROM blocked_slots bs
    WHERE bs.clinician_id = cse.clinician_id
    AND bs.centre_id = cse.centre_id
    AND bs.blocked_date = cse.exception_date
    AND bs.start_time = cse.start_time
    AND bs.is_blocked = TRUE
);

-- 4. Actually run the migration (safe because of ON CONFLICT)
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
    COALESCE(cse.reason, 'Migrated from old system - DEV TEST') as reason,
    cse.created_by_user_id,
    COALESCE(cse.created_at, NOW()) as blocked_at,
    TRUE as is_blocked
FROM clinician_slot_exceptions cse
WHERE cse.exception_date >= CURRENT_DATE
ORDER BY cse.exception_date, cse.start_time
ON CONFLICT (clinician_id, centre_id, blocked_date, start_time, end_time) 
DO NOTHING;

-- 5. Verify migration result
SELECT 'After Migration' as system, COUNT(*) as count FROM blocked_slots WHERE is_blocked = TRUE;

-- 6. Show newly migrated records
SELECT 
    'Newly Migrated Records' as result,
    id,
    clinician_id,
    centre_id,
    blocked_date,
    start_time,
    reason
FROM blocked_slots
WHERE reason LIKE '%DEV TEST%'
ORDER BY blocked_date, start_time;
