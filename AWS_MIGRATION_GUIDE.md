# AWS Database Migration Guide

## Overview

This guide walks you through running the database migrations on your AWS RDS PostgreSQL instance using pgAdmin 4.

---

## Prerequisites

✅ **Before You Start:**

1. pgAdmin 4 installed on your machine
2. AWS RDS connection details (host, port, database name, username, password)
3. Existing connection to AWS RDS in pgAdmin 4
4. **IMPORTANT**: Create a backup of your AWS database before running migrations

---

## Step 1: Backup Your AWS Database

### Using pgAdmin 4:

1. Right-click on your database in pgAdmin
2. Select **Backup...**
3. Choose a filename (e.g., `mibo_backup_2026-02-07.backup`)
4. Click **Backup**
5. Wait for backup to complete

### Alternative - Using Command Line:

```bash
pg_dump -h your-aws-rds-endpoint.rds.amazonaws.com -U your_username -d your_database_name -F c -b -v -f backup_2026-02-07.backup
```

---

## Step 2: Connect to AWS RDS in pgAdmin

1. Open pgAdmin 4
2. Expand **Servers** in the left panel
3. Find your AWS RDS connection
4. If not connected, right-click and select **Connect Server**
5. Enter your password if prompted

---

## Step 3: Run Migrations in Order

### Migration 1: Update Clinician Profiles Schema

**File**: `backend/migrations/update_clinician_profiles_for_dynamic_management.sql`

**What it does:**

- Converts `specialization` from VARCHAR to JSONB array
- Converts `qualification` from VARCHAR to JSONB array
- Creates `clinician_availability_rules` table
- Adds `profile_picture_url` column
- Creates indexes for performance

**Steps:**

1. In pgAdmin, right-click on your database
2. Select **Query Tool**
3. Open the file: `backend/migrations/update_clinician_profiles_for_dynamic_management.sql`
4. Copy the entire SQL content
5. Paste into the Query Tool
6. Click **Execute** (F5) or the ▶️ button
7. Check the **Messages** tab for success/errors
8. Verify the output shows the verification queries at the end

**Expected Output:**

```
Query returned successfully in X msec.

-- Verification results showing:
- specialization: jsonb
- qualification: jsonb
- expertise: jsonb
- languages: jsonb
- profile_picture_url: text
```

---

### Migration 2: Fix Clinician Array Data

**File**: `backend/migrations/fix_clinician_array_data.sql`

**What it does:**

- Converts any string JSONB values to proper array format
- Sets empty arrays for null values
- Ensures data consistency

**Steps:**

1. In the same Query Tool (or open a new one)
2. Open the file: `backend/migrations/fix_clinician_array_data.sql`
3. Copy the entire SQL content
4. Paste into the Query Tool
5. Click **Execute** (F5)
6. Check the **Messages** tab
7. Review the verification query results

**Expected Output:**

```
UPDATE X rows (where X is the number of clinicians)

-- Verification showing:
id | specialization | spec_type | qualification | qual_type
---+----------------+-----------+---------------+----------
1  | ["value"]      | array     | ["value"]     | array
```

---

## Step 4: Verify Migrations

### Check 1: Verify Column Types

Run this query in pgAdmin Query Tool:

```sql
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'clinician_profiles'
  AND column_name IN ('specialization', 'qualification', 'expertise', 'languages', 'profile_picture_url')
ORDER BY column_name;
```

**Expected Result:**
| column_name | data_type | is_nullable | column_default |
|-------------|-----------|-------------|----------------|
| expertise | jsonb | YES | '[]'::jsonb |
| languages | jsonb | YES | '[]'::jsonb |
| profile_picture_url | text | YES | NULL |
| qualification | jsonb | YES | '[]'::jsonb |
| specialization | jsonb | YES | '[]'::jsonb |

---

### Check 2: Verify Availability Table

Run this query:

```sql
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'clinician_availability_rules'
ORDER BY ordinal_position;
```

**Expected Result:**
Should show all columns: id, clinician_id, centre_id, day_of_week, start_time, end_time, slot_duration_minutes, mode, is_active, created_at, updated_at

---

### Check 3: Verify Existing Data

Run this query to check your existing clinicians:

```sql
SELECT
  id,
  full_name,
  specialization,
  jsonb_typeof(specialization) as spec_type,
  qualification,
  jsonb_typeof(qualification) as qual_type,
  profile_picture_url
FROM clinician_profiles
LIMIT 10;
```

**Expected Result:**

- `spec_type` should be "array"
- `qual_type` should be "array"
- Values should be in array format: `["value1", "value2"]`

---

## Step 5: Test the Changes

### Test 1: Check if Backend Can Read Data

After migrations, restart your backend server and check logs:

```bash
cd backend
npm run dev
```

Look for:

- No database errors
- Successful connection to AWS RDS
- No type conversion errors

---

### Test 2: Create a Test Clinician via Admin Panel

1. Open admin panel
2. Go to Clinicians page
3. Click "Add Clinician"
4. Fill in the form with:
   - Multiple specializations (use dropdown)
   - Multiple qualifications (use dropdown)
   - Profile picture URL (optional)
5. Click "Create"
6. Verify clinician appears in list

---

### Test 3: Verify in Database

After creating test clinician, run this query:

```sql
SELECT
  id,
  full_name,
  specialization,
  qualification,
  profile_picture_url
FROM clinician_profiles
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Result:**

- Specialization should be array: `["Clinical Psychologist"]`
- Qualification should be array: `["MBBS", "MD"]`
- Profile picture URL should be stored correctly

---

## Troubleshooting

### Issue 1: "column already exists" Error

**Solution**: The migration is idempotent. If you see this error, it means the column was already created. You can safely ignore it or skip that part of the migration.

---

### Issue 2: "cannot drop column because other objects depend on it"

**Solution**: The migration uses `CASCADE` to handle dependencies. If this fails:

1. Check what objects depend on the column:

```sql
SELECT
  dependent_ns.nspname as dependent_schema,
  dependent_view.relname as dependent_view
FROM pg_depend
JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid
JOIN pg_class as dependent_view ON pg_rewrite.ev_class = dependent_view.oid
JOIN pg_class as source_table ON pg_depend.refobjid = source_table.oid
JOIN pg_namespace dependent_ns ON dependent_ns.oid = dependent_view.relnamespace
WHERE source_table.relname = 'clinician_profiles';
```

2. Drop those views manually before running migration
3. Recreate views after migration

---

### Issue 3: Data Type Mismatch After Migration

**Solution**: Run the fix migration again:

```sql
-- Fix any remaining string values
UPDATE clinician_profiles
SET specialization = jsonb_build_array(specialization::text)
WHERE jsonb_typeof(specialization) = 'string';

UPDATE clinician_profiles
SET qualification = jsonb_build_array(qualification::text)
WHERE jsonb_typeof(qualification) = 'string';
```

---

### Issue 4: Backend Shows Type Errors

**Error**: `column "specialization" is of type jsonb but expression is of type character varying`

**Solution**:

1. Verify migration ran successfully
2. Check column type in database
3. Restart backend server
4. Clear any cached connections

---

## Rollback Plan (If Needed)

If something goes wrong, you can restore from backup:

### Using pgAdmin:

1. Right-click on your database
2. Select **Restore...**
3. Choose your backup file
4. Click **Restore**

### Using Command Line:

```bash
pg_restore -h your-aws-rds-endpoint.rds.amazonaws.com -U your_username -d your_database_name -v backup_2026-02-07.backup
```

---

## Post-Migration Checklist

- [ ] Backup created successfully
- [ ] Migration 1 executed without errors
- [ ] Migration 2 executed without errors
- [ ] Column types verified (all JSONB arrays)
- [ ] Availability table created
- [ ] Existing data migrated correctly
- [ ] Backend connects without errors
- [ ] Admin panel can create clinicians
- [ ] Frontend displays clinicians correctly
- [ ] Test clinician created successfully

---

## Important Notes

### 1. Existing Clinicians

If you have existing clinicians in AWS database:

- Their data will be automatically migrated to array format
- Single values will be wrapped in arrays: `"value"` → `["value"]`
- Empty/null values will become empty arrays: `[]`

### 2. No Data Loss

The migrations are designed to preserve all existing data. They only change the format, not the content.

### 3. Idempotent Migrations

You can run these migrations multiple times safely. They check for existing columns/tables before creating them.

### 4. Performance

The migrations include index creation for better query performance. This might take a few seconds on large databases.

---

## Alternative: Using psql Command Line

If you prefer command line over pgAdmin:

```bash
# Connect to AWS RDS
psql -h your-aws-rds-endpoint.rds.amazonaws.com -U your_username -d your_database_name

# Run migration 1
\i backend/migrations/update_clinician_profiles_for_dynamic_management.sql

# Run migration 2
\i backend/migrations/fix_clinician_array_data.sql

# Exit
\q
```

---

## Support

If you encounter any issues:

1. Check the error message in pgAdmin's Messages tab
2. Verify your AWS RDS connection is active
3. Ensure you have sufficient permissions (CREATE, ALTER, DROP)
4. Check the Troubleshooting section above
5. Restore from backup if needed

---

## Summary

**What You're Doing:**

- Converting clinician specialization and qualification from single values to arrays
- Creating availability rules table for scheduling
- Adding profile picture support
- Ensuring data consistency

**Why It's Safe:**

- Migrations are idempotent (can run multiple times)
- Data is preserved and migrated automatically
- Backup created before changes
- Rollback plan available

**Time Required:**

- Backup: 2-5 minutes
- Migration 1: 10-30 seconds
- Migration 2: 5-10 seconds
- Verification: 2-3 minutes
- **Total: ~10-15 minutes**

---

**Ready to proceed?** Follow the steps above and you'll have your AWS database updated! 🚀
