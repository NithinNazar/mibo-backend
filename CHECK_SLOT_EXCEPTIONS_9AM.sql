-- ============================================
-- CHECK FOR SLOT EXCEPTIONS AT 9:00 AM
-- This checks if admin manually blocked 9:00 AM slots
-- ============================================
-- Run this in pgAdmin connected to PRODUCTION database
-- ============================================

\echo '=========================================='
\echo 'CHECK: Slot Exceptions for Jerry P Mathew'
\echo '=========================================='

-- Check for ANY slot exceptions for Jerry (clinician_id: 61)
SELECT 
    se.id,
    se.exception_date,
    se.start_time,
    se.end_time,
    se.reason,
    se.created_at AT TIME ZONE 'Asia/Kolkata' as created_ist,
    se.created_by_user_id,
    u.full_name as blocked_by_admin
FROM slot_exceptions se
LEFT JOIN users u ON se.created_by_user_id = u.id
WHERE se.clinician_id = 61
  AND se.exception_date >= '2026-06-01'
ORDER BY se.exception_date, se.start_time;

\echo ''
\echo '=========================================='
\echo 'FOCUS: 9:00 AM Slot Exceptions'
\echo '=========================================='

-- Check specifically for 9:00 AM exceptions
SELECT 
    se.id,
    se.exception_date,
    se.start_time,
    se.end_time,
    se.reason,
    se.created_at AT TIME ZONE 'Asia/Kolkata' as created_ist
FROM slot_exceptions se
WHERE se.clinician_id = 61
  AND se.start_time = '09:00'
  AND se.exception_date >= '2026-06-01'
ORDER BY se.exception_date;

\echo ''
\echo '=========================================='
\echo 'INTERPRETATION:'
\echo '=========================================='
\echo 'If ANY rows returned → Admin manually blocked 9:00 AM slots'
\echo 'If NO rows → Slot exceptions are NOT the issue'
\echo ''
\echo 'DELETE QUERY (if exceptions found):'
\echo 'DELETE FROM slot_exceptions WHERE clinician_id = 61 AND start_time = '"'"'09:00'"'"';'
