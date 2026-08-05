-- Investigation: Abhinand P S showing incorrect slots
-- DO NOT RUN YET - JUST INVESTIGATION

-- 1. Find Abhinand P S in the database
SELECT 
  cp.id as clinician_profile_id,
  u.id as user_id,
  u.full_name as name,
  u.phone,
  cp.user_id as profile_links_to_user_id,
  cp.primary_centre_id,
  cp.is_active
FROM clinician_profiles cp
JOIN users u ON cp.user_id = u.id
WHERE u.full_name ILIKE '%Abhinand%'
   OR u.full_name ILIKE '%P S%'
ORDER BY cp.id;

-- 2. Check availability rules for Abhinand P S
-- Replace {clinician_profile_id} with the ID from query 1
SELECT 
  id,
  clinician_id,
  centre_id,
  day_of_week,
  start_time,
  end_time,
  slot_duration_minutes,
  is_active,
  created_at
FROM clinician_availability_rules
WHERE clinician_id = {clinician_profile_id}
ORDER BY day_of_week, start_time;

-- 3. Check if there are ANY appointments for Abhinand P S
-- Replace {clinician_profile_id} with the ID from query 1
SELECT 
  a.id as appointment_id,
  a.clinician_id,
  a.patient_id,
  a.scheduled_start_at,
  a.scheduled_end_at,
  a.status,
  u_patient.full_name as patient_name,
  u_clinician.full_name as clinician_name
FROM appointments a
LEFT JOIN patient_profiles pp ON a.patient_id = pp.id
LEFT JOIN users u_patient ON pp.user_id = u_patient.id
LEFT JOIN clinician_profiles cp ON a.clinician_id = cp.id
LEFT JOIN users u_clinician ON cp.user_id = u_clinician.id
WHERE a.clinician_id = {clinician_profile_id}
ORDER BY a.scheduled_start_at DESC
LIMIT 20;

-- 4. Check for ID conflicts - Are there multiple clinicians with similar names?
SELECT 
  cp.id as clinician_profile_id,
  u.id as user_id,
  u.full_name,
  COUNT(ar.id) as availability_rules_count,
  COUNT(a.id) as appointments_count
FROM clinician_profiles cp
JOIN users u ON cp.user_id = u.id
LEFT JOIN clinician_availability_rules ar ON ar.clinician_id = cp.id AND ar.is_active = TRUE
LEFT JOIN appointments a ON a.clinician_id = cp.id AND a.is_active = TRUE
WHERE cp.is_active = TRUE
GROUP BY cp.id, u.id, u.full_name
HAVING u.full_name ILIKE '%Abhinand%' OR u.full_name ILIKE '%P S%'
ORDER BY cp.id;

-- 5. Check all active clinicians and their availability setup
SELECT 
  cp.id as clinician_profile_id,
  u.full_name,
  COUNT(DISTINCT ar.id) as availability_rules_count,
  COUNT(DISTINCT a.id) as total_appointments
FROM clinician_profiles cp
JOIN users u ON cp.user_id = u.id
LEFT JOIN clinician_availability_rules ar ON ar.clinician_id = cp.id AND ar.is_active = TRUE
LEFT JOIN appointments a ON a.clinician_id = cp.id AND a.is_active = TRUE
WHERE cp.is_active = TRUE
GROUP BY cp.id, u.full_name
ORDER BY u.full_name;

-- 6. Check if there's a default/fallback clinician being used
-- This would explain why slots show for someone without availability rules
SELECT 
  cp.id,
  u.full_name,
  ar.day_of_week,
  ar.start_time,
  ar.end_time,
  ar.clinician_id as rule_clinician_id
FROM clinician_availability_rules ar
JOIN clinician_profiles cp ON ar.clinician_id = cp.id
JOIN users u ON cp.user_id = u.id
WHERE ar.is_active = TRUE
  AND cp.is_active = TRUE
ORDER BY ar.clinician_id, ar.day_of_week, ar.start_time;
