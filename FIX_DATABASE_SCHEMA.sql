-- Fix Missing consultation_fee Column
-- Run this to fix the "column cp.consultation_fee does not exist" error

-- Add consultation_fee column to clinician_profiles table
ALTER TABLE clinician_profiles 
ADD COLUMN IF NOT EXISTS consultation_fee INTEGER DEFAULT 1600;

-- Update existing records to have a default fee
UPDATE clinician_profiles 
SET consultation_fee = 1600 
WHERE consultation_fee IS NULL;

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'clinician_profiles' 
AND column_name = 'consultation_fee';

-- Show sample data
SELECT id, user_id, specialization, consultation_fee 
FROM clinician_profiles 
LIMIT 5;
