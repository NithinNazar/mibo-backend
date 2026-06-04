-- ============================================
-- COMPLETE PRODUCTION CHECK FOR JERRY P MATHEW - 9:00 AM BUG
-- ============================================
-- Run this COMPLETE script in pgAdmin connected to PRODUCTION
-- This will give us ALL the information we need
-- ============================================

\echo '=========================================='
\echo 'STEP 1: Find Jerry P Mathew'
\echo '=========================================='

SELECT 
    u.id as user_id,
    u.full_name,
    u.phone,
    cp.id as clinician_id,
    cp.primary_centre_id
FROM users u
JOIN clinician_profiles cp ON u.id = cp.user_id
WHERE u.full_name ILIKE '%Jerry%'
  AND u.full_name ILIKE '%Mathew%';

-- COPY THE clinician_id FROM ABOVE AND REPLACE <JERRY_CLINICIAN_ID> BELOW


\echo ''
\echo '=========================================='
\echo 'STEP 2: All Appointments for June 5, 2026'
\echo '=========================================='

SELECT 
    a.id as appt_id,
    a.scheduled_start_at AT TIME ZONE 'Asia/Kolkata' as ist_start,
    a.scheduled_end_at AT TIME ZONE 'Asia/Kolkata' as ist_end,
    TO_CHAR(a.scheduled_start_at AT TIME ZONE 'Asia/Kolkata', 'HH24:MI:SS') as start_time,
    TO_CHAR(a.scheduled_end_at AT TIME ZONE 'Asia/Kolkata', 'HH24:MI:SS') as end_time,
    a.status,
    a.appointment_type,
    u.full_name as patient_name,
    u.phone as patient_phone,
    a.created_at AT TIME ZONE 'Asia/Kolkata' as created_ist,
    a.is_active
FROM appointments a
LEFT JOIN patient_profiles pp ON a.patient_id = pp.id
LEFT JOIN users u ON pp.user_id = u.id
WHERE a.clinician_id = <JERRY_CLINICIAN_ID>
  AND DATE(a.scheduled_start_at AT TIME ZONE 'Asia/Kolkata') = '2026-06-05'
  AND a.is_active = TRUE
ORDER BY a.scheduled_start_at;


\echo ''
\echo '=========================================='
\echo 'STEP 3: CRITICAL - Appointments at 9:00 AM'
\echo '=========================================='

SELECT 
    a.id,
    a.scheduled_start_at,
    a.scheduled_start_at AT TIME ZONE 'UTC' as utc_display,
    a.scheduled_start_at AT TIME ZONE 'Asia/Kolkata' as ist_display,
    TO_CHAR(a.scheduled_start_at AT TIME ZONE 'Asia/Kolkata', 'HH24:MI:SS.MS') as time_precise,
    a.scheduled_end_at AT TIME ZONE 'Asia/Kolkata' as ist_end,
    a.duration_minutes,
    a.status,
    a.appointment_type,
    a.source,
    u.full_name as patient_name,
    a.created_at AT TIME ZONE 'Asia/Kolkata' as created_at_ist,
    ua.full_name as booked_by,
    a.is_active,
    -- Check for time precision issues
    EXTRACT(SECOND FROM a.scheduled_start_at) as seconds,
    EXTRACT(MILLISECOND FROM a.scheduled_start_at) as milliseconds
FROM appointments a
LEFT JOIN patient_profiles pp ON a.patient_id = pp.id
LEFT JOIN users u ON pp.user_id = u.id
LEFT JOIN users ua ON a.booked_by_user_id = ua.id
WHERE a.clinician_id = <JERRY_CLINICIAN_ID>
  AND TO_CHAR(a.scheduled_start_at AT TIME ZONE 'Asia/Kolkata', 'HH24:MI') = '09:00'
  AND a.scheduled_start_at >= CURRENT_DATE - INTERVAL '7 days'
  AND a.is_active = TRUE
ORDER BY a.scheduled_start_at DESC;


\echo ''
\echo '=========================================='
\echo 'STEP 4: Test Conflict Detection Logic'
\echo '=========================================='

-- This simulates what the backend does for 9:00-9:30 AM slot
WITH test_slot AS (
    SELECT 
        '2026-06-05T09:00:00+05:30'::TIMESTAMP WITH TIME ZONE as slot_start,
        '2026-06-05T09:30:00+05:30'::TIMESTAMP WITH TIME ZONE as slot_end
)
SELECT 
    a.id,
    a.scheduled_start_at AT TIME ZONE 'Asia/Kolkata' as appt_start_ist,
    a.scheduled_end_at AT TIME ZONE 'Asia/Kolkata' as appt_end_ist,
    (SELECT slot_start AT TIME ZONE 'Asia/Kolkata' FROM test_slot) as slot_start_ist,
    (SELECT slot_end AT TIME ZONE 'Asia/Kolkata' FROM test_slot) as slot_end_ist,
    a.status,
    -- This is the EXACT logic from backend checkSchedulingConflicts
    CASE 
        WHEN (a.scheduled_start_at < (SELECT slot_end FROM test_slot) 
              AND a.scheduled_end_at > (SELECT slot_start FROM test_slot))
          OR (a.scheduled_start_at >= (SELECT slot_start FROM test_slot) 
              AND a.scheduled_start_at < (SELECT slot_end FROM test_slot))
        THEN '✓ CONFLICT DETECTED (slot shows as BOOKED)'
        ELSE '✗ No conflict'
    END as backend_conflict_check,
    -- Additional debug info
    a.scheduled_start_at as appt_start_utc,
    (SELECT slot_start FROM test_slot) as slot_start_utc,
    a.scheduled_end_at as appt_end_utc,
    (SELECT slot_end FROM test_slot) as slot_end_utc
FROM appointments a, test_slot
WHERE a.clinician_id = <JERRY_CLINICIAN_ID>
  AND a.is_active = TRUE
  AND a.status NOT IN ('CANCELLED', 'NO_SHOW')
  AND a.scheduled_start_at >= '2026-06-04T00:00:00+05:30'
  AND a.scheduled_start_at < '2026-06-06T00:00:00+05:30'
ORDER BY a.scheduled_start_at;


\echo ''
\echo '=========================================='
\echo 'STEP 5: Check Availability Rules'
\echo '=========================================='

SELECT 
    id,
    clinician_id,
    centre_id,
    day_of_week,
    start_time,
    end_time,
    slot_duration_minutes,
    consultation_mode,
    is_active,
    created_at AT TIME ZONE 'Asia/Kolkata' as created_ist
FROM clinician_availability_rules
WHERE clinician_id = <JERRY_CLINICIAN_ID>
  AND is_active = TRUE
ORDER BY day_of_week, start_time;


\echo ''
\echo '=========================================='
\echo 'STEP 6: Check Slot Exceptions (Blocked)'
\echo '=========================================='

SELECT 
    se.id,
    se.exception_date,
    se.start_time,
    se.end_time,
    se.reason,
    se.created_at AT TIME ZONE 'Asia/Kolkata' as created_ist,
    u.full_name as blocked_by
FROM slot_exceptions se
LEFT JOIN users u ON se.created_by_user_id = u.id
WHERE se.clinician_id = <JERRY_CLINICIAN_ID>
  AND se.exception_date >= CURRENT_DATE - INTERVAL '1 day'
ORDER BY se.exception_date, se.start_time;


\echo ''
\echo '=========================================='
\echo 'STEP 7: Count Appointments by Time'
\echo '=========================================='

SELECT 
    TO_CHAR(scheduled_start_at AT TIME ZONE 'Asia/Kolkata', 'HH24:MI') as time_slot,
    COUNT(*) as count,
    STRING_AGG(DISTINCT status::TEXT, ', ') as statuses,
    MIN(scheduled_start_at AT TIME ZONE 'Asia/Kolkata') as earliest,
    MAX(scheduled_start_at AT TIME ZONE 'Asia/Kolkata') as latest
FROM appointments
WHERE clinician_id = <JERRY_CLINICIAN_ID>
  AND scheduled_start_at >= CURRENT_DATE - INTERVAL '7 days'
  AND is_active = TRUE
GROUP BY TO_CHAR(scheduled_start_at AT TIME ZONE 'Asia/Kolkata', 'HH24:MI')
ORDER BY time_slot;


\echo ''
\echo '=========================================='
\echo 'ANALYSIS GUIDE:'
\echo '=========================================='
\echo 'If STEP 2 shows appointments on June 5 at 9:00 AM → That is why slot shows as booked'
\echo 'If STEP 3 shows appointments with time 09:00:00.XXX (milliseconds) → Time precision issue'
\echo 'If STEP 4 shows CONFLICT DETECTED for 9:00 AM → Appointment overlapping with slot'
\echo 'If STEP 5 shows NO rules for Friday (5) → Availability not set up'
\echo 'If STEP 6 shows blocked slots at 9:00 AM → Admin manually blocked it'
\echo 'If STEP 7 shows multiple appointments at same time → Duplicate booking issue'
\echo ''
\echo 'SOLUTION DEPENDS ON FINDINGS:'
\echo '- Real appointments → DELETE them if they are test data'
\echo '- Blocked slots → Remove from slot_exceptions table'
\echo '- Time precision issue → Fix time format in booking logic'
\echo '- Duplicate bookings → Clean up duplicates'
