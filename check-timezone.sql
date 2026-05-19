-- ============================================================================
-- CHECK TIMEZONE CONFIGURATION
-- ============================================================================

-- 1. Database timezone
SHOW timezone;

-- 2. Current timestamp in different formats
SELECT 
    NOW() as current_timestamp_with_tz,
    CURRENT_TIMESTAMP as current_timestamp,
    LOCALTIMESTAMP as local_timestamp,
    NOW() AT TIME ZONE 'UTC' as utc_time,
    NOW() AT TIME ZONE 'Asia/Kolkata' as ist_time;

-- 3. Sample appointment timestamps
SELECT 
    'Sample Appointment Times' as info,
    scheduled_start_at,
    scheduled_start_at AT TIME ZONE 'UTC' as utc_time,
    scheduled_start_at AT TIME ZONE 'Asia/Kolkata' as ist_time
FROM appointments
ORDER BY created_at DESC
LIMIT 3;

-- 4. Centre timezone configuration
SELECT 
    id,
    name,
    city,
    timezone
FROM centres
WHERE is_active = true
LIMIT 5;
