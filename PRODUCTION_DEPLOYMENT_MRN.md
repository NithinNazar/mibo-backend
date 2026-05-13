# MRN Feature - Production Deployment Guide

## Overview

This guide covers deploying the MRN (Medical Record Number) feature to your live AWS production environment.

---

## ⚠️ Pre-Deployment Checklist

### 1. Backup Production Database

**CRITICAL: Always backup before running migrations on production!**

```sql
-- In pgAdmin4, right-click on your database → Backup
-- Or run this command:
pg_dump -h your-aws-rds-endpoint -U your-username -d your-database > backup_before_mrn_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Verify Current Schema

Check if MRN column already exists:

```sql
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_name = 'patient_profiles' AND column_name = 'mrn';
```

**Expected Result:**

- If MRN doesn't exist: No rows returned → **Proceed with migration**
- If MRN exists: 1 row returned → **Skip migration, deploy code only**

### 3. Check Active Connections

Ensure no critical operations are running:

```sql
SELECT count(*) as active_connections
FROM pg_stat_activity
WHERE datname = current_database()
AND state = 'active';
```

---

## 📋 Deployment Steps

### Step 1: Run Database Migration

**File to Run:** `add_mrn_to_patient_profiles.sql`

#### Option A: Using pgAdmin4 (Recommended)

1. Open pgAdmin4
2. Connect to your AWS production database
3. Right-click on your database → **Query Tool**
4. Open the migration file: `add_mrn_to_patient_profiles.sql`
5. Review the SQL commands
6. Click **Execute** (F5)
7. Verify success message

#### Option B: Using psql Command Line

```bash
psql -h your-aws-rds-endpoint \
     -U your-username \
     -d your-database \
     -f add_mrn_to_patient_profiles.sql
```

#### Migration SQL (for reference)

```sql
-- Add mrn column to patient_profiles table
ALTER TABLE patient_profiles
ADD COLUMN IF NOT EXISTS mrn VARCHAR(50) UNIQUE;

-- Create index on mrn for faster lookups
CREATE INDEX IF NOT EXISTS idx_patient_profiles_mrn ON patient_profiles(mrn);

-- Add comment to column
COMMENT ON COLUMN patient_profiles.mrn IS 'Medical Record Number - unique identifier for patient records';
```

### Step 2: Verify Migration Success

Run this verification query:

```sql
-- Check column exists
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_name = 'patient_profiles' AND column_name = 'mrn';

-- Expected output:
-- column_name | data_type         | character_maximum_length | is_nullable
-- mrn         | character varying | 50                       | YES

-- Check index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'patient_profiles' AND indexname = 'idx_patient_profiles_mrn';

-- Expected output:
-- indexname                    | indexdef
-- idx_patient_profiles_mrn     | CREATE INDEX idx_patient_profiles_mrn ON public.patient_profiles USING btree (mrn)

-- Check unique constraint
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'patient_profiles'::regclass
AND contype = 'u';

-- Expected: Should see a unique constraint on mrn column
```

### Step 3: Deploy Backend Code

#### 3a. Build Backend

```bash
cd backend
npm run build
```

#### 3b. Deploy to AWS

Deploy the updated backend code to your AWS environment (EC2, ECS, Elastic Beanstalk, etc.)

**Modified Backend Files:**

- `src/validations/patient.validation.ts`
- `src/services/patient.services.ts`
- `src/repositories/patient.repository.ts`

#### 3c. Restart Backend Server

After deployment, restart your backend server to load the new code.

### Step 4: Deploy Frontend (Admin Panel)

#### 4a. Build Admin Panel

```bash
cd mibo-admin
npm run build
```

#### 4b. Deploy to AWS

Deploy the built admin panel to your hosting (S3 + CloudFront, or wherever it's hosted)

**Modified Frontend Files:**

- `src/modules/patients/pages/PatientsListPage.tsx`
- `src/types/index.ts`

### Step 5: Clear Browser Cache

After deployment, clear browser cache or do a hard refresh (Ctrl+Shift+R) to load the new admin panel version.

---

## ✅ Post-Deployment Verification

### 1. Database Verification

```sql
-- Check if column exists and is empty (for existing patients)
SELECT
  COUNT(*) as total_patients,
  COUNT(mrn) as patients_with_mrn,
  COUNT(*) - COUNT(mrn) as patients_without_mrn
FROM patient_profiles;

-- Expected:
-- total_patients: [your patient count]
-- patients_with_mrn: 0 (initially)
-- patients_without_mrn: [your patient count]
```

### 2. Backend API Verification

Test the API endpoints:

```bash
# Get patients list (should include mrn field)
curl -X GET https://your-api-domain.com/api/patients \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response should include: "mrn": null for existing patients

# Update patient with MRN
curl -X PUT https://your-api-domain.com/api/patients/123 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mrn": "TEST-MRN-001"}'

# Response should include: "mrn": "TEST-MRN-001"
```

### 3. Admin Panel Verification

1. Log into admin panel
2. Navigate to Patients page
3. Verify MRN column appears in table
4. Edit a patient
5. Verify MRN input field appears in modal
6. Enter a test MRN: "TEST-001"
7. Click "Update Patient"
8. Verify MRN displays in table (not "Not Assigned")
9. Refresh page
10. Verify MRN still displays correctly

### 4. Feature Testing

- [ ] Create new patient with MRN
- [ ] Create new patient without MRN (should show "Not Assigned")
- [ ] Update existing patient to add MRN
- [ ] Update existing patient to change MRN
- [ ] Sort by MRN (ascending/descending)
- [ ] Export to CSV (verify MRN column included)
- [ ] Export to PDF (verify MRN column included)
- [ ] Try to create duplicate MRN (should fail with error)

---

## 🔄 Rollback Plan (If Needed)

### If Migration Fails

```sql
-- Remove the MRN column
ALTER TABLE patient_profiles DROP COLUMN IF EXISTS mrn;

-- Remove the index
DROP INDEX IF EXISTS idx_patient_profiles_mrn;

-- Restore from backup
psql -h your-aws-rds-endpoint \
     -U your-username \
     -d your-database \
     < backup_before_mrn_YYYYMMDD_HHMMSS.sql
```

### If Backend Deployment Fails

1. Revert to previous backend deployment
2. Restart backend server
3. MRN column in database is harmless (nullable, no default)

### If Frontend Deployment Fails

1. Revert to previous admin panel deployment
2. Clear CloudFront cache (if using CloudFront)
3. Users will see old UI without MRN field

---

## 📊 Migration Impact Analysis

### Database Impact

- **Table Modified:** `patient_profiles`
- **Column Added:** `mrn VARCHAR(50) UNIQUE`
- **Index Added:** `idx_patient_profiles_mrn`
- **Downtime:** None (ALTER TABLE is non-blocking for nullable columns)
- **Data Loss Risk:** None (only adding column, not modifying existing data)
- **Performance Impact:** Minimal (index creation is fast for existing data)

### Application Impact

- **Backend Changes:** 3 files modified
- **Frontend Changes:** 2 files modified
- **Breaking Changes:** None (backward compatible)
- **API Changes:** MRN field added to responses (optional field)

### User Impact

- **Existing Patients:** MRN will be NULL (displays as "Not Assigned")
- **New Patients:** Can optionally assign MRN during creation
- **Existing Workflows:** Unchanged (MRN is optional)
- **New Features:** MRN assignment, display, sorting, export

---

## 🚨 Common Issues & Solutions

### Issue 1: Migration Fails - Column Already Exists

**Error:** `column "mrn" of relation "patient_profiles" already exists`

**Solution:** Column already exists, skip migration and deploy code only.

### Issue 2: Migration Fails - Permission Denied

**Error:** `permission denied for table patient_profiles`

**Solution:** Ensure database user has ALTER TABLE permissions:

```sql
GRANT ALTER ON TABLE patient_profiles TO your_username;
```

### Issue 3: Unique Constraint Violation

**Error:** `duplicate key value violates unique constraint`

**Solution:** This means two patients were assigned the same MRN. Check and fix:

```sql
-- Find duplicate MRNs
SELECT mrn, COUNT(*)
FROM patient_profiles
WHERE mrn IS NOT NULL
GROUP BY mrn
HAVING COUNT(*) > 1;

-- Update duplicates to unique values
UPDATE patient_profiles
SET mrn = mrn || '-' || id
WHERE mrn IN (SELECT mrn FROM patient_profiles GROUP BY mrn HAVING COUNT(*) > 1);
```

### Issue 4: MRN Not Displaying in Admin Panel

**Possible Causes:**

1. Browser cache not cleared → Hard refresh (Ctrl+Shift+R)
2. Frontend not deployed → Verify deployment
3. Backend not restarted → Restart backend server
4. API not returning MRN → Check backend logs

### Issue 5: MRN Not Saving

**Possible Causes:**

1. Backend code not deployed → Verify deployment
2. Validation layer issue → Check backend logs
3. Database migration not run → Run migration

---

## 📝 Deployment Timeline

### Recommended Deployment Window

- **Best Time:** Low-traffic period (e.g., late night, early morning)
- **Estimated Duration:** 15-30 minutes
- **Downtime:** None (zero-downtime deployment)

### Deployment Order

1. **Database Migration** (5 minutes)
   - Backup database
   - Run migration
   - Verify migration

2. **Backend Deployment** (10 minutes)
   - Build backend
   - Deploy to AWS
   - Restart server
   - Verify API

3. **Frontend Deployment** (10 minutes)
   - Build admin panel
   - Deploy to AWS
   - Clear cache
   - Verify UI

4. **Testing** (5 minutes)
   - Test MRN creation
   - Test MRN update
   - Test MRN display

---

## 📞 Support & Monitoring

### What to Monitor After Deployment

1. **Backend Logs:** Watch for errors related to MRN field
2. **Database Performance:** Monitor query performance (should be unchanged)
3. **User Reports:** Check for any issues with patient management
4. **API Response Times:** Verify no performance degradation

### Logging Queries

```sql
-- Monitor MRN usage
SELECT
  COUNT(*) as total_patients,
  COUNT(mrn) as with_mrn,
  COUNT(*) - COUNT(mrn) as without_mrn,
  ROUND(COUNT(mrn)::numeric / COUNT(*)::numeric * 100, 2) as mrn_adoption_rate
FROM patient_profiles;

-- Check recent MRN assignments
SELECT user_id, mrn, updated_at
FROM patient_profiles
WHERE mrn IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;
```

---

## ✅ Deployment Checklist

### Pre-Deployment

- [ ] Backup production database
- [ ] Verify MRN column doesn't exist
- [ ] Review migration SQL
- [ ] Notify team of deployment
- [ ] Schedule deployment window

### During Deployment

- [ ] Run database migration
- [ ] Verify migration success
- [ ] Deploy backend code
- [ ] Restart backend server
- [ ] Deploy frontend code
- [ ] Clear browser cache

### Post-Deployment

- [ ] Verify database schema
- [ ] Test API endpoints
- [ ] Test admin panel UI
- [ ] Test MRN creation
- [ ] Test MRN update
- [ ] Test MRN display
- [ ] Test sorting and export
- [ ] Monitor logs for errors
- [ ] Document deployment completion

---

## 📄 Summary

**Migration File:** `add_mrn_to_patient_profiles.sql`

**What It Does:**

- Adds `mrn` column to `patient_profiles` table
- Creates index for fast lookups
- Adds unique constraint to prevent duplicates

**Is It Safe?**

- ✅ Yes, completely safe
- ✅ Non-blocking operation
- ✅ No data loss risk
- ✅ Backward compatible
- ✅ Can be rolled back if needed

**Deployment Order:**

1. Database migration (this file)
2. Backend deployment
3. Frontend deployment

**Estimated Time:** 15-30 minutes total

---

**Ready to Deploy!** 🚀

Follow the steps above carefully, and the MRN feature will be live on your production environment.
