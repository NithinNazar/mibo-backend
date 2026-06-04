-- ============================================
-- CLINICIAN DASHBOARD SESSION TRACKING MIGRATION
-- ============================================
-- This migration adds necessary fields for tracking clinician sessions,
-- notes history, and follow-ups for the new clinician dashboard

-- ============================================
-- 1. ADD SESSION TRACKING FIELDS TO APPOINTMENTS
-- ============================================
-- Check if columns exist before adding them
DO $$ 
BEGIN
    -- Add session_started_at if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'session_started_at'
    ) THEN
        ALTER TABLE appointments ADD COLUMN session_started_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add session_ended_at if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'session_ended_at'
    ) THEN
        ALTER TABLE appointments ADD COLUMN session_ended_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add patient_notes if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'patient_notes'
    ) THEN
        ALTER TABLE appointments ADD COLUMN patient_notes TEXT;
    END IF;
END $$;

COMMENT ON COLUMN appointments.session_started_at IS 'Timestamp when clinician starts the session';
COMMENT ON COLUMN appointments.session_ended_at IS 'Timestamp when clinician ends the session';
COMMENT ON COLUMN appointments.patient_notes IS 'Notes added by patient during booking';

-- ============================================
-- 2. CREATE CLINICIAN NOTES HISTORY TABLE
-- ============================================
-- This table stores historical notes added by clinicians during sessions
CREATE TABLE IF NOT EXISTS clinician_notes_history (
    id BIGSERIAL PRIMARY KEY,
    appointment_id BIGINT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    clinician_id BIGINT NOT NULL REFERENCES clinician_profiles(id) ON DELETE CASCADE,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    session_notes TEXT NOT NULL,
    created_by_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinician_notes_appointment ON clinician_notes_history(appointment_id);
CREATE INDEX IF NOT EXISTS idx_clinician_notes_clinician ON clinician_notes_history(clinician_id);
CREATE INDEX IF NOT EXISTS idx_clinician_notes_patient ON clinician_notes_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinician_notes_created_at ON clinician_notes_history(created_at DESC);

COMMENT ON TABLE clinician_notes_history IS 'Historical record of clinician notes for each session';
COMMENT ON COLUMN clinician_notes_history.appointment_id IS 'Reference to the appointment';
COMMENT ON COLUMN clinician_notes_history.session_notes IS 'Clinical observations, treatment notes, patient progress';

-- ============================================
-- 3. CREATE FOLLOW-UP APPOINTMENTS TABLE
-- ============================================
-- This table tracks scheduled follow-up appointments
CREATE TABLE IF NOT EXISTS follow_up_appointments (
    id BIGSERIAL PRIMARY KEY,
    parent_appointment_id BIGINT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    patient_id BIGINT NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    clinician_id BIGINT NOT NULL REFERENCES clinician_profiles(id) ON DELETE CASCADE,
    follow_up_date DATE NOT NULL,
    follow_up_notes TEXT,
    is_scheduled BOOLEAN NOT NULL DEFAULT FALSE,
    scheduled_appointment_id BIGINT REFERENCES appointments(id) ON DELETE SET NULL,
    created_by_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_followup_parent_appointment ON follow_up_appointments(parent_appointment_id);
CREATE INDEX IF NOT EXISTS idx_followup_patient ON follow_up_appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_followup_clinician ON follow_up_appointments(clinician_id);
CREATE INDEX IF NOT EXISTS idx_followup_date ON follow_up_appointments(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_followup_is_scheduled ON follow_up_appointments(is_scheduled);

COMMENT ON TABLE follow_up_appointments IS 'Tracks follow-up appointments scheduled during sessions';
COMMENT ON COLUMN follow_up_appointments.parent_appointment_id IS 'Original appointment that triggered follow-up';
COMMENT ON COLUMN follow_up_appointments.follow_up_date IS 'Proposed date for follow-up';
COMMENT ON COLUMN follow_up_appointments.is_scheduled IS 'Whether follow-up has been formally scheduled';
COMMENT ON COLUMN follow_up_appointments.scheduled_appointment_id IS 'If scheduled, reference to actual appointment';

-- ============================================
-- 4. UPDATE EXISTING APPOINTMENTS TABLE
-- ============================================
-- Add index for better performance on clinician dashboard queries
CREATE INDEX IF NOT EXISTS idx_appointments_clinician_date ON appointments(clinician_id, scheduled_start_at DESC) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_appointments_status_date ON appointments(status, scheduled_start_at DESC) WHERE is_active = TRUE;

-- ============================================
-- 5. CREATE VIEW FOR CLINICIAN DASHBOARD STATS
-- ============================================
CREATE OR REPLACE VIEW clinician_daily_stats AS
SELECT 
    a.clinician_id,
    DATE(a.scheduled_start_at AT TIME ZONE 'Asia/Kolkata') as appointment_date,
    COUNT(*) as total_appointments,
    COUNT(*) FILTER (WHERE a.status = 'BOOKED') as waiting_count,
    COUNT(*) FILTER (WHERE a.status = 'IN_PROGRESS') as ongoing_count,
    COUNT(*) FILTER (WHERE a.status = 'CONFIRMED') as confirmed_count,
    COUNT(*) FILTER (WHERE a.status = 'COMPLETED') as completed_count,
    COUNT(*) FILTER (WHERE a.status = 'CANCELLED' OR a.status = 'CANCELLED_BY_ADMIN') as cancelled_count
FROM appointments a
WHERE a.is_active = TRUE
GROUP BY a.clinician_id, DATE(a.scheduled_start_at AT TIME ZONE 'Asia/Kolkata');

COMMENT ON VIEW clinician_daily_stats IS 'Aggregated statistics for clinician dashboard by date';

-- ============================================
-- 6. ADD TRIGGER FOR UPDATED_AT COLUMNS
-- ============================================
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_clinician_notes_history_updated_at'
    ) THEN
        CREATE TRIGGER update_clinician_notes_history_updated_at
            BEFORE UPDATE ON clinician_notes_history
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_follow_up_appointments_updated_at'
    ) THEN
        CREATE TRIGGER update_follow_up_appointments_updated_at
            BEFORE UPDATE ON follow_up_appointments
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the migration

-- Check appointments table has new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'appointments' 
AND column_name IN ('session_started_at', 'session_ended_at', 'patient_notes');

-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('clinician_notes_history', 'follow_up_appointments');

-- Check view exists
SELECT table_name 
FROM information_schema.views 
WHERE table_name = 'clinician_daily_stats';
