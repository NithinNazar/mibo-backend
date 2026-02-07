-- Migration: Fix clinician specialization and qualification data to be proper arrays
-- Date: 2026-02-06
-- Description: Converts string JSONB values to array JSONB values

-- Fix specialization: convert string to array
UPDATE clinician_profiles
SET specialization = jsonb_build_array(specialization::text)
WHERE jsonb_typeof(specialization) = 'string';

-- Fix qualification: convert string to array  
UPDATE clinician_profiles
SET qualification = jsonb_build_array(qualification::text)
WHERE jsonb_typeof(qualification) = 'string';

-- Set empty arrays for null values
UPDATE clinician_profiles
SET specialization = '[]'::jsonb
WHERE specialization IS NULL OR specialization = 'null'::jsonb;

UPDATE clinician_profiles
SET qualification = '[]'::jsonb
WHERE qualification IS NULL OR qualification = 'null'::jsonb;

-- Verify the changes
SELECT 
  id,
  specialization,
  jsonb_typeof(specialization) as spec_type,
  qualification,
  jsonb_typeof(qualification) as qual_type
FROM clinician_profiles
LIMIT 5;
