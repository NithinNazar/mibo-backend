# Database Cleanup Instructions

## ⚠️ CRITICAL WARNINGS

1. **BACKUP YOUR DATABASE FIRST** - This is irreversible!
2. **Test on DEVELOPMENT database before running on PRODUCTION**
3. **Review all verification output before committing**
4. **Have someone else review the script before running on production**

## 📋 What This Cleanup Does

### ✅ DATA PRESERVED (Real Admin Users):

- All staff users (Admin, Front Desk, Managers, Care Coordinators)
- All active clinicians and their profiles
- All availability rules for active clinicians
- User roles and permissions for staff
- Centre assignments for staff

### ❌ DATA DELETED (Test Data):

- All patient users and profiles
- All appointments (past, present, future)
- All payments and transactions
- All patient notifications
- All blocked slots
- All slot exceptions
- All inactive clinicians
- All appointment-related history (status changes, notes, etc.)
- All video session records

## 🔄 Step-by-Step Process

### Step 1: Backup Database

```bash
# For PostgreSQL
pg_dump -U your_username -d database_name > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Connect to Database

```bash
# Development
psql -U your_username -d development_database

# Production (DO THIS AFTER testing on dev!)
psql -U your_username -d production_database
```

### Step 3: Run Pre-Cleanup Verification

```sql
\i VERIFY_BEFORE_CLEANUP.sql
```

**Review the output carefully!**

- Check counts of staff users (should be preserved)
- Check counts of active clinicians (should be preserved)
- Check counts of patient data (will be deleted)
- Verify the list of active clinicians matches your expectations

### Step 4: Run Cleanup Script

```sql
\i CLEANUP_TEST_DATA.sql
```

**The script will:**

1. Start a transaction (BEGIN)
2. Show cleanup plan
3. Delete all test data
4. Show verification counts
5. **WAIT for you to commit or rollback**

### Step 5: Review Verification Output

**Check these counts in the output:**

- `Patient users remaining: 0` ✓
- `Appointments remaining: 0` ✓
- `Payments remaining: 0` ✓
- `Blocked slots remaining: 0` ✓
- `Staff users remaining: X` (should be > 0) ✓
- `Active clinicians remaining: X` (should be > 0) ✓

### Step 6: Commit or Rollback

If everything looks correct:

```sql
COMMIT;
```

If something is wrong:

```sql
ROLLBACK;
```

### Step 7: Post-Cleanup Verification

```sql
\i VERIFY_AFTER_CLEANUP.sql
```

**This will show:**

- All patient data = 0 ✓
- All staff users preserved ✓
- All active clinicians preserved ✓
- Final status: "DATABASE IS READY FOR PRODUCTION" ✓

## 🧪 Testing After Cleanup

### 1. Test Admin Panel Login

- Admin users can log in ✓
- Clinicians can log in ✓
- Front desk can log in ✓
- Managers can log in ✓

### 2. Test Clinician Dashboard

- Clinicians can view their dashboard ✓
- Appointments list is empty ✓
- Availability slots are intact ✓

### 3. Test Patient Registration (Frontend)

- New patients can register ✓
- New patients can search for clinicians ✓
- New patients can book appointments ✓

### 4. Test Appointment Booking

- Admin can create appointments for new patients ✓
- System generates new appointment IDs starting from 1 ✓

## 📝 What Each Script Does

### VERIFY_BEFORE_CLEANUP.sql

- Shows current state of database
- Lists what will be kept vs deleted
- Shows detailed breakdown of clinicians

### CLEANUP_TEST_DATA.sql

- Deletes all patient data
- Deletes all appointments and related data
- Deletes all inactive clinicians
- Clears all slot blocks and exceptions
- Preserves all staff and active clinicians
- Uses transaction for safety

### VERIFY_AFTER_CLEANUP.sql

- Confirms all patient data deleted
- Confirms staff and clinicians preserved
- Lists all users who can log in
- Shows final status (PASS/FAIL)

## ⚡ Quick Reference

```sql
-- 1. Verify before
\i VERIFY_BEFORE_CLEANUP.sql

-- 2. Run cleanup
\i CLEANUP_TEST_DATA.sql

-- 3. Review output, then commit
COMMIT;

-- 4. Verify after
\i VERIFY_AFTER_CLEANUP.sql
```

## 🆘 Troubleshooting

### If commit fails:

```sql
ROLLBACK;
-- Review error message
-- Check foreign key constraints
-- Run verification scripts again
```

### If you want to reset sequences (start IDs from 1):

Uncomment the SECTION 7 in `CLEANUP_TEST_DATA.sql` before running

### If you need to restore from backup:

```bash
psql -U your_username -d database_name < backup_file.sql
```

## ✅ Success Criteria

After cleanup, you should see:

- 0 patients
- 0 appointments
- 0 payments
- 0 blocked slots
- N staff users (unchanged)
- N active clinicians (unchanged)
- All staff can log in
- New patients can register and book

## 🔒 Security Notes

- Scripts use transactions for safety
- Cascade deletes are handled automatically
- No data is modified without explicit DELETE
- All changes can be rolled back before commit

---

**Last Updated:** 2026-06-25
**Version:** 1.0
**Status:** Ready for use
