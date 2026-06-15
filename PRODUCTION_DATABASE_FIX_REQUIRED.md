# 🚨 PRODUCTION DATABASE MIGRATION REQUIRED

## ❌ **ROOT CAUSE OF ERROR:**

The `date_of_birth` column does **NOT exist** in your **PRODUCTION database**, but your deployed backend code is trying to insert data into it.

**Error:** HTTP 500 - Internal Server Error  
**Cause:** Database constraint violation or column not found

---

## ✅ **VERIFIED:**

### Local Database (Development):

- ✅ `date_of_birth` column exists
- ✅ Backend code works correctly
- ✅ ProfileCompletionModal sends correct data format

### Production Database:

- ❌ `date_of_birth` column likely **MISSING**
- ❌ Backend receives data but cannot insert into non-existent column
- ❌ Returns 500 error

---

## 🔧 **FIX REQUIRED:**

### Step 1: Add `date_of_birth` Column to Production Database

**Connect to your production database** (via SSH, pgAdmin, or database console) and run:

```sql
-- Add date_of_birth column to patient_profiles table
ALTER TABLE patient_profiles
ADD COLUMN IF NOT EXISTS date_of_birth DATE NULL;

-- Verify column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'patient_profiles'
AND column_name = 'date_of_birth';
```

**Expected Output:**

```
column_name   | data_type | is_nullable
--------------|-----------|-----------
date_of_birth | date      | YES
```

---

### Step 2: Verify Backend Code is Deployed

Make sure your production backend has the latest code from:

- `src/controllers/patient-dashboard.controller.ts` (with dateOfBirth handling)

The code should include:

```typescript
const {
  firstName,
  lastName,
  email,
  age,
  gender,
  dateOfBirth,
  ...otherProfileData
} = req.body;

if (dateOfBirth) profileUpdates.date_of_birth = new Date(dateOfBirth);
```

---

### Step 3: Restart Production Backend

After adding the column, restart your backend service:

```bash
# If using PM2
pm2 restart backend

# If using systemd
systemctl restart backend-service

# If using Docker
docker restart backend-container
```

---

## 🧪 **HOW TO VERIFY:**

### Option 1: Via SSH to Production Server

```bash
# Connect to production database
psql "<your-production-database-url>"

# Run this query
\d patient_profiles

# Look for date_of_birth in the column list
```

### Option 2: Via pgAdmin

1. Connect to production database
2. Navigate to: Schemas > public > Tables > patient_profiles
3. Click "Columns"
4. Look for `date_of_birth` column
5. If missing → Run the ALTER TABLE command

### Option 3: Via Backend Logs

After running the migration, try the form again and check backend logs:

```bash
pm2 logs backend --lines 50
```

Look for successful insert or any remaining errors.

---

## 📊 **MIGRATION SCRIPT (Complete)**

Save this as `add_date_of_birth_column.sql` and run on production:

```sql
-- ====================================
-- Migration: Add date_of_birth column
-- ====================================

-- Start transaction
BEGIN;

-- Add column if it doesn't exist
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

        RAISE NOTICE 'SUCCESS: date_of_birth column added to patient_profiles';
    ELSE
        RAISE NOTICE 'INFO: date_of_birth column already exists';
    END IF;
END $$;

-- Add index for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_patient_profiles_dob
ON patient_profiles(date_of_birth);

-- Verify
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'patient_profiles'
AND column_name = 'date_of_birth';

-- Commit transaction
COMMIT;

-- Show result
\echo 'Migration completed successfully!'
```

---

## ⚡ **QUICK FIX (Production):**

**If you have SSH access:**

```bash
# SSH to production server
ssh your-production-server

# Connect to database
psql "postgresql://user:password@localhost:5432/your_database"

# Run this one command
ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE NULL;

# Exit
\q

# Restart backend
pm2 restart backend

# Test the form again
```

---

## 🎯 **EXPECTED RESULT AFTER FIX:**

1. ✅ Form submits successfully (no 500 error)
2. ✅ User data stored in database with date_of_birth
3. ✅ Modal closes and booking continues
4. ✅ Next login: No modal shown (profile complete)

---

## 📝 **CURRENT STATUS:**

### Local Environment:

- ✅ Column exists
- ✅ Backend code updated
- ✅ Frontend code updated
- ✅ Everything works

### Production Environment:

- ❌ Column missing (needs migration)
- ✅ Backend code deployed
- ✅ Frontend code deployed
- ❌ Form fails with 500 error

### Action Required:

1. ⚠️ **Run migration on production database** (URGENT)
2. ⚠️ **Restart production backend**
3. ✅ **Test the form again**

---

## 🚀 **AFTER RUNNING MIGRATION:**

The error will be fixed and:

- ✅ Legacy users can complete profile with date picker
- ✅ Date of birth stored in database
- ✅ Age auto-calculated from DOB
- ✅ No more 500 errors
- ✅ One-time data collection working

---

## 💬 **NEED HELP?**

If you're unsure how to access your production database:

1. **Check your deployment platform:**
   - AWS RDS: Use RDS Console or pgAdmin with RDS endpoint
   - Heroku: `heroku pg:psql`
   - DigitalOcean: SSH to droplet, then `psql`
   - Railway/Render: Use their database console

2. **Or share your setup:**
   - Tell me where your database is hosted
   - I can provide specific instructions

---

## ⚠️ **IMPORTANT:**

**Do NOT delete or modify existing data**  
**Only ADD the new column**  
**This migration is safe and backwards compatible**

The column is nullable (NULL allowed), so existing rows won't be affected.
