-- ============================================
-- DEBUG: Simulate Backend Conflict Detection for 9:00 AM Slot
-- This mimics exactly what checkSchedulingConflicts() does
-- ============================================
-- Run this in pgAdmin connected to PRODUCTION
-- ============================================

\echo '=========================================='
\echo 'TEST: Check if 9:00-9:30 AM slot on June 5 has conflicts'
\echo '=========================================='

-- This is EXACTLY what the backend does when checking if 9:00 AM slot is available

WITH test_slot AS (
    -- 9:00 AM IST on June 5, 2026 = 2026-06-05T09:00:00+05:30
    SELECT 
        '2026-06-05T09:00:00+05:30'::TIMESTAMPTZ as slot_start,
        '2026-06-05T09:30:00+05:30'::TIMESTAMPTZ as slot_end,
        61 as clinician_id
)
SELECT 
    'CONFLICT CHECK RESULT' as check_type,
    COUNT(*) as conflict_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '❌ SLOT SHOWS AS BOOKED (hasConflict = true)'
        ELSE '✅ SLOT SHOWS AS AVAILABLE (hasConflict = false)'
    END as result
FROM appointments a, test_slot
WHERE a.clinician_id = test_slot.clinician_id
  AND a.is_active = TRUE
  AND a.status NOT IN ('CANCELLED', 'NO_SHOW')
  AND (
      -- Condition 1: Appointment overlaps with slot
      (a.scheduled_start_at < test_slot.slot_end AND a.scheduled_end_at > test_slot.slot_start)
      OR
      -- Condition 2: Appointment starts within slot
      (a.scheduled_start_at >= test_slot.slot_start AND a.scheduled_start_at < test_slot.slot_end)
  );


\echo ''
\echo '=========================================='
\echo 'DETAIL: Which appointments are causing the conflict?'
\echo '=========================================='

WITH test_slot AS (
    SELECT 
        '2026-06-05T09:00:00+05:30'::TIMESTAMPTZ as slot_start,
        '2026-06-05T09:30:00+05:30'::TIMESTAMPTZ as slot_end,
        61 as clinician_id
)
SELECT 
    a.id as appointment_id,
    a.scheduled_start_at AT TIME ZONE 'Asia/Kolkata' as appt_start_ist,
    a.scheduled_end_at AT TIME ZONE 'Asia/Kolkata' as appt_end_ist,
    test_slot.slot_start AT TIME ZONE 'Asia/Kolkata' as slot_start_ist,
    test_slot.slot_end AT TIME ZONE 'Asia/Kolkata' as slot_end_ist,
    a.status,
    a.appointment_type,
    u.full_name as patient_name,
    u.phone as patient_phone,
    a.source,
    a.created_at AT TIME ZONE 'Asia/Kolkata' as created_at,
    -- Show the overlap
    CASE 
        WHEN a.scheduled_start_at < test_slot.slot_end AND a.scheduled_end_at > test_slot.slot_start
        THEN '✓ Overlaps with slot (Condition 1)'
        WHEN a.scheduled_start_at >= test_slot.slot_start AND a.scheduled_start_at < test_slot.slot_end
        THEN '✓ Starts within slot (Condition 2)'
        ELSE '✗ No overlap'
    END as conflict_reason
FROM appointments a, test_slot
LEFT JOIN patient_profiles pp ON a.patient_id = pp.id
LEFT JOIN users u ON pp.user_id = u.id
WHERE a.clinician_id = test_slot.clinician_id
  AND a.is_active = TRUE
  AND a.status NOT IN ('CANCELLED', 'NO_SHOW')
  AND (
      (a.scheduled_start_at < test_slot.slot_end AND a.scheduled_end_at > test_slot.slot_start)
      OR
      (a.scheduled_start_at >= test_slot.slot_start AND a.scheduled_start_at < test_slot.slot_end)
  )
ORDER BY a.scheduled_start_at;


\echo ''
\echo '=========================================='
\echo 'ALSO CHECK: 9:15 AM slot (this works correctly)'
\echo '=========================================='

WITH test_slot AS (
    SELECT 
        '2026-06-05T09:15:00+05:30'::TIMESTAMPTZ as slot_start,
        '2026-06-05T09:45:00+05:30'::TIMESTAMPTZ as slot_end,
        61 as clinician_id
)
SELECT 
    'CONFLICT CHECK RESULT FOR 9:15 AM' as check_type,
    COUNT(*) as conflict_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '❌ SLOT SHOWS AS BOOKED'
        ELSE '✅ SLOT SHOWS AS AVAILABLE'
    END as result
FROM appointments a, test_slot
WHERE a.clinician_id = test_slot.clinician_id
  AND a.is_active = TRUE
  AND a.status NOT IN ('CANCELLED', 'NO_SHOW')
  AND (
      (a.scheduled_start_at < test_slot.slot_end AND a.scheduled_end_at > test_slot.slot_start)
      OR
      (a.scheduled_start_at >= test_slot.slot_start AND a.scheduled_start_at < test_slot.slot_end)
  );


\echo ''
\echo '=========================================='
\echo 'RAW DUMP: All appointments for Jerry in next 7 days'
\echo '=========================================='

SELECT 
    a.id,
    a.scheduled_start_at,
    a.scheduled_start_at AT TIME ZONE 'Asia/Kolkata' as ist_display,
    a.scheduled_end_at AT TIME ZONE 'Asia/Kolkata' as ist_end,
    TO_CHAR(a.scheduled_start_at AT TIME ZONE 'Asia/Kolkata', 'HH24:MI:SS.MS') as time_precise,
    a.duration_minutes,
    a.status,
    a.is_active,
    u.full_name as patient_name,
    u.phone as patient_phone
FROM appointments a
LEFT JOIN patient_profiles pp ON a.patient_id = pp.id
LEFT JOIN users u ON pp.user_id = u.id
WHERE a.clinician_id = 61
  AND a.scheduled_start_at >= CURRENT_DATE
  AND a.scheduled_start_at < CURRENT_DATE + INTERVAL '7 days'
  AND a.is_active = TRUE
ORDER BY a.scheduled_start_at;


\echo ''
\echo '=========================================='
\echo 'SOLUTION:'
\echo '=========================================='
\echo 'If the first query shows conflict_count > 0:'
\echo '  → There ARE appointments blocking 9:00 AM'
\echo '  → Check the second query to see WHICH appointments'
\echo '  → If they are test appointments, DELETE them'
\echo ''
\echo 'If the first query shows conflict_count = 0:'
\echo '  → Database is clean, no appointments blocking'
\echo '  → Bug is in backend caching or API response caching'
\echo '  → Try restarting backend server'
\echo '  → Check if there is response caching in API gateway/load balancer'
