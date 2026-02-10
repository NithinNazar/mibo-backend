# AWS Database Migration Guide

## Date: February 9, 2026

## Purpose: Verify and migrate AWS database for all recent fixes

---

## QUICK ANSWER

### ✅ **NO NEW TABLES REQUIRED**

All features use existing database tables.

### ⚠️ **VERIFY THESE COLUMNS**

You need to check if these columns exist in your AWS database:

1. **users.username** (varchar, nullable)
2. **clinician_profiles.years_of_experience** (NOT experience_years)
3. **centre_staff_assignments.role_id** (NOT NULL)

---

## STEP-BY-STEP VERIFICATION

### Step 1: Connect to AWS Database

```bash
# Using psql
psql -h your-aws-rds-endpoint.amazonaws.com -U postgres -d your-database-name

# Or use pgAdmin with AWS RDS endpoint
```

### Step 2: Run Verification Script

```sql
-- Copy and paste the entire VERIFY_DATABASE_SCHEMA.sql file
-- Or run it directly:
\i VERIFY_DATABASE_SCHEMA.sql
```

### Step 3: Check Results

Look for these specific columns:

#### ✅ MUST EXIST: users.username

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'username';
```

**Expected Result:** 1 row returned with 'username'

**If Missing:** Run migration below

#### ✅ MUST EXIST: clinician_profiles.years_of_experience

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'clinician_profiles'
AND column_name = 'years_of_experience';
```

**Expected Result:** 1 row returned with 'years_of_experience'

**If Missing or shows 'experience_years':** Run migration below

#### ✅ MUST EXIST: centre_staff_assignments.role_id (NOT NULL)

```sql
SELECT column_name, is_nullable FROM information_schema.columns
WHERE table_name = 'centre_staff_assignments'
AND column_name = 'role_id';
```

**Expected Result:** 1 row with is_nullable = 'NO'

**If Missing or nullable:** Run migration below

---

## MIGRATIONS (IF NEEDED)

### Migration 1: Add username column to users table

```sql
-- Check if column exists
SELECT column_name FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'username';

-- If not exists, add it
ALTER TABLE users
ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
```

### Migration 2: Fix clinician_profiles column name

```sql
-- Check current column name
SELECT column_name FROM information_schema.columns
WHERE table_name = 'clinician_profiles'
AND column_name IN ('experience_years', 'years_of_experience');

-- If column is named 'experience_years', rename it
ALTER TABLE clinician_profiles
RENAME COLUMN experience_years TO years_of_experience;

-- If column doesn't exist at all, add it
ALTER TABLE clinician_profiles
ADD COLUMN IF NOT EXISTS years_of_experience INTEGER DEFAULT 0;
```

### Migration 3: Ensure role_id is NOT NULL in centre_staff_assignments

```sql
-- Check if role_id exists and is nullable
SELECT column_name, is_nullable FROM information_schema.columns
WHERE table_name = 'centre_staff_assignments'
AND column_name = 'role_id';

-- If column doesn't exist, add it
ALTER TABLE centre_staff_assignments
ADD COLUMN IF NOT EXISTS role_id BIGINT;

-- Update any NULL values with a default role (adjust role_id as needed)
-- First, check what roles exist
SELECT id, name FROM roles;

-- Update NULL role_ids (use appropriate role_id from your roles table)
UPDATE centre_staff_assignments
SET role_id = (SELECT id FROM roles WHERE name = 'CLINICIAN' LIMIT 1)
WHERE role_id IS NULL;

-- Make it NOT NULL
ALTER TABLE centre_staff_assignments
ALTER COLUMN role_id SET NOT NULL;

-- Add foreign key constraint if not exists
ALTER TABLE centre_staff_assignments
ADD CONSTRAINT fk_centre_staff_role
FOREIGN KEY (role_id) REFERENCES roles(id)
ON DELETE RESTRICT;
```

---

## VERIFICATION AFTER MIGRATION

### Test 1: Verify All Columns Exist

```sql
-- Should return 3 rows
SELECT
  'users.username' as check_item,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'username'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT
  'clinician_profiles.years_of_experience',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clinician_profiles' AND column_name = 'years_of_experience'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT
  'centre_staff_assignments.role_id (NOT NULL)',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'centre_staff_assignments'
    AND column_name = 'role_id'
    AND is_nullable = 'NO'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END;
```

**Expected Result:** All 3 rows should show '✅ EXISTS'

### Test 2: Run Patient List Query

```sql
-- This is the actual query used by the patient list feature
SELECT
  u.id as user_id,
  u.full_name,
  u.phone,
  u.email,
  u.username,
  u.created_at,
  pp.id as profile_id,
  pp.date_of_birth,
  pp.gender,
  pp.blood_group,
  (
    SELECT COUNT(*)
    FROM appointments a
    WHERE a.patient_id = u.id
    AND a.scheduled_start_at > NOW()
  ) as upcoming_appointments_count,
  (
    SELECT COUNT(*)
    FROM appointments a
    WHERE a.patient_id = u.id
    AND a.scheduled_start_at <= NOW()
  ) as past_appointments_count
FROM users u
LEFT JOIN patient_profiles pp ON u.id = pp.user_id
WHERE u.user_type = 'PATIENT' AND u.is_active = TRUE
ORDER BY u.created_at DESC
LIMIT 5;
```

**Expected Result:** Query runs successfully without errors

### Test 3: Test Clinician Creation

```sql
-- This tests the centre_staff_assignments.role_id fix
-- Should not throw an error
BEGIN;

-- Create a test user (will rollback)
INSERT INTO users (phone, full_name, user_type, is_active)
VALUES ('9999999999', 'Test User', 'STAFF', TRUE)
RETURNING id;

-- Note the returned ID and use it below (replace 999)
INSERT INTO centre_staff_assignments (centre_id, user_id, role_id, is_active)
VALUES (1, 999, 4, TRUE);

ROLLBACK; -- Don't actually create the test data
```

**Expected Result:** No errors about missing role_id

---

## PERFORMANCE OPTIMIZATION (RECOMMENDED)

After migration, add these indexes for better performance:

```sql
-- Index for patient list query
CREATE INDEX IF NOT EXISTS idx_users_type_active
ON users(user_type, is_active)
WHERE user_type = 'PATIENT';

-- Index for appointment counts
CREATE INDEX IF NOT EXISTS idx_appointments_patient_scheduled
ON appointments(patient_id, scheduled_start_at, status);

-- Index for username lookups
CREATE INDEX IF NOT EXISTS idx_users_username
ON users(username)
WHERE username IS NOT NULL;

-- Index for phone lookups
CREATE INDEX IF NOT EXISTS idx_users_phone
ON users(phone);
```

---

## ROLLBACK PLAN (IF SOMETHING GOES WRONG)

### Rollback Migration 1 (username column)

```sql
ALTER TABLE users DROP COLUMN IF EXISTS username;
DROP INDEX IF EXISTS idx_users_username;
```

### Rollback Migration 2 (years_of_experience)

```sql
-- If you renamed the column
ALTER TABLE clinician_profiles
RENAME COLUMN years_of_experience TO experience_years;

-- If you added the column
ALTER TABLE clinician_profiles
DROP COLUMN IF EXISTS years_of_experience;
```

### Rollback Migration 3 (role_id)

```sql
-- Make role_id nullable again
ALTER TABLE centre_staff_assignments
ALTER COLUMN role_id DROP NOT NULL;

-- Remove foreign key constraint
ALTER TABLE centre_staff_assignments
DROP CONSTRAINT IF EXISTS fk_centre_staff_role;
```

---

## CHECKLIST

Before deploying to AWS:

- [ ] Backup AWS database
- [ ] Run VERIFY_DATABASE_SCHEMA.sql
- [ ] Check if username column exists
- [ ] Check if years_of_experience column exists (not experience_years)
- [ ] Check if role_id is NOT NULL
- [ ] Run migrations if needed
- [ ] Run verification tests
- [ ] Test patient list query
- [ ] Test clinician creation
- [ ] Add performance indexes
- [ ] Deploy backend code
- [ ] Deploy admin panel code
- [ ] Test in production

---

## EXPECTED OUTCOME

### If All Columns Already Exist:

✅ **NO MIGRATION NEEDED!**

- Just deploy the code
- Everything will work immediately

### If Migrations Are Needed:

⚠️ **Run migrations first, then deploy code**

- Migrations are backward compatible
- Old code will still work during migration
- New code will work after migration

---

## SUPPORT

If you encounter any issues:

1. Check the error message carefully
2. Verify column names match exactly
3. Check data types match
4. Ensure NOT NULL constraints are correct
5. Test queries individually

---

## SUMMARY

**Most Likely Scenario:** Your AWS database already has all required columns, and **NO MIGRATION IS NEEDED**.

**To Confirm:** Run the verification script and check the 3 critical columns.

**If Migration Needed:** Follow the step-by-step migrations above.

**After Migration:** Run verification tests to ensure everything works.
