-- PRODUCTION MIGRATION: Add Session Tracking to Appointments (AUTO-COMMIT)
-- Date: 2026-05-19
-- Description: Adds fields to track when clinicians start and end sessions
-- This script is SAFE to run multiple times (idempotent)

DO $$
DECLARE
  v_column_exists_started BOOLEAN;
  v_column_exists_ended BOOLEAN;
BEGIN
  -- Check if session_started_at column exists
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'appointments' 
    AND column_name = 'session_started_at'
  ) INTO v_column_exists_started;

  -- Check if session_ended_at column exists
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'appointments' 
    AND column_name = 'session_ended_at'
  ) INTO v_column_exists_ended;

  RAISE NOTICE '=== SESSION TRACKING MIGRATION ===';
  RAISE NOTICE 'session_started_at exists: %', v_column_exists_started;
  RAISE NOTICE 'session_ended_at exists: %', v_column_exists_ended;
  RAISE NOTICE '';

  -- Add session_started_at column if it doesn't exist
  IF NOT v_column_exists_started THEN
    RAISE NOTICE 'Adding session_started_at column...';
    ALTER TABLE appointments 
    ADD COLUMN session_started_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✅ session_started_at column added';
  ELSE
    RAISE NOTICE '⏭️  session_started_at column already exists';
  END IF;

  -- Add session_ended_at column if it doesn't exist
  IF NOT v_column_exists_ended THEN
    RAISE NOTICE 'Adding session_ended_at column...';
    ALTER TABLE appointments 
    ADD COLUMN session_ended_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✅ session_ended_at column added';
  ELSE
    RAISE NOTICE '⏭️  session_ended_at column already exists';
  END IF;

  -- Create indexes (IF NOT EXISTS handles idempotency)
  RAISE NOTICE '';
  RAISE NOTICE 'Creating indexes...';
  
  CREATE INDEX IF NOT EXISTS idx_appointments_session_started_at 
  ON appointments(session_started_at) WHERE session_started_at IS NOT NULL;
  RAISE NOTICE '✅ Index idx_appointments_session_started_at created';

  CREATE INDEX IF NOT EXISTS idx_appointments_session_ended_at 
  ON appointments(session_ended_at) WHERE session_ended_at IS NOT NULL;
  RAISE NOTICE '✅ Index idx_appointments_session_ended_at created';

  -- Add comments to columns
  RAISE NOTICE '';
  RAISE NOTICE 'Adding column comments...';
  COMMENT ON COLUMN appointments.session_started_at IS 'Timestamp when clinician started the session';
  COMMENT ON COLUMN appointments.session_ended_at IS 'Timestamp when clinician ended the session';
  RAISE NOTICE '✅ Column comments added';

  RAISE NOTICE '';
  RAISE NOTICE '=== MIGRATION COMPLETED SUCCESSFULLY ===';
  
END $$;

-- Verify the changes
SELECT 
  '=== VERIFICATION ===' as status,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'appointments'
AND column_name IN ('session_started_at', 'session_ended_at')
ORDER BY column_name;

-- Show sample of appointments table structure
SELECT 
  '=== SAMPLE DATA ===' as status,
  COUNT(*) as total_appointments,
  COUNT(session_started_at) as appointments_with_session_started,
  COUNT(session_ended_at) as appointments_with_session_ended
FROM appointments;

-- Show recent appointments
SELECT 
  '=== RECENT APPOINTMENTS ===' as info,
  id,
  patient_id,
  clinician_id,
  status,
  scheduled_start_at,
  session_started_at,
  session_ended_at
FROM appointments
ORDER BY scheduled_start_at DESC
LIMIT 5;
