-- Create test user with username and password on AWS database
-- Run this in pgAdmin connected to AWS RDS

-- First, check if user already exists
SELECT id, username, phone, email, full_name 
FROM users 
WHERE username = 'testuser123' OR phone = '919111111111';

-- If user doesn't exist, run this entire block:
-- This creates both user and patient profile in one transaction

DO $$
DECLARE
  new_user_id BIGINT;
BEGIN
  -- Insert user with hashed password
  INSERT INTO users (username, password_hash, phone, email, full_name, user_type, is_active)
  VALUES (
    'testuser123',
    '$2b$10$Q0cFryFE2ljhpdjNf3bQGuXRNtbSp4DoGmYBfaCj7ugb5gT1ihb2m',
    '919111111111',
    'testuser123@mibocare.com',
    'Test User for Razorpay',
    'PATIENT',
    true
  )
  RETURNING id INTO new_user_id;
  
  -- Create patient profile using the new user ID
  INSERT INTO patient_profiles (user_id, is_active)
  VALUES (new_user_id, true);
  
  -- Show success message
  RAISE NOTICE 'User created with ID: %', new_user_id;
END $$;

-- Verify the user was created
SELECT 
  u.id as user_id,
  u.username,
  u.email,
  u.full_name,
  u.phone,
  u.user_type,
  pp.id as patient_profile_id
FROM users u
LEFT JOIN patient_profiles pp ON pp.user_id = u.id
WHERE u.username = 'testuser123';
