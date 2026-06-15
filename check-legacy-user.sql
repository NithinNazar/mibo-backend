-- Check legacy user data
SELECT 
    u.id, 
    u.phone, 
    u.first_name, 
    u.last_name, 
    u.full_name, 
    u.email,
    u.created_at,
    p.age,
    p.gender,
    p.date_of_birth
FROM users u
LEFT JOIN patient_profiles p ON u.id = p.user_id
WHERE u.phone = '919048810697';
