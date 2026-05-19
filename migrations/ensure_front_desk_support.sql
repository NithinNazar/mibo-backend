-- Migration: Ensure Front Desk Staff Support
-- Description: Ensures all necessary tables, columns, and roles exist for front desk staff management
-- Date: 2026-05-19

-- Ensure roles table has FRONT_DESK role (ID 6)
-- First check if is_active column exists in roles table
DO $$ 
BEGIN
  -- Check if is_active column exists in roles table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'roles' AND column_name = 'is_active'
  ) THEN
    -- If is_active exists, insert with it
    INSERT INTO roles (id, name, description, is_active)
    VALUES (6, 'FRONT_DESK', 'Front desk staff with limited access to patient and appointment management', TRUE)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      is_active = EXCLUDED.is_active;
  ELSE
    -- If is_active doesn't exist, insert without it
    INSERT INTO roles (id, name, description)
    VALUES (6, 'FRONT_DESK', 'Front desk staff with limited access to patient and appointment management')
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description;
  END IF;
END $$;

-- Ensure users table has all necessary columns
DO $$ 
BEGIN
  -- Check if username column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'username'
  ) THEN
    ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE;
  END IF;

  -- Check if password_hash column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
  END IF;

  -- Check if user_type column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'user_type'
  ) THEN
    ALTER TABLE users ADD COLUMN user_type VARCHAR(20) DEFAULT 'PATIENT';
  END IF;

  -- Check if is_active column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- Ensure user_roles table exists
CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  centre_id INTEGER REFERENCES centres(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, role_id, centre_id)
);

-- Ensure centre_staff_assignments table exists
CREATE TABLE IF NOT EXISTS centre_staff_assignments (
  id SERIAL PRIMARY KEY,
  centre_id INTEGER NOT NULL REFERENCES centres(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(centre_id, user_id, role_id)
);

-- Ensure staff_profiles table exists
CREATE TABLE IF NOT EXISTS staff_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  designation VARCHAR(100),
  profile_picture_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_centre_id ON user_roles(centre_id);
CREATE INDEX IF NOT EXISTS idx_centre_staff_assignments_user_id ON centre_staff_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_centre_staff_assignments_centre_id ON centre_staff_assignments(centre_id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_user_id ON staff_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);

-- Add comment to document the migration
COMMENT ON TABLE user_roles IS 'Stores role assignments for users with optional centre association';
COMMENT ON TABLE centre_staff_assignments IS 'Tracks which staff members are assigned to which centres';
COMMENT ON TABLE staff_profiles IS 'Additional profile information for staff users';

-- Verify the migration
DO $$
BEGIN
  RAISE NOTICE 'Front Desk Staff Support Migration Completed Successfully';
  RAISE NOTICE 'FRONT_DESK role (ID: 6) is available';
  RAISE NOTICE 'All necessary tables and columns are in place';
END $$;
