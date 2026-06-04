-- ============================================
-- PRODUCTION DATABASE CHECK: Jerry P Mathew Slots Issue
-- ============================================
-- Run these queries in pgAdmin connected to PRODUCTION database
-- Date: June 4, 2026
-- Issue: Slots at 9:00 AM showing as booked but 9:15 AM works fine
-- ============================================

-- STEP 1: Find Jerry P Mathew's user and clinician IDs
-- ============================================
SELECT 
    u.id as user_id,
    u.full_name,
    u.phone,
    u.email,
    cp.id as clinician_id,
    cp.primary_centre_id,
    cp.is_active
FROM users u
JOIN clinician_profiles cp ON u.id = cp.user_id
WHERE u.full_name ILIKE '%Jerry%Mathew%'
   OR u.full_name ILIKE '%Jerry P Mathew%';

-- EXPECTED: Should return 1 row with Jerry's user_id and clinician_id
-- Copy the clinician_id from the result for the next queries


-- ============================================
-- STEP 2: Check availability rules for Jerry
-- ============================================
-- Replace CLINICIAN_ID with the ID from Step 1
SELECT 
    id as rule_id,
    clinician_id,
    centre_id,
    day_of_week,
    start_time,
    end_time,
    slot_duration_minutes,
    is_active,
    created_at
FROM clinician_availability
WHERE clinician_id = <CLINICIAN_ID>  -- Replace with actual ID
  AND is_active = TRUE
ORDER BY day_of_week, start_time;

-- EXPECTED: Should show availability rules
-- Check if there are rules for Friday (day_of_week = 5)
-- Friday: 0=Sunday, 1=Monday, ..., 5=Friday


-- ============================================
-- STEP 3: Check appointments on June 5, 2026 (Friday) at 9:00 AM
-- ============================================
-- This is the CRITICAL query to find why 9:00 AM shows as booked
SELECT 
    a.id as appointment_id,
    a.clinician_id,
    a.patient_id,
    a.scheduled_start_at,
    a.scheduled_end_at,
    a.status,
    a.appointment_type,
    u.full_name as patient_name,
    u.phone as patient_phone,
    a.created_at,
    a.is_active
FROM appointments a
LEFT JOIN patient_profiles pp ON a.patient_id = pp.id
LEFT JOIN users u ON pp.user_id = u.id
WHERE a.clinician_id = <CLINICIAN_ID>  -- Replace with actual ID
  AND DATE(a.scheduled_start_at AT TIME ZONE 'Asia/Kolkata') = '2026-06-05'
  AND a.is_active = TRUE
ORDER BY a.scheduled_start_at;

-- EXPECTED: If this returns rows with times around 9:00 AM, that's why it shows as booked!
-- Check the scheduled_start_at times carefully


-- ============================================
-- STEP 4: Check for appointments with 9:00 AM time specifically
-- ============================================
SELECT 
    a.id as appointment_id,
    a.clinician_id,
    a.patient_id,
    a.scheduled_start_at,
    a.scheduled_start_at AT TIME ZONE 'Asia/Kolkata' as ist_time,
    TO_CHAR(a.scheduled_start_at AT TIME ZONE 'Asia/Kolkata', 'HH24:MI') as time_only,
    a.scheduled_end_at,
    a.status,
    a.appointment_type,
    u.full_name as patient_name,
    a.is_active
FROM appointments a
LEFT JOIN patient_profiles pp ON a.patient_id = pp.id
LEFT JOIN users u ON pp.user_id = u.id
WHERE a.clinician_id = <CLINICIAN_ID>  -- Replace with actual ID
  AND TO_CHAR(a.scheduled_start_at AT TIME ZONE 'Asia/Kolkata', 'HH24:MI') = '09:00'
  AND a.is_active = TRUE
  AND a.scheduled_start_at >= NOW() - INTERVAL '7 days'
ORDER BY a.scheduled_start_at DESC;

-- EXPECTED: This will show ALL appointments at 9:00 AM for Jerry in the past week


-- ============================================
-- STEP 5: Check slot exceptions (blocked slots)
-- ============================================
SELECT 
    se.id as exception_id,
    se.clinician_id,
    se.centre_id,
    se.exception_date,
    se.start_time,
    se.end_time,
    se.reason,
    se.created_at,
    u.full_name as created_by
FROM slot_exceptions se
LEFT JOIN users u ON se.created_by_user_id = u.id
WHERE se.clinician_id = <CLINICIAN_ID>  -- Replace with actual ID
  AND se.exception_date >= CURRENT_DATE
ORDER BY se.exception_date, se.start_time;

-- EXPECTED: Should show if admin manually blocked any slots


-- ============================================
-- STEP 6: Full investigation - appointments causing conflicts
-- ============================================
SELECT 
    a.id as appointment_id,
    a.scheduled_start_at AT TIME ZONE 'Asia/Kolkata' as start_ist,
    a.scheduled_end_at AT TIME ZONE 'Asia/Kolkata' as end_ist,
    DATE(a.scheduled_start_at AT TIME ZONE 'Asia/Kolkata') as date,
    TO_CHAR(a.scheduled_start_at AT TIME ZONE 'Asia/Kolkata', 'HH24:MI') as start_time,
    TO_CHAR(a.scheduled_end_at AT TIME ZONE 'Asia/Kolkata', 'HH24:MI') as end_time,
    a.status,
    a.appointment_type,
    CASE 
        WHEN a.status IN ('BOOKED', 'CONFIRMED', 'IN_PROGRESS') THEN 'BLOCKS SLOT'
        ELSE 'DOES NOT BLOCK'
    END as blocks_slot,
    u.full_name as patient_name,
    a.is_active
FROM appointments a
LEFT JOIN patient_profiles pp ON a.patient_id = pp.id
LEFT JOIN users u ON pp.user_id = u.id
WHERE a.clinician_id = <CLINICIAN_ID>  -- Replace with actual ID
  AND a.scheduled_start_at >= NOW() - INTERVAL '1 day'
  AND a.is_active = TRUE
ORDER BY a.scheduled_start_at;

-- EXPECTED: This shows all upcoming appointments and whether they block slots


-- ============================================
-- STEP 7: Check for orphaned or duplicate appointments
-- ============================================
SELECT 
    COUNT(*) as appointment_count,
    DATE(scheduled_start_at AT TIME ZONE 'Asia/Kolkata') as date,
    TO_CHAR(scheduled_start_at AT TIME ZONE 'Asia/Kolkata', 'HH24:MI') as time,
    status
FROM appointments
WHERE clinician_id = <CLINICIAN_ID>  -- Replace with actual ID
  AND scheduled_start_at >= CURRENT_DATE - INTERVAL '1 day'
  AND is_active = TRUE
GROUP BY DATE(scheduled_start_at AT TIME ZONE 'Asia/Kolkata'), 
         TO_CHAR(scheduled_start_at AT TIME ZONE 'Asia/Kolkata', 'HH24:MI'),
         status
HAVING COUNT(*) > 1
ORDER BY date, time;

-- EXPECTED: Should be empty. If not, there are duplicate appointments causing issues!


-- ============================================
-- NOTES FOR ANALYSIS:
-- ============================================
-- 1. If Step 3 or 4 shows appointments at 9:00 AM, that's why slots show as booked
-- 2. If Step 5 shows blocked slots, admin manually blocked them
-- 3. If Step 7 shows duplicates, there's a data integrity issue
-- 4. The issue might be timezone-related if times don't match exactly
-- 
-- TIMEZONE INFO:
-- - Database stores times in UTC
-- - API displays times in IST (UTC+5:30)
-- - 9:00 AM IST = 3:30 AM UTC
-- 
-- If you find appointments, check if they were:
-- - Created accidentally during testing
-- - Left over from previous slot configurations
-- - Created with wrong timezone conversion
