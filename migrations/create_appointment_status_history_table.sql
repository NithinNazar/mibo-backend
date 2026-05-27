-- Migration: Create appointment_status_history table
-- Purpose: Track all status changes for appointments (BOOKED → CONFIRMED → IN_PROGRESS → COMPLETED)
-- Date: 2026-05-27
-- 
-- This table is required for the clinician dashboard "Start Session" and "End Session" functionality.
-- It records who changed the status, when, and why (if applicable).
--
-- HOW TO RUN:
-- 1. Open pgAdmin
-- 2. Connect to your database
-- 3. Open Query Tool (Tools → Query Tool)
-- 4. Copy and paste this entire file
-- 5. Click Execute (F5)
-- 6. Verify success message
--
-- The table will be created permanently and will persist after closing pgAdmin.

-- ============================================================================
-- STEP 1: Create appointment_status_history table
-- ============================================================================

CREATE TABLE IF NOT EXISTS appointment_status_history (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL,
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by_user_id INTEGER NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT fk_appointment_status_history_appointment 
    FOREIGN KEY (appointment_id) 
    REFERENCES appointments(id) 
    ON DELETE CASCADE,
  
  CONSTRAINT fk_appointment_status_history_user 
    FOREIGN KEY (changed_by_user_id) 
    REFERENCES users(id) 
    ON DELETE RESTRICT,
  
  -- Check constraint for valid statuses
  CONSTRAINT chk_appointment_status_history_statuses 
    CHECK (
      previous_status IS NULL OR 
      previous_status IN ('BOOKED', 'CONFIRMED', 'IN_PROGRESS', 'RESCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')
    ),
  
  CONSTRAINT chk_appointment_status_history_new_status 
    CHECK (
      new_status IN ('BOOKED', 'CONFIRMED', 'IN_PROGRESS', 'RESCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')
    )
);

-- ============================================================================
-- STEP 2: Create indexes for performance
-- ============================================================================

-- Index for querying status history by appointment
CREATE INDEX IF NOT EXISTS idx_appointment_status_history_appointment_id 
  ON appointment_status_history(appointment_id);

-- Index for querying recent status changes
CREATE INDEX IF NOT EXISTS idx_appointment_status_history_changed_at 
  ON appointment_status_history(changed_at DESC);

-- Index for querying by user who made the change
CREATE INDEX IF NOT EXISTS idx_appointment_status_history_changed_by 
  ON appointment_status_history(changed_by_user_id);

-- Composite index for common queries (appointment + date)
CREATE INDEX IF NOT EXISTS idx_appointment_status_history_apt_date 
  ON appointment_status_history(appointment_id, changed_at DESC);

-- ============================================================================
-- STEP 3: Add comments for documentation
-- ============================================================================

COMMENT ON TABLE appointment_status_history IS 
  'Tracks all status changes for appointments. Used for audit trail and debugging.';

COMMENT ON COLUMN appointment_status_history.appointment_id IS 
  'Reference to the appointment that had its status changed';

COMMENT ON COLUMN appointment_status_history.previous_status IS 
  'The status before the change (NULL for initial creation)';

COMMENT ON COLUMN appointment_status_history.new_status IS 
  'The status after the change';

COMMENT ON COLUMN appointment_status_history.changed_by_user_id IS 
  'User ID of the person who changed the status (clinician, admin, system)';

COMMENT ON COLUMN appointment_status_history.changed_at IS 
  'Timestamp when the status was changed';

COMMENT ON COLUMN appointment_status_history.reason IS 
  'Optional reason for the status change (e.g., cancellation reason)';

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Run this to verify the table was created successfully:
-- SELECT 
--   table_name, 
--   column_name, 
--   data_type, 
--   is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'appointment_status_history'
-- ORDER BY ordinal_position;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '✅ Table: appointment_status_history created';
  RAISE NOTICE '✅ Indexes: 4 indexes created for performance';
  RAISE NOTICE '✅ Constraints: Foreign keys and check constraints added';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Next steps:';
  RAISE NOTICE '1. Verify table exists: SELECT * FROM appointment_status_history LIMIT 1;';
  RAISE NOTICE '2. Test "Start Session" button in clinician dashboard';
  RAISE NOTICE '3. Test "End Session" button in clinician dashboard';
  RAISE NOTICE '4. Check status history: SELECT * FROM appointment_status_history ORDER BY changed_at DESC;';
END $$;
