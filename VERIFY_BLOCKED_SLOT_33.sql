-- Verification script for blocked slot id=33
-- Run this on production database

-- 1. Check the blocked slot record
SELECT 
    id,
    clinician_id,
    centre_id,
    blocked_date,
    start_time,
    end_time,
    is_blocked,
    reason,
    blocked_at
FROM blocked_slots
WHERE id = 33;

-- 2. Check what availability rules exist for Jerry P Mathew on 2026-06-08
SELECT 
    id,
    clinician_id,
    centre_id,
    day_of_week,
    start_time,
    end_time,
    mode,
    slot_duration_minutes,
    is_active
FROM clinician_availability_rules
WHERE clinician_id = 61
AND day_of_week = EXTRACT(DOW FROM DATE '2026-06-08')
ORDER BY start_time;

-- 3. Check if there are any appointments for this slot
SELECT 
    id,
    patient_id,
    clinician_id,
    scheduled_start_at,
    scheduled_end_at,
    status
FROM appointments
WHERE clinician_id = 61
AND DATE(scheduled_start_at) = '2026-06-08'
AND TIME(scheduled_start_at) = '12:15:00'
ORDER BY scheduled_start_at;

-- 4. Check if the slot appears in old system (clinician_slot_exceptions)
SELECT 
    id,
    clinician_id,
    centre_id,
    exception_date,
    start_time,
    mode,
    is_exception_active
FROM clinician_slot_exceptions
WHERE clinician_id = 61
AND exception_date = '2026-06-08'
AND start_time = '12:15:00';
