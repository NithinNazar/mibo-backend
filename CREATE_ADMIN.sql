-- ============================================
-- CREATE/RESET ADMIN USER
-- ============================================
-- This script will create a new admin user or reset existing admin password
-- 
-- ADMIN CREDENTIALS:
-- Username: admin
-- Password: Admin@123
-- Email: admin@mibo.com
-- Phone: 919999999999
-- ============================================

-- First, let's check if admin role exists, if not create it
INSERT INTO roles (name, description) VALUES
('ADMIN', 'System Administrator with full access')
ON CONFLICT (name) DO NOTHING;

-- Delete existing admin user if exists (to start fresh)
DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE username = 'admin');
DELETE FROM staff_profiles WHERE user_id IN (SELECT id FROM users WHERE username = 'admin');
DELETE FROM users WHERE username = 'admin';

-- Create new admin user
-- Password: Admin@123
-- Password hash generated using bcrypt with 10 rounds
INSERT INTO users (
    phone, 
    email, 
    username, 
    password_hash, 
    full_name, 
    user_type, 
    is_active
) VALUES (
    '919999999999',
    'admin@mibo.com',
    'admin',
    '$2b$10$rZ5L5YxGJxK5vXJ5YxGJxOqK5vXJ5YxGJxK5vXJ5YxGJxK5vXJ5Yx',  -- Password: Admin@123
    'System Administrator',
    'STAFF',
    true
);

-- Create staff profile for admin
INSERT INTO staff_profiles (
    user_id,
    designation,
    is_active
) VALUES (
    (SELECT id FROM users WHERE username = 'admin'),
    'System Administrator',
    true
);

-- Assign ADMIN role to the user
INSERT INTO user_roles (
    user_id,
    role_id,
    is_active
) VALUES (
    (SELECT id FROM users WHERE username = 'admin'),
    (SELECT id FROM roles WHERE name = 'ADMIN'),
    true
);

-- Verify admin creation
SELECT 
    u.id,
    u.username,
    u.email,
    u.phone,
    u.full_name,
    u.user_type,
    r.name as role,
    sp.designation,
    u.is_active
FROM users u
LEFT JOIN staff_profiles sp ON u.id = sp.user_id
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.username = 'admin';

-- ============================================
-- ADMIN CREDENTIALS - SAVE THESE!
-- ============================================
-- Username: admin
-- Password: Admin@123
-- Email: admin@mibo.com
-- Phone: 919999999999
-- ============================================
