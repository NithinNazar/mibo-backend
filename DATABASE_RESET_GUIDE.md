# Database Reset Guide

This guide will help you clear all data from your development database and create a fresh admin user.

## Prerequisites

- ✅ pgAdmin 4 is running
- ✅ Connected to `mibo-development-db` database
- ✅ Backend server is running (for Node.js script)

## Step-by-Step Instructions

### Step 1: Clear All Data (Run in pgAdmin)

1. **Open pgAdmin 4**
2. **Connect to your database**:
   - Server: localhost
   - Database: `mibo-development-db`
   - Username: postgres
   - Password: g20m340i

3. **Open Query Tool**:
   - Right-click on `mibo-development-db`
   - Select "Query Tool"

4. **Open the SQL file**:
   - Click "Open File" icon (folder icon)
   - Navigate to: `backend/clear-database.sql`
   - Click "Open"

5. **Execute the SQL**:
   - Click the "Execute/Refresh" button (▶️ icon) or press F5
   - Wait for completion (should take 1-2 seconds)

6. **Verify Results**:
   - You should see a table showing all tables with 0 rows
   - Success message: "✅ Database cleared successfully!"

### Step 2: Create Admin User (Run in Terminal)

1. **Open Terminal/PowerShell**

2. **Navigate to backend folder**:

   ```bash
   cd backend
   ```

3. **Run the admin creation script**:

   ```bash
   node create-admin-user.js
   ```

4. **Expected Output**:

   ```
   🔐 Starting admin user creation...

   🔒 Hashing password...
   ✅ Password hashed successfully

   👤 Creating user account...
   ✅ User created: { id: 1, name: 'Mibo Admin', ... }

   👔 Creating staff profile...
   ✅ Staff profile created: { id: 1, role: 'ADMIN', ... }

   🎉 SUCCESS! Admin user created successfully!

   ═══════════════════════════════════════════════════
   📋 LOGIN CREDENTIALS:
   ═══════════════════════════════════════════════════
   Username (phone): +919999999999
   Password:         Mibo(2026)
   Email:            admin@mibo.care
   Role:             ADMIN
   ═══════════════════════════════════════════════════
   ```

## What This Does

### SQL Script (`clear-database.sql`)

- ✅ Clears ALL data from ALL tables
- ✅ Keeps table structures intact
- ✅ Keeps all constraints (foreign keys, unique, etc.)
- ✅ Keeps all indexes
- ✅ Keeps all functions and triggers
- ✅ Resets auto-increment sequences to 1
- ✅ Uses `TRUNCATE CASCADE` to handle dependencies automatically

### Node.js Script (`create-admin-user.js`)

- ✅ Hashes password using bcrypt (same as backend)
- ✅ Creates user in `users` table
- ✅ Creates staff profile in `staff_profiles` table
- ✅ Uses transaction (rolls back on error)
- ✅ Displays login credentials

## Admin Login Credentials

After running both scripts, you can login with:

**Admin Panel Login**:

- Phone: `+919999999999`
- Password: `Mibo(2026)`

**OR**

- Email: `admin@mibo.care`
- Password: `Mibo(2026)`

## Troubleshooting

### Error: "relation does not exist"

- Make sure you're connected to the correct database (`mibo-development-db`)
- Check that all tables exist

### Error: "Cannot connect to database"

- Verify PostgreSQL is running
- Check connection details in `.env` file
- Make sure pgAdmin is connected

### Error: "bcrypt not found"

- Run: `npm install` in the backend folder
- Make sure you're in the backend directory

### Error: "User already exists"

- The database wasn't cleared properly
- Run the SQL script again in pgAdmin

## Verification

After completing both steps:

1. **Check in pgAdmin**:

   ```sql
   SELECT * FROM users;
   SELECT * FROM staff_profiles;
   ```

   You should see 1 user and 1 staff profile.

2. **Test Login**:
   - Open admin panel
   - Login with phone: `+919999999999`
   - Password: `Mibo(2026)`
   - You should be logged in as ADMIN

## Notes

- The password is hashed using bcrypt with 10 salt rounds
- The hash is unique each time (due to random salt)
- You cannot manually create the hash - it must be done by the script
- The admin user has full access to all features

## Next Steps

After resetting the database:

1. ✅ Login to admin panel
2. ✅ Create centres (Bangalore, Kochi, Mumbai)
3. ✅ Create clinicians
4. ✅ Test booking flow
5. ✅ Deploy to production when ready

## Safety

This script is designed for **DEVELOPMENT ONLY**.

⚠️ **WARNING**: Do NOT run this on production database!

If you need to reset production:

1. Take a backup first
2. Use a different approach (selective deletion)
3. Coordinate with the team
