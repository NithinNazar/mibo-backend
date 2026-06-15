-- Migration: Add date_of_birth column to patient_profiles table
-- This allows storing user's date of birth alongside calculated age

-- Check if column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='patient_profiles' 
        AND column_name='date_of_birth'
    ) THEN
        ALTER TABLE patient_profiles 
        ADD COLUMN date_of_birth DATE NULL;
        
        RAISE NOTICE 'Column date_of_birth added to patient_profiles table';
    ELSE
        RAISE NOTICE 'Column date_of_birth already exists in patient_profiles table';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'patient_profiles'
AND column_name = 'date_of_birth';
