-- ============================================
-- CHECK ALL APPOINTMENTS ON FRIDAYS IN JUNE 2026
-- FOR JERRY P MATHEW (clinician_id: 61)
-- ============================================
-- This checks June 5, 12, 19, 26 (all Fridays)
-- Run this in pgAdmin connected to PRODUCTION database
-- ============================================

\echo '=========================================='
\echo 'CHECK 1: Jerry P Mathew Profile'
\echo '=========================================='

SELECT 
    u.id as user_id,
    u.full_name,
    u.phone,
    cp.id as clinician_id
FROM users u
JOIN clinician_profiles cp ON u.id = cp.user_id
WHERE u.phone = '8345634567';


\echo ''
\echo '=========================================='
\echo 'CHECK 2: All Friday Appointments in June 2026'
\echo '=========================================='

SELECT 
    a.id as appt_id,
    a.scheduled_start_at AT TIME ZONE 'Asia/Kolkata' as ist_start,
    TO_CHAR(a.scheduled_start_at AT TIME ZONE 'Asia/Kolkata', 'Day') as day_name,
    DATE(a.scheduled_start_at AT TIME ZONE 'Asia/Kolkata') as date,
    TO_CHAR(a.scheduled_start_at AT TIME ZONE 'Asia/Kolkata', 'HH24:MI:SS') as time,
    a.status,
    a.appointment_type,
    u.full_name as patient_name,
    u.phone as patient_phone,
    a.is_active
FROM appointments a
LEFT JOIN patient_profiles pp ON a.patient_id = pp.id
LEFT JOIN users u ON pp.user_id = u.id
WHERE a.clinician_id = 61
  AND DATE(a.scheduled_start_at AT TIME ZONE 'Asia/Kolkata') IN ('2026-06-05', '2026-06-12', '2026-06-19', '2026-06-26')
  AND a.is_active = TRUE
ORDER BY a.scheduled_start_at;


\echo ''
\echo '=========================================='
\echo 'CHECK 3: Focus on 9:00 AM Slots on Fridays'
\echo '=========================================='

SELECT 
    a.id,
    DATE(a.scheduled_start_at AT TIME ZONE 'Asia/Kolkata') as date,
    a.scheduled_start_at AT TIME ZONE 'Asia/Kolkata' as ist_start,
    TO_CHAR(a.scheduled_start_at AT TIME ZONE 'Asia/Kolkata', 'HH24:MI:SS.MS') as time_precise,
    a.scheduled_end_at AT TIME ZONE 'Asia/Kolkata' as ist_end,
    a.duration_minutes,
    a.status,
    a.appointment_type,
    u.full_name as patient_name,
    u.phone as patient_phone,
    a.source,
    a.created_at AT TIME ZONE 'Asia/Kolkata' as created_at,
    a.is_active
FROM appointments a
LEFT JOIN patient_profiles pp ON a.patient_id = pp.id
LEFT JOIN users u ON pp.user_id = u.id
WHERE a.clinician_id = 61
  AND TO_CHAR(a.scheduled_start_at AT TIME ZONE 'Asia/Kolkata', 'HH24:MI') = '09:00'
  AND a.scheduled_start_at >= '2026-06-01'
  AND a.scheduled_start_at < '2026-07-01'
  AND a.is_active = TRUE
ORDER BY a.scheduled_start_at;


\echo ''
\echo '=========================================='
\echo 'CHECK 4: All Appointments on June 5, 2026'
\echo '=========================================='

SELECT 
    a.id,
    TO_CHAR(a.scheduled_start_at AT TIME ZONE 'Asia/Kolkata', 'HH24:MI') as time,
    a.scheduled_start_at AT TIME ZONE 'Asia/Kolkata' as ist_start,
    a.scheduled_end_at AT TIME ZONE 'Asia/Kolkata' as ist_end,
    a.status,
    u.full_name as patient_name,
    u.phone as patient_phone,
    a.is_active
FROM appointments a
LEFT JOIN patient_profiles pp ON a.patient_id = pp.id
LEFT JOIN users u ON pp.user_id = u.id
WHERE a.clinician_id = 61
  AND DATE(a.scheduled_start_at AT TIME ZONE 'Asia/Kolkata') = '2026-06-05'
  AND a.is_active = TRUE
ORDER BY a.scheduled_start_at;


\echo ''
\echo '=========================================='
\echo 'CHECK 5: Slot Exceptions (Blocked Slots)'
\echo '=========================================='

SELECT 
    se.id,
    se.exception_date,
    se.start_time,
    se.end_time,
    se.reason,
    se.created_at AT TIME ZONE 'Asia/Kolkata' as created_ist
FROM slot_exceptions se
WHERE se.clinician_id = 61
  AND se.exception_date IN ('2026-06-05', '2026-06-12', '2026-06-19', '2026-06-26')
ORDER BY se.exception_date, se.start_time;


\echo ''
\echo '=========================================='
\echo 'CHECK 6: Availability Rules for Friday'
\echo '=========================================='

SELECT 
    id,
    day_of_week,
    start_time,
    end_time,
    slot_duration_minutes,
    consultation_mode,
    is_active
FROM clinician_availability_rules
WHERE clinician_id = 61
  AND day_of_week = 5  -- Friday = 5 (Sunday = 0)
  AND is_active = TRUE;


\echo ''
\echo '=========================================='
\echo 'INTERPRETATION:'
\echo '=========================================='
\echo 'If CHECK 2 shows any appointments → Those are blocking the slots'
\echo 'If CHECK 3 shows 9:00 AM appointments → That is the exact issue'
\echo 'If CHECK 4 shows appointments on June 5 → Delete if they are test data'
\echo 'If CHECK 5 shows blocked slots → Admin manually blocked them'
\echo 'If CHECK 6 shows no rules → Friday availability not configured'
\echo ''
\echo 'SOLUTION: If test appointments found, run DELETE query'
