-- ============================================
-- CHECK FOR SLOT EXCEPTIONS AT 9:00 AM (CORRECTED)
-- Table name: clinician_slot_exceptions
-- ============================================
-- Run this in pgAdmin connected to PRODUCTION database
-- ============================================

-- Query 1: Check ALL slot exceptions for Jerry
SELECT 
    cse.id,
    cse.clinician_id,
    cse.centre_id,
    cse.exception_date,
    cse.start_time,
    cse.end_time,
    cse.reason,
    cse.created_at AT TIME ZONE 'Asia/Kolkata' as created_ist,
    cse.created_by_user_id,
    u.full_name as blocked_by_admin
FROM clinician_slot_exceptions cse
LEFT JOIN users u ON cse.created_by_user_id = u.id
WHERE cse.clinician_id = 61
  AND cse.exception_date >= '2026-06-01'
ORDER BY cse.exception_date, cse.start_time;

-- Query 2: Check specifically for 9:00 AM exceptions
SELECT 
    cse.id,
    cse.exception_date,
    cse.start_time,
    cse.end_time,
    cse.reason,
    cse.created_at AT TIME ZONE 'Asia/Kolkata' as created_ist
FROM clinician_slot_exceptions cse
WHERE cse.clinician_id = 61
  AND cse.start_time = '09:00'
  AND cse.exception_date >= '2026-06-01'
ORDER BY cse.exception_date;

-- Query 3: Count total exceptions for Jerry
SELECT COUNT(*) as total_exceptions
FROM clinician_slot_exceptions
WHERE clinician_id = 61;
