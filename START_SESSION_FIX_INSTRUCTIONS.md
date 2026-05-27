# 🔧 START SESSION BUG FIX - INSTRUCTIONS

## 📋 Problem Summary

When clinicians click "Start Session" button, they get a **500 Internal Server Error** because the `appointment_status_history` table is missing from the database.

---

## ✅ Solution: Run Migration in pgAdmin

### Step 1: Open pgAdmin

1. Launch pgAdmin
2. Connect to your PostgreSQL database
3. Navigate to your database (usually named `mibo` or similar)

### Step 2: Open Query Tool

1. Right-click on your database
2. Select **Tools → Query Tool**
3. A new query window will open

### Step 3: Run the Migration

1. Open the migration file:

   ```
   backend/migrations/create_appointment_status_history_table.sql
   ```

2. Copy the **entire contents** of the file

3. Paste into the pgAdmin Query Tool

4. Click the **Execute** button (▶️) or press **F5**

5. You should see success messages in the output panel:
   ```
   ✅ Migration completed successfully!
   ✅ Table: appointment_status_history created
   ✅ Indexes: 4 indexes created for performance
   ✅ Constraints: Foreign keys and check constraints added
   ```

### Step 4: Verify Table Creation

Run this query to verify:

```sql
SELECT * FROM appointment_status_history LIMIT 1;
```

You should see column headers (even if no data yet):

- id
- appointment_id
- previous_status
- new_status
- changed_by_user_id
- changed_at
- reason
- created_at

---

## 🧪 Testing After Migration

### Test 1: Start Session

1. Log in as a clinician
2. Go to Dashboard
3. Find a **CONFIRMED** appointment at or past its scheduled time
4. Click **"Start Session"** button
5. ✅ Should succeed without error
6. Status should change to **IN_PROGRESS**
7. Button should change to **"End Session"**

### Test 2: End Session

1. With a session in progress (IN_PROGRESS status)
2. Click **"End Session"** button
3. ✅ Should succeed without error
4. Status should change to **COMPLETED**
5. Session timestamps should be recorded

### Test 3: Verify Status History

Run this query to see the status changes:

```sql
SELECT
  ash.*,
  a.patient_id,
  u.full_name as changed_by
FROM appointment_status_history ash
JOIN appointments a ON ash.appointment_id = a.id
JOIN users u ON ash.changed_by_user_id = u.id
ORDER BY ash.changed_at DESC
LIMIT 10;
```

---

## 📊 What This Table Does

The `appointment_status_history` table tracks every status change:

| From Status | To Status   | When                  | Who       | Why                  |
| ----------- | ----------- | --------------------- | --------- | -------------------- |
| BOOKED      | CONFIRMED   | Payment completed     | System    | Payment verified     |
| CONFIRMED   | IN_PROGRESS | Session started       | Clinician | Start button clicked |
| IN_PROGRESS | COMPLETED   | Session ended         | Clinician | End button clicked   |
| CONFIRMED   | CANCELLED   | Appointment cancelled | Admin     | Patient request      |

---

## 🔍 Troubleshooting

### Error: "relation 'appointments' does not exist"

- The `appointments` table is missing
- Check if you're connected to the correct database

### Error: "relation 'users' does not exist"

- The `users` table is missing
- Check if you're connected to the correct database

### Error: "permission denied"

- Your database user doesn't have CREATE TABLE permission
- Contact your database administrator

### Still Getting 500 Error After Migration

1. Restart the backend server:

   ```bash
   cd backend
   npm run dev
   ```

2. Check backend logs for any other errors

3. Verify the table exists:
   ```sql
   \dt appointment_status_history
   ```

---

## 📝 Additional Notes

### Persistence

- Once created, the table is **permanent**
- It will persist even after:
  - Closing pgAdmin
  - Restarting PostgreSQL
  - Restarting your computer
- The table is part of your database schema

### Data Retention

- All status history records are kept indefinitely
- Consider adding a cleanup job if storage becomes an issue
- Recommended: Keep at least 1 year of history for audit purposes

### Indexes

The migration creates 4 indexes for optimal performance:

1. `idx_appointment_status_history_appointment_id` - Query by appointment
2. `idx_appointment_status_history_changed_at` - Query recent changes
3. `idx_appointment_status_history_changed_by` - Query by user
4. `idx_appointment_status_history_apt_date` - Composite for common queries

---

## ✅ Checklist

- [ ] Opened pgAdmin
- [ ] Connected to database
- [ ] Opened Query Tool
- [ ] Ran migration SQL
- [ ] Verified table creation
- [ ] Tested "Start Session" button
- [ ] Tested "End Session" button
- [ ] Verified status history records
- [ ] Confirmed no more 500 errors

---

## 🚀 Ready for Production

Once all tests pass:

1. ✅ Run the same migration on production database
2. ✅ Test in production environment
3. ✅ Monitor for any errors
4. ✅ Verify status history is being recorded

---

**Created:** May 27, 2026  
**Issue:** Start Session 500 Error  
**Solution:** Create appointment_status_history table  
**Status:** Ready to deploy
