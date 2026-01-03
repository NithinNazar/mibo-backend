# 🧪 Backend Testing Guide (No Postman Required!)

## Testing Options

You have **3 ways** to test the backend without Postman:

### Option 1: Node.js Test Script (Recommended) ⭐

**File**: `test-production-flow.js`  
**Best for**: Complete automated testing

### Option 2: VS Code REST Client

**File**: `api-requests-production.http`  
**Best for**: Manual step-by-step testing

### Option 3: Command Line (curl)

**Best for**: Quick individual endpoint testing

---

## Option 1: Node.js Test Script (Easiest!)

### Prerequisites

1. Backend running: `npm run dev`
2. Database running
3. Your phone number ready: `919048810697`

### Run the Test

```bash
cd backend
node test-production-flow.js
```

### What It Does

1. ✅ Sends OTP to your WhatsApp
2. ⏸️ Waits for you to enter OTP
3. ✅ Verifies OTP and creates user
4. ✅ Creates appointment
5. ✅ Creates payment order
6. ✅ Gets dashboard
7. ✅ Gets appointments
8. ✅ Gets payments
9. ✅ Gets profile
10. ✅ Updates profile

### Expected Output

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

... (continues with all tests)

============================================================
TEST SUMMARY
============================================================
✓ Passed: 9
============================================================

🎉 All tests passed! Backend is working perfectly!
```

---

## Option 2: VS Code REST Client

### Prerequisites

1. Install VS Code extension: **REST Client** by Huachao Mao
2. Backend running: `npm run dev`
3. Database running

### How to Use

1. Open `api-requests-production.http` in VS Code
2. You'll see "Send Request" links above each request
3. Click "Send Request" to execute

### Testing Flow

```
1. Click "Send Request" above "1.1 Send OTP"
   → Check WhatsApp for OTP

2. Replace "OTP_FROM_WHATSAPP" with actual OTP in "1.2 Verify OTP"
   → Click "Send Request"
   → Access token is automatically extracted!

3. Click "Send Request" above "2.1 Create Appointment"
   → Appointment ID is automatically extracted!

4. Click "Send Request" above "3.1 Create Payment Order"
   → Order ID is automatically extracted!

5. Continue clicking "Send Request" for other endpoints
```

### Example Response

```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "message": "OTP sent to your WhatsApp",
    "expiresIn": "10 minutes"
  }
}
```

---

## Option 3: Command Line (curl)

### Test 1: Send OTP

```bash
curl -X POST http://localhost:5000/api/patient-auth/send-otp ^
  -H "Content-Type: application/json" ^
  -d "{\"phone\":\"919048810697\"}"
```

### Test 2: Verify OTP (Replace 123456 with actual OTP)

```bash
curl -X POST http://localhost:5000/api/patient-auth/verify-otp ^
  -H "Content-Type: application/json" ^
  -d "{\"phone\":\"919048810697\",\"otp\":\"123456\",\"full_name\":\"Test User\",\"email\":\"test@example.com\"}"
```

**Save the accessToken from response!**

### Test 3: Create Appointment (Replace YOUR_TOKEN)

```bash
curl -X POST http://localhost:5000/api/booking/create ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -d "{\"clinicianId\":1,\"centreId\":1,\"appointmentDate\":\"2026-01-10\",\"appointmentTime\":\"10:00\",\"appointmentType\":\"ONLINE\"}"
```

**Save the appointment ID from response!**

### Test 4: Create Payment Order (Replace YOUR_TOKEN and APPOINTMENT_ID)

```bash
curl -X POST http://localhost:5000/api/payment/create-order ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -d "{\"appointmentId\":APPOINTMENT_ID}"
```

### Test 5: Get Dashboard (Replace YOUR_TOKEN)

```bash
curl -X GET http://localhost:5000/api/patient/dashboard ^
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 6: Get Appointments (Replace YOUR_TOKEN)

```bash
curl -X GET http://localhost:5000/api/patient/appointments ^
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 7: Get Payments (Replace YOUR_TOKEN)

```bash
curl -X GET http://localhost:5000/api/patient/payments ^
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 8: Get Profile (Replace YOUR_TOKEN)

```bash
curl -X GET http://localhost:5000/api/patient/profile ^
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Before Testing

### 1. Activate New Files

```bash
cd backend
activate-new-files.bat
```

### 2. Start Backend

```bash
npm run dev
```

Expected output:

```
Server running on port 5000
Database connected successfully
```

### 3. Check Database

Make sure PostgreSQL is running and database exists:

```bash
psql -U postgres -d mibo-development-db -c "SELECT 1;"
```

---

## Troubleshooting

### Issue: "Cannot find module 'node-fetch'"

**Solution**: The test script uses built-in fetch (Node 18+)

```bash
node --version  # Should be 18 or higher
```

If Node < 18, install fetch:

```bash
npm install node-fetch
```

Then update test script:

```javascript
// Add at top of test-production-flow.js
const fetch = require("node-fetch");
```

### Issue: "ECONNREFUSED"

**Solution**: Backend is not running

```bash
cd backend
npm run dev
```

### Issue: "Database connection error"

**Solution**: PostgreSQL is not running or database doesn't exist

```bash
# Check if PostgreSQL is running
psql -U postgres -l

# If database doesn't exist, create it
psql -U postgres -c "CREATE DATABASE \"mibo-development-db\";"
```

### Issue: "OTP not received"

**Solution**: Check Gallabox credentials in `.env`

```bash
# Test Gallabox directly
node test-gallabox-fixed.js
```

### Issue: "Invalid token"

**Solution**: Token expired (15 min expiry)

- Get new token by running verify OTP again
- Or use refresh token endpoint

---

## What to Check After Testing

### 1. Database Records

```sql
-- Check user created
SELECT * FROM users WHERE phone = '919048810697';

-- Check patient profile
SELECT * FROM patient_profiles WHERE user_id = (
  SELECT id FROM users WHERE phone = '919048810697'
);

-- Check appointment
SELECT * FROM appointments WHERE patient_id = (
  SELECT id FROM patient_profiles WHERE user_id = (
    SELECT id FROM users WHERE phone = '919048810697'
  )
);

-- Check payment
SELECT * FROM payments WHERE patient_id = (
  SELECT id FROM patient_profiles WHERE user_id = (
    SELECT id FROM users WHERE phone = '919048810697'
  )
);
```

### 2. WhatsApp Message

- Check your WhatsApp for OTP message
- Should be from Gallabox
- Should contain 6-digit OTP

### 3. Backend Logs

- Check terminal where backend is running
- Should see API requests logged
- Should see database queries logged

---

## Success Criteria

✅ All tests pass  
✅ OTP received on WhatsApp  
✅ User created in database  
✅ Appointment created in database  
✅ Payment order created  
✅ Dashboard shows correct data  
✅ No errors in backend logs

---

## Next Steps After Testing

### If All Tests Pass ✅

1. Update frontend to use production endpoints
2. Test complete flow from frontend
3. Deploy to production

### If Tests Fail ❌

1. Check error messages
2. Check backend logs
3. Check database connection
4. Check environment variables
5. Ask for help with specific error

---

## Quick Reference

### Test Files

- `test-production-flow.js` - Automated test script
- `api-requests-production.http` - VS Code REST Client
- `test-gallabox-fixed.js` - Test WhatsApp OTP only
- `test-db-connection.js` - Test database connection only

### Documentation Files

- `ALL_STEPS_COMPLETE.md` - Complete overview
- `ACTIVATION_CHECKLIST.md` - Activation checklist
- `API_DOCUMENTATION.md` - All API endpoints
- `TESTING_GUIDE.md` - This file

### Important Endpoints

- Health: `GET /api/health`
- Send OTP: `POST /api/patient-auth/send-otp`
- Verify OTP: `POST /api/patient-auth/verify-otp`
- Create Appointment: `POST /api/booking/create`
- Create Payment: `POST /api/payment/create-order`
- Dashboard: `GET /api/patient/dashboard`

---

## Need Help?

1. Check backend logs for errors
2. Check database for records
3. Check WhatsApp for OTP
4. Check `.env` file for credentials
5. Run individual test scripts to isolate issues

**Happy Testing! 🚀**
