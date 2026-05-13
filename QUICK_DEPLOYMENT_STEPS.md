# MRN Feature - Quick Deployment Steps

## 🎯 TL;DR - What You Need to Do

### 1️⃣ Backup Database (CRITICAL!)

In pgAdmin4:

- Right-click on your database → **Backup**
- Save backup file with timestamp

### 2️⃣ Run Migration in pgAdmin4

1. Connect to AWS production database
2. Open **Query Tool** (right-click database)
3. Open file: `add_mrn_to_patient_profiles.sql`
4. Click **Execute** (F5)
5. Verify success ✅

### 3️⃣ Verify Migration

Run this query:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'patient_profiles' AND column_name = 'mrn';
```

Expected: 1 row showing `mrn | character varying`

### 4️⃣ Deploy Backend

```bash
cd backend
npm run build
# Deploy to AWS
# Restart backend server
```

### 5️⃣ Deploy Frontend

```bash
cd mibo-admin
npm run build
# Deploy to AWS
# Clear browser cache (Ctrl+Shift+R)
```

### 6️⃣ Test

1. Open admin panel
2. Edit a patient
3. Enter MRN: "TEST-001"
4. Click Update
5. Verify MRN displays in table ✅

---

## ⚠️ Important Notes

- **Only 1 migration file needed:** `add_mrn_to_patient_profiles.sql`
- **Zero downtime:** Migration is non-blocking
- **Safe to run:** Uses `IF NOT EXISTS` (won't fail if already exists)
- **Rollback available:** Can remove column if needed

---

## 🆘 If Something Goes Wrong

### Migration fails?

- Check database user has ALTER TABLE permission
- Check if column already exists (skip migration if yes)

### MRN not saving?

- Verify backend was restarted after deployment
- Check backend logs for errors

### MRN not displaying?

- Clear browser cache (Ctrl+Shift+R)
- Verify frontend was deployed

---

## ✅ Success Criteria

After deployment, you should see:

- ✅ MRN column in patient table
- ✅ MRN input field in edit modal
- ✅ MRN values save and display correctly
- ✅ "Not Assigned" for patients without MRN
- ✅ Sorting by MRN works
- ✅ MRN in CSV/PDF exports

---

**That's it!** Simple and straightforward. 🚀

For detailed instructions, see: `PRODUCTION_DEPLOYMENT_MRN.md`
