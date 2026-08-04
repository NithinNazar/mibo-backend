# Quick Guide: Run Profile Video URL Migration

## Step 1: Connect to Database

1. Open **pgAdmin**
2. Connect to your **development database**

## Step 2: Open Migration Script

1. In pgAdmin, go to **Tools** → **Query Tool**
2. Click **Open File** icon (folder icon)
3. Navigate to: `c:\Users\nithi\Desktop\backend_mibo\backend\migrations\add_profile_video_url_to_clinicians.sql`
4. Click **Open**

## Step 3: Execute Migration

1. Click the **Execute (Play)** button or press **F5**
2. Wait for execution to complete
3. Check the **Messages** tab for output

## Expected Output

You should see:

```
ALTER TABLE
COMMENT

column_name         | data_type | is_nullable | column_default
--------------------+-----------+-------------+---------------
profile_video_url   | text      | YES         |

message
----------------------------------------------------------------
profile_video_url column added successfully to clinician_profiles table

Query returned successfully in XXX msec.
```

## Step 4: Verify Migration

Run this query to verify the column exists:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'clinician_profiles'
  AND column_name = 'profile_video_url';
```

## Troubleshooting

### Error: "column already exists"

This means the migration has already been run. No action needed.

### Error: "table clinician_profiles does not exist"

Check that you're connected to the correct database.

### Error: "permission denied"

Ensure you're logged in with a user that has ALTER TABLE permissions.

## Next Steps After Migration

1. ✅ Restart backend server (if it's running)
2. ✅ Test the admin panel - create/edit clinician with video URL
3. ✅ Verify data is saved correctly in database
4. ✅ Test API endpoints to ensure `profileVideoUrl` is returned

## For Production Database

**IMPORTANT**: Only run on production AFTER:

- ✅ Testing on development database successfully
- ✅ Backend code deployed to production
- ✅ All tests passed

Then repeat the same steps but connect to **production database** instead.
