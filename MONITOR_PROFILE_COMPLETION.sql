-- =====================================================================
-- Monitor Profile Completion Progress
-- =====================================================================
-- Run this periodically to see how many legacy users have completed their profiles

SELECT 
    COUNT(*) as total_patients,
    COUNT(CASE WHEN pp.age IS NOT NULL AND pp.gender IS NOT NULL AND pp.date_of_birth IS NOT NULL THEN 1 END) as completed_profiles,
    COUNT(CASE WHEN pp.age IS NULL OR pp.gender IS NULL OR pp.date_of_birth IS NULL THEN 1 END) as pending_profiles,
    ROUND(
        100.0 * COUNT(CASE WHEN pp.age IS NOT NULL AND pp.gender IS NOT NULL AND pp.date_of_birth IS NOT NULL THEN 1 END) / COUNT(*), 
        2
    ) as completion_percentage
FROM users u
LEFT JOIN patient_profiles pp ON u.id = pp.user_id
WHERE u.user_type = 'PATIENT';
