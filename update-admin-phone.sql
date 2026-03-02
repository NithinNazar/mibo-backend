-- Update admin phone number
-- This only changes the phone field, all other data remains the same

UPDATE users 
SET phone = '+919083335000'
WHERE id = 3 AND user_type = 'STAFF';

-- Verify the update
SELECT id, full_name, phone, email, user_type 
FROM users 
WHERE id = 3;
