-- Check front desk staff users
SELECT 
    u.id, 
    u.full_name, 
    u.phone, 
    u.username, 
    r.name as role, 
    GROUP_CONCAT(uc.centre_id) as centre_ids,
    c.name as centre_name
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
LEFT JOIN user_centres uc ON u.id = uc.user_id
LEFT JOIN centres c ON uc.centre_id = c.id
WHERE r.name = 'FRONT_DESK'
GROUP BY u.id, c.name;
