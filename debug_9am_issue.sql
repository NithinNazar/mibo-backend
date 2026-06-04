-- ============================================
-- DEBUG: Why 9:00 AM shows as booked
-- ============================================
-- This query will help identify if there are appointments
-- that overlap with 9:00 AM slots due to timezone issues
-- ============================================

-- First, let's understand the time conversion
-- 9:00 AM IST = 3:30 AM UTC
-- 9:30 AM IST = 4:00 AM UTC

-- Check for any appointments around 9:00 AM IST (3:30 AM UTC)
SELECT 
    id,
    clinician_id,
    scheduled_start_at,
    scheduled_start_at AT TIME ZONE 'UTC' as utc_time,
    scheduled_start_at AT TIME ZONE 'Asia/Kolkata' as ist_time,
    TO_CHAR(scheduled_start_at AT TIME ZONE 'Asia/Kolkata', 'HH24:MI:SS') as ist_time_only,
    scheduled_end_at,
    status,
    is_active,
    -- Show what slot times this would conflict with
    CASE 
        WHEN scheduled_start_at AT TIME ZONE 'Asia/Kolkata' < TIMESTAMP '2026-06-05 09:30:00'
         AND scheduled_end_at AT TIME ZONE 'Asia/Kolkata' > TIMESTAMP '2026-06-05 09:00:00'
        THEN '✓ CONFLICTS WITH 9:00 AM SLOT'
        ELSE '✗ No conflict with 9:00 AM'
    END as conflicts_with_9am
FROM appointments
WHERE clinician_id = <CLINICIAN_ID>  -- Replace with Jerry's ID
  AND DATE(scheduled_start_at AT TIME ZONE 'Asia/Kolkata') = '2026-06-05'
  AND is_active = TRUE
ORDER BY scheduled_start_at;


-- ============================================
-- Check for appointments with exact 9:00 AM time
-- ============================================
SELECT 
    id,
    scheduled_start_at AT TIME ZONE 'Asia/Kolkata' as ist_start,
    TO_CHAR(scheduled_start_at AT TIME ZONE 'Asia/Kolkata', 'HH24:MI:SS') as time_only,
    status,
    created_at,
    EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as hours_ago
FROM appointments
WHERE clinician_id = <CLINICIAN_ID>  -- Replace with Jerry's ID
  AND TO_CHAR(scheduled_start_at AT TIME ZONE 'Asia/Kolkata', 'HH24:MI') = '09:00'
  AND is_active = TRUE
ORDER BY created_at DESC
LIMIT 10;


-- ============================================
-- Check the overlap logic used by backend
-- ============================================
-- The backend uses this logic for conflict checking:
-- ((scheduled_start_at < $3 AND scheduled_end_at > $2) OR (scheduled_start_at >= $2 AND scheduled_start_at < $3))
--
-- For a 9:00-9:30 slot:
-- $2 = '2026-06-05T03:30:00.000Z' (9:00 AM IST)
-- $3 = '2026-06-05T04:00:00.000Z' (9:30 AM IST)

-- Test the conflict logic
WITH test_slot AS (
    SELECT 
        '2026-06-05T03:30:00.000Z'::TIMESTAMP WITH TIME ZONE as slot_start,
        '2026-06-05T04:00:00.000Z'::TIMESTAMP WITH TIME ZONE as slot_end
)
SELECT 
    a.id,
    a.scheduled_start_at,
    a.scheduled_end_at,
    a.scheduled_start_at AT TIME ZONE 'Asia/Kolkata' as ist_start,
    a.scheduled_end_at AT TIME ZONE 'Asia/Kolkata' as ist_end,
    a.status,
    -- Check if it would be detected as a conflict
    CASE 
        WHEN (a.scheduled_start_at < (SELECT slot_end FROM test_slot) 
              AND a.scheduled_end_at > (SELECT slot_start FROM test_slot))
          OR (a.scheduled_start_at >= (SELECT slot_start FROM test_slot) 
              AND a.scheduled_start_at < (SELECT slot_end FROM test_slot))
        THEN '✓ WOULD BE DETECTED AS CONFLICT'
        ELSE '✗ Would NOT be detected'
    END as conflict_detection
FROM appointments a, test_slot
WHERE a.clinician_id = <CLINICIAN_ID>  -- Replace with Jerry's ID
  AND a.is_active = TRUE
  AND a.status NOT IN ('CANCELLED', 'NO_SHOW')
  AND DATE(a.scheduled_start_at AT TIME ZONE 'Asia/Kolkata') = '2026-06-05'
ORDER BY a.scheduled_start_at;


-- ============================================
-- Check for appointments with seconds in time
-- ============================================
-- Sometimes times like 09:00:00 vs 09:00:01 can cause issues
SELECT 
    id,
    scheduled_start_at,
    scheduled_start_at AT TIME ZONE 'Asia/Kolkata' as ist_time,
    EXTRACT(SECOND FROM scheduled_start_at) as seconds,
    EXTRACT(MILLISECOND FROM scheduled_start_at) as milliseconds,
    status
FROM appointments
WHERE clinician_id = <CLINICIAN_ID>  -- Replace with Jerry's ID
  AND DATE(scheduled_start_at AT TIME ZONE 'Asia/Kolkata') = '2026-06-05'
  AND is_active = TRUE
ORDER BY scheduled_start_at;
