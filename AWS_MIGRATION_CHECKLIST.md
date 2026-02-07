# AWS Migration Checklist

## Quick Reference Guide

### Before You Start

- [ ] pgAdmin 4 is open and connected to AWS RDS
- [ ] You have the migration files ready:
  - `backend/migrations/update_clinician_profiles_for_dynamic_management.sql`
  - `backend/migrations/fix_clinician_array_data.sql`

---

## Step-by-Step Checklist

### 1. Backup (CRITICAL - Don't Skip!)

- [ ] Right-click database in pgAdmin
- [ ] Select "Backup..."
- [ ] Save as: `mibo_backup_2026-02-07.backup`
- [ ] Wait for "Backup completed successfully" message
- [ ] Verify backup file exists on your computer

---

### 2. Run Migration 1

- [ ] Open Query Tool (right-click database → Query Tool)
- [ ] Open file: `update_clinician_profiles_for_dynamic_management.sql`
- [ ] Copy entire content
- [ ] Paste into Query Tool
- [ ] Click Execute (▶️ button or F5)
- [ ] Check Messages tab - should say "Query returned successfully"
- [ ] Scroll down to see verification results

**Expected Messages:**

```
ALTER TABLE
UPDATE X
ALTER TABLE
ALTER TABLE
CREATE TABLE
CREATE INDEX
...
Query returned successfully
```

---

### 3. Run Migration 2

- [ ] In Query Tool, clear previous query
- [ ] Open file: `fix_clinician_array_data.sql`
- [ ] Copy entire content
- [ ] Paste into Query Tool
- [ ] Click Execute (▶️)
- [ ] Check Messages tab - should show UPDATE statements

**Expected Messages:**

```
UPDATE X
UPDATE X
UPDATE X
UPDATE X
Query returned successfully
```

---

### 4. Verify Changes

#### Check Column Types:

- [ ] Run this query:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'clinician_profiles'
  AND column_name IN ('specialization', 'qualification')
ORDER BY column_name;
```

**Expected Result:**
| column_name | data_type |
|-------------|-----------|
| qualification | jsonb |
| specialization | jsonb |

---

#### Check Data Format:

- [ ] Run this query:

```sql
SELECT
  id,
  full_name,
  specialization,
  jsonb_typeof(specialization) as spec_type,
  qualification,
  jsonb_typeof(qualification) as qual_type
FROM clinician_profiles
LIMIT 5;
```

**Expected Result:**

- `spec_type` = "array"
- `qual_type` = "array"
- Values look like: `["Clinical Psychologist"]`

---

#### Check Availability Table:

- [ ] Run this query:

```sql
SELECT COUNT(*) FROM clinician_availability_rules;
```

**Expected Result:**

- Query runs without error (table exists)
- Count may be 0 (that's okay - table is empty initially)

---

### 5. Test Backend Connection

- [ ] Open terminal/command prompt
- [ ] Navigate to backend folder: `cd backend`
- [ ] Start backend: `npm run dev`
- [ ] Check console for errors
- [ ] Look for: "✓ Database connected successfully"
- [ ] No errors about column types or JSONB

---

### 6. Test Admin Panel

- [ ] Open admin panel in browser
- [ ] Navigate to Clinicians page
- [ ] Existing clinicians should display correctly
- [ ] Click "Add Clinician" button
- [ ] Fill form with test data:
  - Name: Test Doctor
  - Specialization: Select from dropdown (e.g., "Clinical Psychologist")
  - Qualification: Select from dropdown (e.g., "MBBS", "MD")
  - Other required fields
- [ ] Click "Create"
- [ ] New clinician appears in list
- [ ] No errors in browser console

---

### 7. Verify in Database

- [ ] Go back to pgAdmin Query Tool
- [ ] Run this query:

```sql
SELECT
  id,
  full_name,
  specialization,
  qualification,
  created_at
FROM clinician_profiles
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Result:**

- Shows your test clinician
- Specialization is array: `["Clinical Psychologist"]`
- Qualification is array: `["MBBS", "MD"]`

---

### 8. Test Frontend

- [ ] Open patient website in browser
- [ ] Navigate to Experts/Clinicians page
- [ ] Clinicians should display correctly
- [ ] No errors in browser console
- [ ] Filters work correctly

---

## If Something Goes Wrong

### Rollback Steps:

1. [ ] In pgAdmin, right-click database
2. [ ] Select "Restore..."
3. [ ] Choose your backup file: `mibo_backup_2026-02-07.backup`
4. [ ] Click "Restore"
5. [ ] Wait for completion
6. [ ] Database is back to original state

---

## Common Issues & Quick Fixes

### Issue: "column already exists"

✅ **Fix**: Ignore this - column was already created. Continue with next step.

### Issue: "relation already exists"

✅ **Fix**: Table already created. Continue with next step.

### Issue: Backend shows type errors

✅ **Fix**:

1. Verify migrations ran successfully
2. Restart backend server
3. Clear browser cache

### Issue: Data shows as strings not arrays

✅ **Fix**: Run Migration 2 again (fix_clinician_array_data.sql)

---

## Success Criteria

✅ **Migration is successful when:**

- [ ] All queries executed without errors
- [ ] Column types are JSONB
- [ ] Data format is arrays: `["value"]`
- [ ] Availability table exists
- [ ] Backend connects without errors
- [ ] Admin panel works correctly
- [ ] Frontend displays clinicians
- [ ] Test clinician created successfully

---

## Time Estimate

- Backup: 2-5 minutes
- Migration 1: 30 seconds
- Migration 2: 10 seconds
- Verification: 3 minutes
- Testing: 5 minutes
- **Total: ~10-15 minutes**

---

## Need Help?

Refer to the detailed guide: `backend/AWS_MIGRATION_GUIDE.md`

---

**Ready?** Start with Step 1 (Backup) and work through the checklist! ✅
