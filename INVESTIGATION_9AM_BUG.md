# 9:00 AM Slot Bug Investigation

## Current Status: 🔍 INVESTIGATING - DEBUG LOGGING ACTIVE

- **Backend Server:** ✅ Running on port 5000 with debug logging enabled
- **Database:** Production PostgreSQL connected
- **Previous Action:** Deleted test appointment (ID 173, Jomin John, 9:00 AM June 14)
- **Current Issue:** Slots at 9:00 AM still showing as "booked" despite clean database

## Problem Summary

- **Clinician:** Jerry P Mathew
- **Issue:** Slots created at 9:00 AM show as "booked", but 9:15 AM and 9:30 AM work correctly
- **Environment:** Production (AWS) - bug does NOT occur in local development
- **Date Tested:** June 5, 2026 (Friday - tomorrow)

## Why This is Critical

- **Specific time (9:00 AM) failing** suggests:
  1. Existing appointment in database at 9:00 AM
  2. Data left over from testing
  3. Time formatting/precision issue
  4. Timezone conversion problem

## Backend Logic Explanation

### How Slot Availability Works:

1. **Admin Creates Availability Rule:**
   - Example: "Friday 9:00 AM - 5:00 PM, 30-minute slots"
   - Stored in `clinician_availability_rules` table

2. **Backend Generates Slots:**
   - Creates slots: 9:00, 9:30, 10:00, 10:30... etc.
   - For each slot, checks for conflicts

3. **Conflict Detection (`checkSchedulingConflicts`):**

   ```sql
   SELECT COUNT(*) FROM appointments
   WHERE clinician_id = $1
     AND is_active = TRUE
     AND status NOT IN ('CANCELLED', 'NO_SHOW')
     AND ((scheduled_start_at < slot_end AND scheduled_end_at > slot_start)
          OR (scheduled_start_at >= slot_start AND scheduled_start_at < slot_end))
   ```

4. **If COUNT > 0:** Slot shows as `available: false` (BOOKED)
5. **If COUNT = 0:** Slot shows as `available: true`

### Timezone Handling:

- **Admin Panel:** Times displayed in IST (Asia/Kolkata)
- **Database:** Times stored in UTC
- **Conversion:** 9:00 AM IST = 3:30 AM UTC

```
9:00 AM IST  →  2026-06-05T09:00:00+05:30  →  2026-06-05T03:30:00.000Z (UTC)
9:15 AM IST  →  2026-06-05T09:15:00+05:30  →  2026-06-05T03:45:00.000Z (UTC)
9:30 AM IST  →  2026-06-05T09:30:00+05:30  →  2026-06-05T04:00:00.000Z (UTC)
```

## Investigation Steps

### Step 1: Check Production Database

**Run this query in pgAdmin connected to production:**

```sql
-- Find Jerry's clinician ID
SELECT u.id as user_id, u.full_name, cp.id as clinician_id
FROM users u
JOIN clinician_profiles cp ON u.id = cp.user_id
WHERE u.full_name ILIKE '%Jerry%Mathew%';
```

**Expected:** Should return 1 row with Jerry's `clinician_id`

### Step 2: Check for Appointments at 9:00 AM

```sql
-- Replace <CLINICIAN_ID> with Jerry's ID from Step 1
SELECT
    id,
    scheduled_start_at AT TIME ZONE 'Asia/Kolkata' as ist_time,
    status,
    appointment_type,
    is_active
FROM appointments
WHERE clinician_id = <CLINICIAN_ID>
  AND TO_CHAR(scheduled_start_at AT TIME ZONE 'Asia/Kolkata', 'HH24:MI') = '09:00'
  AND is_active = TRUE
  AND scheduled_start_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY scheduled_start_at DESC;
```

**Expected Results:**

**Scenario A: Rows Found (Most Likely)**

```
id  | ist_time            | status    | appointment_type | is_active
----|---------------------|-----------|-----------------|----------
123 | 2026-06-05 09:00:00 | BOOKED    | ONLINE          | true
456 | 2026-06-04 09:00:00 | CONFIRMED | IN_PERSON       | true
```

**Action:** These appointments are causing 9:00 AM to show as booked!

**Scenario B: No Rows Found**

```
(no rows)
```

**Action:** Check for blocked slots or time precision issues

### Step 3: If Appointments Found - Check if They're Test Data

```sql
-- Check appointment details
SELECT
    a.id,
    a.scheduled_start_at AT TIME ZONE 'Asia/Kolkata' as ist_time,
    a.status,
    u.full_name as patient_name,
    u.phone as patient_phone,
    a.created_at AT TIME ZONE 'Asia/Kolkata' as created_at,
    ua.full_name as booked_by
FROM appointments a
LEFT JOIN patient_profiles pp ON a.patient_id = pp.id
LEFT JOIN users u ON pp.user_id = u.id
LEFT JOIN users ua ON a.booked_by_user_id = ua.id
WHERE a.id IN (123, 456)  -- Replace with IDs from Step 2
```

**If patient names are test names (Test User, Admin Test, etc.):**
→ These are leftover test appointments and should be deleted

## Solution Scenarios

### Scenario 1: Test Appointments Found (Most Likely)

**Problem:** Old test appointments blocking 9:00 AM slots

**Solution - Option A (Soft Delete - Recommended):**

```sql
-- Deactivate test appointments
UPDATE appointments
SET is_active = FALSE, updated_at = NOW()
WHERE id IN (123, 456);  -- Replace with actual IDs
```

**Solution - Option B (Cancel):**

```sql
-- Cancel test appointments
UPDATE appointments
SET status = 'CANCELLED', updated_at = NOW()
WHERE id IN (123, 456);  -- Replace with actual IDs
```

**Solution - Option C (Hard Delete - Use with Caution):**

```sql
-- Delete test appointments (CANNOT BE UNDONE!)
DELETE FROM appointments
WHERE id IN (123, 456);  -- Replace with actual IDs
```

**After applying solution:**

1. Refresh admin panel
2. Try creating 9:00 AM slot again
3. Should now show as available ✅

### Scenario 2: No Appointments, Check Blocked Slots

```sql
SELECT *
FROM slot_exceptions
WHERE clinician_id = <CLINICIAN_ID>
  AND exception_date = '2026-06-05'
  AND start_time = '09:00';
```

**If rows found:** Admin manually blocked this slot

**Solution:**

```sql
DELETE FROM slot_exceptions
WHERE clinician_id = <CLINICIAN_ID>
  AND exception_date = '2026-06-05'
  AND start_time = '09:00';
```

### Scenario 3: Time Precision Issue

**Check for milliseconds/seconds:**

```sql
SELECT
    id,
    scheduled_start_at,
    EXTRACT(SECOND FROM scheduled_start_at) as seconds,
    EXTRACT(MILLISECOND FROM scheduled_start_at) as milliseconds
FROM appointments
WHERE clinician_id = <CLINICIAN_ID>
  AND DATE(scheduled_start_at AT TIME ZONE 'Asia/Kolkata') = '2026-06-05'
  AND TO_CHAR(scheduled_start_at AT TIME ZONE 'Asia/Kolkata', 'HH24:MI') = '09:00';
```

**If times have seconds/milliseconds (e.g., 09:00:00.500):**
→ This could cause matching issues

## Why It Works Locally But Not in Production

1. **Different Database States:**
   - Local DB: Clean, no test appointments
   - Production DB: May have leftover test appointments from deployment/testing

2. **Different Data:**
   - You may have tested with 9:00 AM in production but not locally

3. **Time Zone Configuration:**
   - Unlikely but possible: Server timezone differences

## Files to Check

Use the SQL scripts I created:

1. **`check_jerry_slots_production.sql`** - Step-by-step investigation
2. **`debug_9am_issue.sql`** - Detailed conflict detection tests
3. **`PRODUCTION_CHECK_JERRY_COMPLETE.sql`** - Complete automated check

## Next Steps

1. ✅ Run `PRODUCTION_CHECK_JERRY_COMPLETE.sql` in pgAdmin (production DB)
2. ✅ Copy results and send to me
3. ✅ I'll analyze and provide exact fix
4. ✅ Apply fix to production
5. ✅ Verify 9:00 AM slots work correctly

## Expected Timeline

- **Investigation:** 5-10 minutes (run queries)
- **Fix:** 1 minute (delete/update query)
- **Verification:** 2 minutes (test in admin panel)
- **Total:** ~15 minutes to resolve

## Important Notes

- ⚠️ **DO NOT** run DELETE queries without confirming data first
- ✅ Use `is_active = FALSE` instead of DELETE for safety
- 📝 Always backup query results before making changes
- 🔍 This bug is likely DATA ISSUE, not CODE ISSUE (since it works locally)

## Contact

Once you run the queries, share the results and I'll provide the exact fix!
