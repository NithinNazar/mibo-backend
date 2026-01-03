-- Fix status column length to accommodate CANCELLATION_REQUESTED
-- Current: VARCHAR(20) - Too short!
-- New: VARCHAR(50) - Enough for all statuses

ALTER TABLE appointments 
ALTER COLUMN status TYPE VARCHAR(50);

-- Verify the change
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'appointments' AND column_name = 'status';
