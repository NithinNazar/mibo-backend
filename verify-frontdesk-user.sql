-- Verify Front Desk Staff User Configuration
-- Run this to check if front desk users are properly set up

-- 1. Check all front desk staff users
SELECT 
    u.id as user_id,
    u.full_name,
    u.phone,
    u.username,
    r.name as role,
    u.is_active
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE r.name = 'FRONT_DESK';

-- 2. Check centre assignments for front desk staff
SELECT 
    u.id as user_id,
    u.full_name,
    u.phone,
    r.name as role,
    c.id as centre_id,
    c.name as centre_name,
    c.city
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
LEFT JOIN user_centres uc ON u.id = uc.user_id
LEFT JOIN centres c ON uc.centre_id = c.id
WHERE r.name = 'FRONT_DESK'
ORDER BY u.id, c.id;

-- 3. Check appointments by centre
SELECT 
    c.id as centre_id,
    c.name as centre_name,
    COUNT(a.id) as appointment_count
FROM centres c
LEFT JOIN appointments a ON c.id = a.centre_id
GROUP BY c.id, c.name
ORDER BY c.id;

-- 4. Check clinicians by centre
SELECT 
    c.id as centre_id,
    c.name as centre_name,
    COUNT(cl.id) as clinician_count
FROM centres c
LEFT JOIN clinicians cl ON c.id = cl.primary_centre_id
GROUP BY c.id, c.name
ORDER BY c.id;

-- 5. Sample appointments with centre info (first 10)
SELECT 
    a.id as appointment_id,
    a.centre_id,
    c.name as centre_name,
    a.patient_name,
    a.clinician_name,
    a.scheduled_start_at,
    a.status
FROM appointments a
LEFT JOIN centres c ON a.centre_id = c.id
ORDER BY a.scheduled_start_at DESC
LIMIT 10;
