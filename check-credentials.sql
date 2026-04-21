-- Check if username and password_hash are correctly stored for clinicians
SELECT 
    u.id as user_id,
    u.full_name,
    u.username,
    u.password_hash,
    u.user_type,
    u.is_active,
    cp.id as clinician_id
FROM users u
JOIN clinician_profiles cp ON u.id = cp.user_id
WHERE u.user_type = 'STAFF'
AND cp.is_active = TRUE
ORDER BY u.id DESC
LIMIT 5;
