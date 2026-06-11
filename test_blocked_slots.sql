-- Test script to verify blocked_slots filtering

-- 1. Check if blocked_slots table has any active blocked slots
SELECT 
    bs.id,
    bs.clinician_id,
    bs.blocked_date,
    bs.start_time,
    bs.end_time,
    bs.is_blocked,
    bs.reason,
    u.full_name as clinician_name
FROM blocked_slots bs
JOIN clinician_profiles cp ON bs.clinician_id = cp.id
JOIN users u ON cp.user_id = u.id
WHERE bs.is_blocked = TRUE
ORDER BY bs.blocked_date DESC, bs.start_time ASC
LIMIT 10;

-- 2. Check if clinician_slot_exceptions table has any exceptions
SELECT 
    cse.id,
    cse.clinician_id,
    cse.exception_date,
    cse.start_time,
    u.full_name as clinician_name
FROM clinician_slot_exceptions cse
JOIN clinician_profiles cp ON cse.clinician_id = cp.id
JOIN users u ON cp.user_id = u.id
ORDER BY cse.exception_date DESC, cse.start_time ASC
LIMIT 10;

-- 3. Compare: slots that would be blocked by either system
SELECT 
    'blocked_slots' as source,
    bs.clinician_id,
    bs.blocked_date as date,
    bs.start_time,
    bs.end_time,
    bs.is_blocked,
    u.full_name as clinician_name
FROM blocked_slots bs
JOIN clinician_profiles cp ON bs.clinician_id = cp.id
JOIN users u ON cp.user_id = u.id
WHERE bs.is_blocked = TRUE

UNION ALL

SELECT 
    'clinician_slot_exceptions' as source,
    cse.clinician_id,
    cse.exception_date as date,
    cse.start_time,
    NULL as end_time,
    TRUE as is_blocked,
    u.full_name as clinician_name
FROM clinician_slot_exceptions cse
JOIN clinician_profiles cp ON cse.clinician_id = cp.id
JOIN users u ON cp.user_id = u.id

ORDER BY clinician_id, date DESC, start_time ASC
LIMIT 20;
