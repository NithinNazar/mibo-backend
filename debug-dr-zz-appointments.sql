-- Debug Script: Check Dr. ZZ's Appointments
-- This script helps diagnose why appointments aren't showing for Dr. ZZ

-- 1. Find Dr. ZZ's user account
SELECT 
  '=== DR. ZZ USER ACCOUNT ===' as info,
  u.id as user_id,
  u.full_name,
  u.username,
  u.phone,
  u.user_type,
  u.is_active
FROM users u
WHERE u.username = 'doctor1234' OR u.full_name ILIKE '%Dr%ZZ%' OR u.full_name ILIKE '%Dr. ZZ%';

-- 2. Find Dr. ZZ's clinician profile
SELECT 
  '=== DR. ZZ CLINICIAN PROFILE ===' as info,
  cp.id as clinician_profile_id,
  cp.user_id,
  u.full_name,
  u.username,
  cp.specialization,
  cp.is_active as clinician_active
FROM clinician_profiles cp
JOIN users u ON cp.user_id = u.id
WHERE u.username = 'doctor1234' OR u.full_name ILIKE '%Dr%ZZ%' OR u.full_name ILIKE '%Dr. ZZ%';

-- 3. Check all appointments for Dr. ZZ (by clinician_id)
SELECT 
  '=== APPOINTMENTS FOR DR. ZZ ===' as info,
  a.id as appointment_id,
  a.clinician_id,
  a.patient_id,
  pp.full_name as patient_name,
  a.scheduled_start_at,
  a.scheduled_end_at,
  a.status,
  a.appointment_type,
  a.notes as clinician_notes,
  a.patient_notes,
  c.name as centre_name,
  a.is_active
FROM appointments a
LEFT JOIN patient_profiles pp ON a.patient_id = pp.id
LEFT JOIN centres c ON a.centre_id = c.id
WHERE a.clinician_id IN (
  SELECT cp.id 
  FROM clinician_profiles cp
  JOIN users u ON cp.user_id = u.id
  WHERE u.username = 'doctor1234' OR u.full_name ILIKE '%Dr%ZZ%' OR u.full_name ILIKE '%Dr. ZZ%'
)
ORDER BY a.scheduled_start_at DESC;

-- 4. Check if there are ANY appointments in the system
SELECT 
  '=== ALL APPOINTMENTS COUNT ===' as info,
  COUNT(*) as total_appointments,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_appointments,
  COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_appointments
FROM appointments;

-- 5. Check recent appointments (any clinician)
SELECT 
  '=== RECENT APPOINTMENTS (ALL CLINICIANS) ===' as info,
  a.id,
  a.clinician_id,
  cp.user_id as clinician_user_id,
  u.full_name as clinician_name,
  a.patient_id,
  pp.full_name as patient_name,
  a.scheduled_start_at,
  a.status
FROM appointments a
LEFT JOIN clinician_profiles cp ON a.clinician_id = cp.id
LEFT JOIN users u ON cp.user_id = u.id
LEFT JOIN patient_profiles pp ON a.patient_id = pp.id
ORDER BY a.created_at DESC
LIMIT 10;

-- 6. Check if patient_profiles table has the correct structure
SELECT 
  '=== PATIENT_PROFILES STRUCTURE ===' as info,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'patient_profiles'
AND column_name IN ('id', 'user_id', 'full_name', 'phone')
ORDER BY ordinal_position;

-- 7. Check appointments table for patient_notes column
SELECT 
  '=== APPOINTMENTS TABLE - NOTES COLUMNS ===' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'appointments'
AND column_name IN ('notes', 'patient_notes', 'session_started_at', 'session_ended_at')
ORDER BY ordinal_position;
