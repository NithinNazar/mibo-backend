# 🚀 Start Testing - Quick Guide

## Step 1: Activate Files

```bash
cd backend
activate-new-files.bat
```

This will activate all 13 new implementation files.

---

## Step 2: Start Backend

```bash
npm run dev
```

Expected output:

```
Server running on port 5000
Database connected successfully
```

---

## Step 3: Choose Your Testing Method

### Option A: Quick Test (No Input Required) ⚡

**Best for**: Quick verification that backend is running

```bash
node test-quick.js
```

**What it tests**:

- ✅ Health check
- ✅ Root endpoint
- ✅ Send OTP (real WhatsApp message!)
- ✅ Available slots
- ✅ Invalid endpoint handling
- ✅ Authentication protection

**Time**: 10 seconds

---

### Option B: Complete Flow Test (Interactive) 🎯

**Best for**: Testing the complete user journey

```bash
node test-production-flow.js
```

**What it tests**:

1. Send OTP → WhatsApp
2. Verify OTP → Create user
3. Create appointment
4. Create payment order
5. Get dashboard
6. Get appointments
7. Get payments
8. Get profile
9. Update profile

**Time**: 2-3 minutes (includes waiting for OTP input)

---

### Option C: VS Code REST Client 📝

**Best for**: Manual step-by-step testing

1. Install VS Code extension: **REST Client**
2. Open `api-requests-production.http`
3. Click "Send Request" above each request

**Time**: 5-10 minutes

---

## Expected Results

### Quick Test Output:

```
============================================================
QUICK BACKEND TEST
============================================================

Base URL: http://localhost:5000/api
Test Phone: 919048810697

=== Testing Health Check ===
✓ Health check passed
  Status: ok

=== Testing Root Endpoint ===
✓ Root endpoint passed
  Message: Mibo Mental Hospital Chain Backend API
  Version: 1.0.0
  Environment: development

=== Testing Send OTP ===
✓ Send OTP passed
  Message: OTP sent successfully
  Phone: 919048810697
  ℹ Check WhatsApp for OTP!

=== Testing Available Slots (Public) ===
✓ Available slots passed
  Date: 2026-01-03
  Available slots: 8
  First slot: 09:00

=== Testing Invalid Endpoint (Should Fail) ===
✓ Invalid endpoint correctly returns 404

=== Testing Protected Endpoint Without Auth (Should Fail) ===
✓ Protected endpoint correctly requires auth
  Message: No token provided. Please login.

============================================================
TEST SUMMARY
============================================================
✓ Passed: 6
============================================================

🎉 All quick tests passed!
ℹ  Run "node test-production-flow.js" for complete testing
```

---

### Complete Flow Test Output:

```
============================================================
PRODUCTION BACKEND TESTING
============================================================

ℹ Testing with phone: 919048810697
ℹ Base URL: http://localhost:5000/api
ℹ Make sure backend is running: npm run dev

============================================================
STEP 1: Send OTP via WhatsApp
============================================================
ℹ POST http://localhost:5000/api/patient-auth/send-otp
✓ OTP sent successfully!
ℹ Check your WhatsApp for the OTP

------------------------------------------------------------
ℹ Please check your WhatsApp and enter the OTP below:
------------------------------------------------------------

Enter OTP: 123456

============================================================
STEP 2: Verify OTP and Create/Login User
============================================================
✓ OTP verified successfully!
✓ User: Test User
✓ Access Token: eyJhbGciOiJIUzI1NiIs...

============================================================
STEP 3: Create Appointment
============================================================
✓ Appointment created successfully!
✓ Appointment ID: 1
✓ Status: BOOKED

... (continues for all 9 steps)

============================================================
TEST SUMMARY
============================================================
✓ Passed: 9
============================================================

🎉 All tests passed! Backend is working perfectly!
```

---

## Troubleshooting

### Backend won't start

```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Kill process if needed
taskkill /PID <PID> /F

# Try again
npm run dev
```

### Database connection error

```bash
# Check if PostgreSQL is running
psql -U postgres -l

# Check if database exists
psql -U postgres -d mibo-development-db -c "SELECT 1;"
```

### OTP not received

```bash
# Test Gallabox directly
node test-gallabox-fixed.js

# Check .env file
# Make sure GALLABOX_API_KEY and GALLABOX_API_SECRET are correct
```

### "Cannot find module" error

```bash
# Make sure you're in backend folder
cd backend

# Install dependencies
npm install
```

---

## What to Check After Testing

### 1. WhatsApp Message

- Check your phone: 919048810697
- Should receive OTP message
- Should be from Gallabox

### 2. Database Records

```sql
-- Check user created
SELECT * FROM users WHERE phone = '919048810697';

-- Check appointment created
SELECT * FROM appointments ORDER BY created_at DESC LIMIT 1;

-- Check payment created
SELECT * FROM payments ORDER BY created_at DESC LIMIT 1;
```

### 3. Backend Logs

- Check terminal where backend is running
- Should see API requests
- Should see database queries
- Should NOT see errors

---

## Next Steps

### If Tests Pass ✅

1. **Update Frontend** - See `mibo_version-2/FRONTEND_UPDATE_NEEDED.md`
2. **Test Complete Flow** - Test from frontend UI
3. **Deploy** - Deploy to production

### If Tests Fail ❌

1. Check error messages
2. Check backend logs
3. Check database connection
4. Check `.env` file
5. Run `test-db-connection.js` to isolate database issues
6. Run `test-gallabox-fixed.js` to isolate WhatsApp issues

---

## Files Created for Testing

### Test Scripts

- ✅ `test-quick.js` - Quick automated test (no input)
- ✅ `test-production-flow.js` - Complete flow test (interactive)
- ✅ `test-gallabox-fixed.js` - WhatsApp OTP test only
- ✅ `test-db-connection.js` - Database connection test only

### REST Client Files

- ✅ `api-requests-production.http` - VS Code REST Client requests

### Documentation

- ✅ `TESTING_GUIDE.md` - Complete testing guide
- ✅ `START_TESTING.md` - This file (quick start)
- ✅ `ALL_STEPS_COMPLETE.md` - Complete overview
- ✅ `ACTIVATION_CHECKLIST.md` - Activation checklist

---

## Quick Commands

```bash
# Activate files
activate-new-files.bat

# Start backend
npm run dev

# Quick test (10 seconds)
node test-quick.js

# Complete test (2-3 minutes)
node test-production-flow.js

# Test database only
node test-db-connection.js

# Test WhatsApp only
node test-gallabox-fixed.js
```

---

## Ready to Test?

1. ✅ Activate files: `activate-new-files.bat`
2. ✅ Start backend: `npm run dev`
3. ✅ Run quick test: `node test-quick.js`
4. ✅ Run complete test: `node test-production-flow.js`

**Let's go! 🚀**
