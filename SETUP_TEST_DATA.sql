-- Complete Database Setup for Testing
-- This script adds the missing column and creates test data

-- ============================================
-- STEP 1: Fix Schema - Add consultation_fee
-- ============================================

ALTER TABLE clinician_profiles 
ADD COLUMN IF NOT EXISTS consultation_fee INTEGER DEFAULT 1600;

-- ============================================
-- STEP 2: Create Test Centres
-- ============================================

-- Insert test centres if they don't exist
INSERT INTO centres (name, city, address_line_1, address_line_2, pincode, contact_phone, is_active)
VALUES 
  ('Mibo Bangalore', 'bangalore', 'MG Road', 'Bangalore', '560001', '+919876543210', TRUE),
  ('Mibo Kochi', 'kochi', 'Marine Drive', 'Kochi', '682031', '+919876543211', TRUE),
  ('Mibo Mumbai', 'mumbai', 'Bandra West', 'Mumbai', '400050', '+919876543212', TRUE)
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 3: Create Test Users (Clinicians)
-- ============================================

-- Create test clinician users
INSERT INTO users (phone, full_name, email, user_type, password_hash, is_active)
VALUES 
  ('+919876543220', 'Dr. Rajesh Kumar', 'rajesh@mibo.com', 'CLINICIAN', '$2b$10$dummy', TRUE),
  ('+919876543221', 'Dr. Priya Sharma', 'priya@mibo.com', 'CLINICIAN', '$2b$10$dummy', TRUE),
  ('+919876543222', 'Dr. Amit Patel', 'amit@mibo.com', 'CLINICIAN', '$2b$10$dummy', TRUE)
ON CONFLICT (phone) DO NOTHING;

-- ============================================
-- STEP 4: Create Clinician Profiles
-- ============================================

-- Link clinicians to centres with profiles
INSERT INTO clinician_profiles (
  user_id, 
  primary_centre_id, 
  specialization, 
  registration_number, 
  experience_years, 
  consultation_fee,
  bio,
  is_active
)
SELECT 
  u.id,
  c.id,
  CASE 
    WHEN u.full_name LIKE '%Rajesh%' THEN 'Psychiatrist'
    WHEN u.full_name LIKE '%Priya%' THEN 'Clinical Psychologist'
    ELSE 'Counselling Psychologist'
  END,
  'REG' || u.id,
  CASE 
    WHEN u.full_name LIKE '%Rajesh%' THEN 15
    WHEN u.full_name LIKE '%Priya%' THEN 10
    ELSE 8
  END,
  1600,
  'Experienced mental health professional',
  TRUE
FROM users u
CROSS JOIN centres c
WHERE u.user_type = 'CLINICIAN'
  AND u.phone IN ('+919876543220', '+919876543221', '+919876543222')
  AND c.name = 'Mibo Bangalore'
  AND NOT EXISTS (
    SELECT 1 FROM clinician_profiles cp 
    WHERE cp.user_id = u.id
  )
LIMIT 3;

-- ============================================
-- STEP 5: Verify Setup
-- ============================================

-- Show centres
SELECT id, name, city FROM centres ORDER BY id;

-- Show clinicians
SELECT 
  cp.id as clinician_id,
  u.full_name,
  cp.specialization,
  cp.consultation_fee,
  c.name as centre_name
FROM clinician_profiles cp
JOIN users u ON cp.user_id = u.id
JOIN centres c ON cp.primary_centre_id = c.id
WHERE cp.is_active = TRUE
ORDER BY cp.id;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

SELECT 'Database setup complete! You can now test booking.' as message;
