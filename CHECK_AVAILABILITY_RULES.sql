-- Check availability rules for specific clinicians
SELECT 
    cp.id as clinician_id,
    u.full_name,
    COUNT(car.id) as availability_rule_count,
    STRING_AGG(DISTINCT car.day_of_week::text, ', ' ORDER BY car.day_of_week::text) as days_configured
FROM clinician_profiles cp
JOIN users u ON cp.user_id = u.id
LEFT JOIN clinician_availability_rules car ON car.clinician_id = cp.id AND car.is_active = true
WHERE cp.is_active = true
GROUP BY cp.id, u.full_name
ORDER BY availability_rule_count DESC, u.full_name
LIMIT 20;

-- Check specific clinicians mentioned in the tests
SELECT 
    cp.id as clinician_id,
    u.full_name,
    car.day_of_week,
    car.start_time,
    car.end_time,
    car.mode,
    car.centre_id,
    car.is_active
FROM clinician_profiles cp
JOIN users u ON cp.user_id = u.id
LEFT JOIN clinician_availability_rules car ON car.clinician_id = cp.id
WHERE cp.id IN (57, 58, 77)
ORDER BY cp.id, car.day_of_week, car.start_time;
