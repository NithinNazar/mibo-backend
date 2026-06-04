-- ============================================
-- QUICK CHECK: Any appointments on Fridays for Jerry?
-- Run this FIRST for a quick answer
-- ============================================

-- Check for ANY appointments on June Fridays
SELECT 
    COUNT(*) as total_appointments,
    STRING_AGG(DISTINCT TO_CHAR(scheduled_start_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD HH24:MI'), ', ') as appointment_times
FROM appointments
WHERE clinician_id = 61
  AND DATE(scheduled_start_at AT TIME ZONE 'Asia/Kolkata') IN ('2026-06-05', '2026-06-12', '2026-06-19', '2026-06-26')
  AND is_active = TRUE;

-- If total_appointments > 0, run the detailed queries to see what they are
-- If total_appointments = 0, the database is clean (bug is likely caching)
