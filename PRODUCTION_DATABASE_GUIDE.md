# 🚀 Production Database - Add/Update Sameer Guide

## ⚠️ IMPORTANT SAFETY NOTES

- **ALWAYS** check before modifying production data
- **ALWAYS** review results before committing
- **NEVER** run scripts blindly on production
- Keep backups of current data

---

## 📋 Step-by-Step Process

### **STEP 1: Connect to Production Database in pgAdmin**

1. Open **pgAdmin**
2. Connect to your **PRODUCTION** database server
3. Select the production database (e.g., `mibo-production-db`)
4. Open **Query Tool** (Tools → Query Tool)

---

### **STEP 2: Check if Sameer Exists**

**File to use:** `production-check-sameer.sql`

1. Open `production-check-sameer.sql` in pgAdmin Query Tool
2. Click **Execute** (F5)
3. Review the results:

#### **Result A: No rows returned** ❌

```
User does NOT exist in production
→ Go to STEP 3A (Add New User)
```

#### **Result B: User exists with correct details** ✅

```
full_name: Sameer
email: sameer@gmail.com
registration_fee_paid: true
→ No action needed! User is already correct.
```

#### **Result C: User exists but details are wrong** ⚠️

```
full_name: TM (or something else)
email: null (or different)
registration_fee_paid: false
→ Go to STEP 3B (Update Existing User)
```

---

### **STEP 3A: Add New User (if user doesn't exist)**

**File to use:** `production-add-sameer.sql`

1. Open `production-add-sameer.sql` in pgAdmin Query Tool
2. Click **Execute** (F5)
3. **REVIEW** the results shown in the output
4. If everything looks correct:
   - Type `COMMIT;` and execute
5. If something is wrong:
   - Type `ROLLBACK;` and execute
6. Run the verification query at the end to confirm

---

### **STEP 3B: Update Existing User (if user exists with wrong details)**

**File to use:** `production-update-sameer.sql`

1. Open `production-update-sameer.sql` in pgAdmin Query Tool
2. Click **Execute** (F5)
3. You'll see **BEFORE UPDATE** data (current values)
4. You'll see **AFTER UPDATE** data (new values)
5. **CAREFULLY REVIEW** both sets of data
6. If everything looks correct:
   - Type `COMMIT;` and execute
7. If something is wrong:
   - Type `ROLLBACK;` and execute
8. Run the verification query at the end to confirm

---

## 🎯 Quick Decision Tree

```
Start
  ↓
Run: production-check-sameer.sql
  ↓
Does user exist?
  ├─ NO  → Run: production-add-sameer.sql
  │         ↓
  │       Review → COMMIT or ROLLBACK
  │
  └─ YES → Are details correct?
            ├─ YES → Done! ✅
            │
            └─ NO  → Run: production-update-sameer.sql
                      ↓
                    Review → COMMIT or ROLLBACK
```

---

## 📝 What Each Script Does

### `production-check-sameer.sql`

- ✅ Safe to run (read-only)
- Shows if user exists
- Shows current user details
- No changes to database

### `production-add-sameer.sql`

- ⚠️ Creates NEW user
- Has safety check (fails if user exists)
- Requires COMMIT to apply changes
- Can be rolled back

### `production-update-sameer.sql`

- ⚠️ Updates EXISTING user
- Has safety check (fails if user doesn't exist)
- Shows before/after comparison
- Requires COMMIT to apply changes
- Can be rolled back

---

## ✅ Expected Final Result

After successful execution, Sameer should have:

| Field                        | Value               |
| ---------------------------- | ------------------- |
| **Name**                     | Sameer              |
| **Phone**                    | 918218330353        |
| **Email**                    | sameer@gmail.com    |
| **User Type**                | PATIENT             |
| **Registration Fee Paid**    | true ✅             |
| **Registration Fee Paid At** | 2026-01-15 10:00:00 |

**This means:**

- ✅ Sameer can login with phone: 918218330353
- ✅ Will NOT be charged ₹100 registration fee
- ✅ Will only pay consultation fee

---

## 🔄 Rollback Instructions

If you committed by mistake and need to undo:

### For ADD (created new user):

```sql
BEGIN;

-- Delete patient profile
DELETE FROM patient_profiles
WHERE user_id = (SELECT id FROM users WHERE phone = '918218330353');

-- Delete user
DELETE FROM users
WHERE phone = '918218330353';

COMMIT;
```

### For UPDATE (modified existing user):

```sql
BEGIN;

-- Restore original values (replace with actual original values)
UPDATE users
SET
    full_name = 'TM',              -- Original name
    email = NULL,                  -- Original email
    updated_at = NOW()
WHERE phone = '918218330353';

UPDATE patient_profiles
SET
    registration_fee_paid = false,  -- Original value
    registration_fee_paid_at = NULL, -- Original value
    updated_at = NOW()
WHERE user_id = (SELECT id FROM users WHERE phone = '918218330353');

COMMIT;
```

---

## 🆘 Troubleshooting

### Error: "User already exists"

- You tried to ADD but user exists
- Use UPDATE script instead

### Error: "User does not exist"

- You tried to UPDATE but user doesn't exist
- Use ADD script instead

### Error: "Duplicate key violation"

- Phone number or email already in use
- Check if another user has this phone/email

### Transaction is stuck

- Run `ROLLBACK;` to cancel
- Close and reopen Query Tool
- Try again

---

## 📞 Support

If you encounter issues:

1. Take a screenshot of the error
2. Note which script you were running
3. Check the current state with `production-check-sameer.sql`
4. Contact database administrator if needed

---

## ✨ Best Practices

1. ✅ Always run CHECK script first
2. ✅ Review results before COMMIT
3. ✅ Keep a backup of original data
4. ✅ Test on development database first
5. ✅ Run during low-traffic hours
6. ✅ Have rollback plan ready

---

**Created:** 2026-05-19  
**Purpose:** Safely add/update patient "Sameer" in production database  
**Phone:** 918218330353  
**Email:** sameer@gmail.com
