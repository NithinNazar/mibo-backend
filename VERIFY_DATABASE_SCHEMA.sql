-- ============================================
-- DATABASE SCHEMA VERIFICATION FOR AWS
-- ============================================
-- Run these queries to verify your AWS database has all required columns
-- for the new patient list feature and all fixes

-- ============================================
-- 1. VERIFY USERS TABLE
-- ============================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Expected columns:
-- - id (bigint, NOT NULL)
-- - phone (varchar, nullable)
-- - email (varchar, nullable)
-- - username (varchar, nullable)
-- - password_hash (text, nullable)
-- - full_name (varchar, NOT NULL)
-- - user_type (varchar, NOT NULL) -- 'PATIENT' or 'STAFF'
-- - is_active (boolean, NOT NULL, default true)
-- - created_at (timestamp, NOT NULL, default now())
-- - updated_at (timestamp, NOT NULL, default now())

-- ============================================
-- 2. VERIFY PATIENT_PROFILES TABLE
-- ============================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'patient_profiles'
ORDER BY ordinal_position;

-- Expected columns:
-- - id (bigint, NOT NULL)
-- - user_id (bigint, NOT NULL)
-- - date_of_birth (date, nullable)
-- - gender (varchar, nullable)
-- - blood_group (varchar, nullable)
-- - emergency_contact_name (varchar, nullable)
-- - emergency_contact_phone (varchar, nullable)
-- - notes (text, nullable)
-- - is_active (boolean, NOT NULL, default true)
-- - created_at (timestamp, NOT NULL, default now())
-- - updated_at (timestamp, NOT NULL, default now())

-- ============================================
-- 3. VERIFY APPOINTMENTS TABLE
-- ============================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'appointments'
ORDER BY ordinal_position;

-- Expected columns:
-- - id (bigint, NOT NULL)
-- - patient_id (bigint, NOT NULL)
-- - clinician_id (bigint, NOT NULL)
-- - centre_id (bigint, NOT NULL)
-- - appointment_type (varchar, NOT NULL)
-- - scheduled_start_at (timestamp, NOT NULL)
-- - scheduled_end_at (timestamp, NOT NULL)
-- - duration_minutes (integer, NOT NULL)
-- - status (varchar, NOT NULL)
-- - parent_appointment_id (bigint, nullable)
-- - booked_by_user_id (bigint, NOT NULL)
-- - source (varchar, NOT NULL)
-- - notes (text, nullable)
-- - is_active (boolean, NOT NULL, default true)
-- - created_at (timestamp, NOT NULL, default now())
-- - updated_at (timestamp, NOT NULL, default now())

-- ============================================
-- 4. VERIFY CLINICIAN_PROFILES TABLE
-- ============================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'clinician_profiles'
ORDER BY ordinal_position;

-- Expected columns (CRITICAL - check years_of_experience):
-- - id (bigint, NOT NULL)
-- - user_id (bigint, NOT NULL)
-- - primary_centre_id (bigint, NOT NULL)
-- - specialization (jsonb or varchar, nullable)
-- - registration_number (varchar, nullable)
-- - years_of_experience (integer, nullable) -- NOT experience_years!
-- - consultation_fee (integer, nullable)
-- - bio (text, nullable)
-- - consultation_modes (jsonb, nullable)
-- - default_consultation_duration_minutes (integer, NOT NULL, default 30)
-- - qualification (jsonb, nullable)
-- - expertise (jsonb, nullable)
-- - languages (jsonb, nullable)
-- - profile_picture_url (text, nullable)
-- - is_active (boolean, NOT NULL, default true)
-- - created_at (timestamp, NOT NULL, default now())
-- - updated_at (timestamp, NOT NULL, default now())

-- ============================================
-- 5. VERIFY CENTRE_STAFF_ASSIGNMENTS TABLE
-- ============================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'centre_staff_assignments'
ORDER BY ordinal_position;

-- Expected columns (CRITICAL - check role_id):
-- - id (bigint, NOT NULL)
-- - user_id (bigint, NOT NULL)
-- - centre_id (bigint, NOT NULL)
-- - role_id (bigint, NOT NULL) -- MUST BE NOT NULL!
-- - is_primary (boolean, NOT NULL, default false)
-- - is_active (boolean, NOT NULL, default true)
-- - created_at (timestamp, NOT NULL, default now())
-- - updated_at (timestamp, NOT NULL, default now())

-- ============================================
-- 6. VERIFY CENTRES TABLE
-- ============================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'centres'
ORDER BY ordinal_position;

-- Expected columns:
-- - id (bigint, NOT NULL)
-- - name (varchar, NOT NULL)
-- - city (varchar, NOT NULL)
-- - address_line1 (varchar, nullable)
-- - address_line2 (varchar, nullable)
-- - pincode (varchar, nullable)
-- - contact_phone (varchar, nullable)
-- - timezone (varchar, NOT NULL, default 'Asia/Kolkata')
-- - is_active (boolean, NOT NULL, default true)
-- - created_at (timestamp, NOT NULL, default now())
-- - updated_at (timestamp, NOT NULL, default now())

-- ============================================
-- 7. TEST PATIENT LIST QUERY
-- ============================================
-- This is the actual query used by the patient list feature
-- If this runs successfully, your database is ready!

SELECT 
  u.id as user_id,
  u.full_name,
  u.phone,
  u.email,
  u.username,
  u.created_at,
  pp.id as profile_id,
  pp.date_of_birth,
  pp.gender,
  pp.blood_group,
  pp.emergency_contact_name,
  pp.emergency_contact_phone,
  pp.notes,
  (
    SELECT COUNT(*) 
    FROM appointments a 
    WHERE a.patient_id = u.id 
    AND a.scheduled_start_at > NOW()
    AND a.status NOT IN ('CANCELLED', 'NO_SHOW')
  ) as upcoming_appointments_count,
  (
    SELECT COUNT(*) 
    FROM appointments a 
    WHERE a.patient_id = u.id 
    AND a.scheduled_start_at <= NOW()
  ) as past_appointments_count
FROM users u
LEFT JOIN patient_profiles pp ON u.id = pp.user_id
WHERE u.user_type = 'PATIENT' AND u.is_active = TRUE
ORDER BY u.created_at DESC
LIMIT 5;

-- ============================================
-- 8. VERIFY INDEXES (OPTIONAL BUT RECOMMENDED)
-- ============================================
-- Check if indexes exist for performance

-- Users table indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'users';

-- Patient profiles indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'patient_profiles';

-- Appointments indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'appointments';

-- ============================================
-- SUMMARY OF REQUIRED CHANGES
-- ============================================

-- NO NEW TABLES REQUIRED ✅
-- All features use existing tables

-- CRITICAL COLUMNS TO VERIFY:
-- 1. users.username (varchar, nullable) - Should exist
-- 2. clinician_profiles.years_of_experience (NOT experience_years)
-- 3. centre_staff_assignments.role_id (NOT NULL)

-- IF ANY COLUMN IS MISSING, YOU NEED MIGRATION!
-- IF ALL COLUMNS EXIST, NO MIGRATION NEEDED! ✅
