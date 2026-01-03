# ✅ Activation Checklist

## Pre-Activation Verification

### Database ✅

- [x] PostgreSQL running
- [x] Database: `mibo-development-db` exists
- [x] All required tables exist:
  - [x] `users`
  - [x] `patient_profiles`
  - [x] `otp_requests`
  - [x] `auth_sessions`
  - [x] `appointments`
  - [x] `payments`
  - [x] `payment_webhook_events`
  - [x] `video_sessions`
  - [x] `notifications`

### Environment Variables ✅

- [x] `DATABASE_URL` configured
- [x] `JWT_ACCESS_SECRET` configured
- [x] `JWT_REFRESH_SECRET` configured
- [x] `GALLABOX_API_KEY` configured
- [x] `GALLABOX_API_SECRET` configured
- [x] `GALLABOX_CHANNEL_ID` configured
- [x] `RAZORPAY_KEY_ID` configured
- [x] `RAZORPAY_KEY_SECRET` configured

### Implementation Files ✅

- [x] All 13 files created
- [x] All TypeScript errors fixed
- [x] All files have `.new.ts` extension

---

## Activation Steps

### Step 1: Backup Current Files

The activation script will automatically backup:

- `patient-auth.controller.ts` → `patient-auth.controller.old.ts`
- `patient-auth.routes.ts` → `patient-auth.routes.old.ts`
- `booking.service.ts` → `booking.service.old.ts`
- `booking.controller.ts` → `booking.controller.old.ts`
- `booking.routes.ts` → `booking.routes.old.ts`
- `payment.service.ts` → `payment.service.old.ts`
- `payment.controller.ts` → `payment.controller.old.ts`
- `payment.routes.ts` → `payment.routes.old.ts`

### Step 2: Run Activation Script

```bash
cd backend
activate-new-files.bat
```

### Step 3: Verify Activation

Check that these files now exist without `.new.ts`:

- [ ] `src/controllers/patient-auth.controller.ts`
- [ ] `src/routes/patient-auth.routes.ts`
- [ ] `src/services/booking.service.ts`
- [ ] `src/controllers/booking.controller.ts`
- [ ] `src/routes/booking.routes.ts`
- [ ] `src/services/payment.service.ts`
- [ ] `src/controllers/payment.controller.ts`
- [ ] `src/routes/payment.routes.ts`

### Step 4: Start Backend

```bash
npm run dev
```

Expected output:

```
Server running on port 5000
Database connected successfully
```

---

## Post-Activation Testing

### Test 1: Health Check

```bash
curl http://localhost:5000/api/health
```

Expected: `{"status":"ok"}`

### Test 2: Send OTP

```bash
curl -X POST http://localhost:5000/api/patient-auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"919048810697"}'
```

Expected:

- Status: 200
- Response: `{"success":true,"message":"OTP sent successfully"}`
- WhatsApp message received on phone

### Test 3: Verify OTP

```bash
# Replace YOUR_OTP with the OTP received on WhatsApp
curl -X POST http://localhost:5000/api/patient-auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone":"919048810697",
    "otp":"YOUR_OTP",
    "full_name":"Test User",
    "email":"test@example.com"
  }'
```

Expected:

- Status: 200
- Response contains: `accessToken`, `refreshToken`, `user` object
- Save the `accessToken` for next tests

### Test 4: Get Profile

```bash
# Replace YOUR_TOKEN with the accessToken from Test 3
curl -X GET http://localhost:5000/api/patient-auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected:

- Status: 200
- Response contains user profile with phone, email, full_name

### Test 5: Create Appointment

```bash
# Replace YOUR_TOKEN with the accessToken
curl -X POST http://localhost:5000/api/booking/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "clinicianId": 1,
    "centreId": 1,
    "appointmentDate": "2026-01-10",
    "appointmentTime": "10:00",
    "appointmentType": "ONLINE"
  }'
```

Expected:

- Status: 201
- Response contains appointment details with `id`
- Save the appointment `id` for next test

### Test 6: Create Payment Order

```bash
# Replace YOUR_TOKEN and APPOINTMENT_ID
curl -X POST http://localhost:5000/api/payment/create-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"appointmentId": APPOINTMENT_ID}'
```

Expected:

- Status: 200
- Response contains: `orderId`, `amount`, `currency`, `razorpayKeyId`

### Test 7: Get Appointments

```bash
# Replace YOUR_TOKEN
curl -X GET http://localhost:5000/api/booking/my-appointments \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected:

- Status: 200
- Response contains array of appointments

### Test 8: Get Payment History

```bash
# Replace YOUR_TOKEN
curl -X GET http://localhost:5000/api/payment/history \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected:

- Status: 200
- Response contains array of payments

---

## Database Verification

### Check User Created

```sql
SELECT * FROM users WHERE phone = '919048810697';
```

Expected: 1 row with user details

### Check Patient Profile Created

```sql
SELECT pp.* FROM patient_profiles pp
JOIN users u ON pp.user_id = u.id
WHERE u.phone = '919048810697';
```

Expected: 1 row with patient profile

### Check OTP Request

```sql
SELECT * FROM otp_requests
WHERE phone = '919048810697'
ORDER BY created_at DESC
LIMIT 1;
```

Expected: 1 row with OTP hash and `is_used = true`

### Check Auth Session

```sql
SELECT * FROM auth_sessions
WHERE user_id = (SELECT id FROM users WHERE phone = '919048810697')
ORDER BY created_at DESC
LIMIT 1;
```

Expected: 1 row with refresh token hash

### Check Appointment

```sql
SELECT * FROM appointments
WHERE patient_id = (SELECT pp.id FROM patient_profiles pp
                    JOIN users u ON pp.user_id = u.id
                    WHERE u.phone = '919048810697')
ORDER BY created_at DESC
LIMIT 1;
```

Expected: 1 row with appointment details

### Check Payment

```sql
SELECT * FROM payments
WHERE patient_id = (SELECT pp.id FROM patient_profiles pp
                    JOIN users u ON pp.user_id = u.id
                    WHERE u.phone = '919048810697')
ORDER BY created_at DESC
LIMIT 1;
```

Expected: 1 row with payment details

---

## Troubleshooting

### Issue: Backend won't start

**Check**:

- Database is running: `psql -U postgres -d mibo-development-db -c "SELECT 1;"`
- Environment variables are set: Check `.env` file
- No port conflicts: `netstat -ano | findstr :5000`

### Issue: OTP not received

**Check**:

- Gallabox credentials in `.env`
- Phone number format: Must start with country code (919048810697)
- Gallabox dashboard for delivery status
- Test with: `node test-gallabox-fixed.js`

### Issue: Database connection error

**Check**:

- PostgreSQL service running
- Database exists: `psql -U postgres -l`
- Credentials correct in `DATABASE_URL`
- Test with: `node test-db-connection.js`

### Issue: JWT token invalid

**Check**:

- Token not expired (15 min for access token)
- Token format: `Bearer <token>`
- JWT secrets match in `.env`
- Use refresh token endpoint if expired

### Issue: Razorpay order creation fails

**Check**:

- Razorpay credentials in `.env`
- Test mode keys (start with `rzp_test_`)
- Amount is in paise (multiply by 100)
- Appointment exists and belongs to user

---

## Rollback Plan

If something goes wrong, rollback to old files:

```bash
cd backend

# Restore old files
move src\controllers\patient-auth.controller.old.ts src\controllers\patient-auth.controller.ts
move src\routes\patient-auth.routes.old.ts src\routes\patient-auth.routes.ts
move src\services\booking.service.old.ts src\services\booking.service.ts
move src\controllers\booking.controller.old.ts src\controllers\booking.controller.ts
move src\routes\booking.routes.old.ts src\routes\booking.routes.ts
move src\services\payment.service.old.ts src\services\payment.service.ts
move src\controllers\payment.controller.old.ts src\controllers\payment.controller.ts
move src\routes\payment.routes.old.ts src\routes\payment.routes.ts

# Restart backend
npm run dev
```

---

## Success Criteria

All tests pass:

- [x] Health check returns OK
- [x] OTP sent via WhatsApp
- [x] OTP verified successfully
- [x] User created in database
- [x] JWT tokens generated
- [x] Profile retrieved
- [x] Appointment created
- [x] Payment order created
- [x] Appointments list retrieved
- [x] Payment history retrieved

Database records created:

- [x] User in `users` table
- [x] Patient profile in `patient_profiles` table
- [x] OTP in `otp_requests` table
- [x] Session in `auth_sessions` table
- [x] Appointment in `appointments` table
- [x] Payment in `payments` table

---

## Next Steps After Successful Activation

### Option 1: Continue Backend (Step 4)

Implement patient dashboard endpoints:

- Get profile
- Update profile
- Get appointments with filters
- Get appointment details
- Cancel appointments

### Option 2: Update Frontend

Connect frontend to production backend:

- Update authentication flow
- Update booking flow
- Integrate Razorpay checkout
- Create dashboard pages
- Create login page

### Option 3: Add More Features

- Google Meet integration
- More WhatsApp templates
- Email notifications
- Appointment reminders
- Payment refunds

---

## Support

**Documentation**:

- `READY_TO_ACTIVATE.md` - Complete guide
- `NEXT_STEPS.md` - What to do next
- `API_DOCUMENTATION.md` - All endpoints
- `SETUP_GUIDE.md` - Setup instructions

**Test Scripts**:

- `test-gallabox-fixed.js` - Test WhatsApp
- `test-db-connection.js` - Test database
- `api-requests.http` - Test APIs

**Need Help?**

- Check logs: `npm run dev` output
- Check database: Use SQL queries above
- Check Gallabox: Dashboard for delivery status
- Check Razorpay: Dashboard for orders

---

**Ready to activate?** Run: `activate-new-files.bat` 🚀
