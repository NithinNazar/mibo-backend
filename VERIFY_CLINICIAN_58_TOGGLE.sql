-- Verify clinician 58 was toggled correctly
SELECT 
    cp.id, 
    cp.user_id, 
    cp.is_active as clinician_is_active,
    u.is_active as user_is_active,
    u.full_name,
    cp.updated_at 
FROM clinician_profiles cp
JOIN users u ON cp.user_id = u.id
WHERE cp.id = 58;
