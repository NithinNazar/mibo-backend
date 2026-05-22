-- Fix: Assign Kochi centre to the front desk staff user

-- First, let's check the current state
SELECT 
    u.id as user_id,
    u.full_name,
    u.username,
    r.name as role,
    GROUP_CONCAT(uc.centre_id) as assigned_centres
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
LEFT JOIN user_centres uc ON u.id = uc.user_id
WHERE u.username = 'front999'
GROUP BY u.id, u.full_name, u.username, r.name;

-- Get the centre IDs
SELECT id, name, city FROM centres;

-- Assign Kochi centre (assuming centre_id = 2 for Kochi, adjust if different)
-- First, delete any existing assignments to avoid duplicates
DELETE FROM user_centres WHERE user_id = (SELECT id FROM users WHERE username = 'front999');

-- Now insert the Kochi centre assignment
-- Replace '2' with the actual Kochi centre ID from the SELECT above
INSERT INTO user_centres (user_id, centre_id, created_at, updated_at)
SELECT 
    u.id,
    c.id,
    NOW(),
    NOW()
FROM users u
CROSS JOIN centres c
WHERE u.username = 'front999' 
  AND c.city = 'kochi';

-- Verify the assignment
SELECT 
    u.id as user_id,
    u.full_name,
    u.username,
    r.name as role,
    c.id as centre_id,
    c.name as centre_name,
    c.city
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
LEFT JOIN user_centres uc ON u.id = uc.user_id
LEFT JOIN centres c ON uc.centre_id = c.id
WHERE u.username = 'front999';
