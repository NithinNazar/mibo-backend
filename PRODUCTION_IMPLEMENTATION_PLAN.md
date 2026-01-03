# Production Implementation Plan

Complete implementation plan for moving from test mode to production with database integration.

## Database Schema Analysis ✅

The current schema has everything we need:

- ✅ `users` table (phone, email, full_name, user_type)
- ✅ `patient_profiles` table (user_id, date_of_birth, gender, etc.)
- ✅ `otp_requests` table (phone, otp_hash, purpose, expires_at)
- ✅ `auth_sessions` table (user_id, refresh_token_hash, expires_at)
- ✅ `appointments` table (patient_id, clinician_id, centre_id, status, etc.)
- ✅ `payments` table (patient_id, appointment_id, order_id, payment_id, amount, status)
- ✅ `video_sessions` table (appointment_id, provider, join_url, host_url)
- ✅ `notifications` table (user_id, phone, channel, template_id, status)

**No schema modifications needed!** The database is already perfect for our use case.

## Implementation Steps

### 1. Patient Authentication Flow ✅

**Endpoints**:

- `POST /api/patient-auth/send-otp` - Send OTP via WhatsApp
- `POST /api/patient-auth/verify-otp` - Verify OTP and create/login user
- `POST /api/patient-auth/refresh-token` - Refresh access token
- `POST /api/patient-auth/logout` - Logout user

**Flow**:

1. User enters phone number
2. Backend generates 6-digit OTP
3. Store OTP hash in `otp_requests` table
4. Send OTP via Gallabox WhatsApp
5. User enters OTP
6. Backend verifies OTP
7. Check if user exists by phone
8. If new user: Create `users` + `patient_profiles` records
9. If existing user: Fetch user data
10. Generate JWT access + refresh tokens
11. Store refresh token in `auth_sessions` table
12. Return tokens + user data

**Database Operations**:

```sql
-- Store OTP
INSERT INTO otp_requests (phone, otp_hash, purpose, expires_at)
VALUES ($1, $2, 'LOGIN', NOW() + INTERVAL '10 minutes');

-- Create new user
INSERT INTO users (phone, full_name, email, user_type)
VALUES ($1, $2, $3, 'PATIENT') RETURNING id;

-- Create patient profile
INSERT INTO patient_profiles (user_id)
VALUES ($1) RETURNING id;

-- Store session
INSERT INTO auth_sessions (user_id, refresh_token_hash, expires_at)
VALUES ($1, $2, NOW() + INTERVAL '7 days');
```

### 2. Booking Flow with Database

**Endpoints**:

- `POST /api/booking/initiate` - Start booking (requires auth)
- `POST /api/booking/confirm` - Confirm booking after payment

**Flow**:

1. User selects doctor, date, time, type (online/in-person)
2. User logs in with OTP (if not logged in)
3. User enters name, email (if new user)
4. Create appointment record with status='BOOKED'
5. Create payment record with status='CREATED'
6. Generate Razorpay order
7. Return order details to frontend
8. User completes payment
9. Razorpay webhook/frontend calls verify endpoint
10. Update payment status='SUCCESS'
11. Update appointment status='CONFIRMED'
12. If online appointment: Create Google Meet link
13. Send WhatsApp confirmation with appointment details

**Database Operations**:

```sql
-- Create appointment
INSERT INTO appointments (
  patient_id, clinician_id, centre_id, appointment_type,
  scheduled_start_at, scheduled_end_at, duration_minutes,
  status, booked_by_user_id, source
) VALUES ($1, $2, $3, $4, $5, $6, $7, 'BOOKED', $8, 'WEB_PATIENT')
RETURNING id;

-- Create payment
INSERT INTO payments (
  patient_id, appointment_id, provider, order_id,
  amount, currency, status
) VALUES ($1, $2, 'RAZORPAY', $3, $4, 'INR', 'CREATED')
RETURNING id;

-- Update after payment
UPDATE payments SET
  payment_id = $1,
  status = 'SUCCESS',
  paid_at = NOW()
WHERE order_id = $2;

UPDATE appointments SET
  status = 'CONFIRMED'
WHERE id = $1;

-- Create video session (if online)
INSERT INTO video_sessions (
  appointment_id, provider, meeting_id, join_url, host_url,
  status, scheduled_start_at, scheduled_end_at
) VALUES ($1, 'GOOGLE_MEET', $2, $3, $4, 'SCHEDULED', $5, $6);
```

### 3. Payment Integration (Razorpay)

**Endpoints**:

- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/verify` - Verify payment signature
- `POST /api/payment/webhook` - Handle Razorpay webhooks

**Flow**:

1. After appointment creation, create Razorpay order
2. Return order_id, amount, razorpay_key_id to frontend
3. Frontend opens Razorpay checkout
4. User completes payment
5. Razorpay calls success handler with payment_id, order_id, signature
6. Frontend calls verify endpoint
7. Backend verifies signature using Razorpay secret
8. Update payment and appointment status
9. Send confirmation WhatsApp message

**Test Mode**:

- Use test API keys from .env
- Test cards: 4111 1111 1111 1111 (success)

### 4. Patient Dashboard

**Endpoints**:

- `GET /api/patient-dashboard/profile` - Get patient profile
- `PUT /api/patient-dashboard/profile` - Update profile
- `GET /api/patient-dashboard/appointments` - Get appointments list
- `GET /api/patient-dashboard/appointments/:id` - Get appointment details
- `POST /api/patient-dashboard/appointments/:id/cancel` - Cancel appointment

**Flow**:

1. User logs in
2. Dashboard shows:
   - Upcoming appointments
   - Past appointments
   - Profile information
3. User can update profile (name, email, DOB, gender)
4. User can view appointment details
5. User can cancel appointments (if not within 24 hours)

**Database Operations**:

```sql
-- Get appointments
SELECT
  a.*,
  u.full_name as clinician_name,
  cp.specialization,
  c.name as centre_name,
  c.address_line1,
  p.status as payment_status,
  vs.join_url as meet_link
FROM appointments a
JOIN clinician_profiles cp ON a.clinician_id = cp.id
JOIN users u ON cp.user_id = u.id
JOIN centres c ON a.centre_id = c.id
LEFT JOIN payments p ON a.id = p.appointment_id
LEFT JOIN video_sessions vs ON a.id = vs.appointment_id
WHERE a.patient_id = $1
ORDER BY a.scheduled_start_at DESC;
```

### 5. Session Management

**Features**:

- JWT access token (15 minutes expiry)
- JWT refresh token (7 days expiry)
- Store refresh token hash in `auth_sessions` table
- Track user agent and IP address
- Revoke tokens on logout

**Middleware**:

```typescript
// Verify access token
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
```

### 6. WhatsApp Notifications (Gallabox)

**Templates Needed**:

1. ✅ `otp_verification` - OTP for login (already working!)
2. `appointment_confirmed` - Appointment confirmation
3. `payment_received` - Payment confirmation
4. `appointment_reminder` - 24h before appointment
5. `meet_link` - Google Meet link for online appointments

**Flow**:

- After appointment confirmation: Send confirmation message
- After payment success: Send payment receipt
- 24 hours before appointment: Send reminder
- For online appointments: Send Meet link

### 7. Google Meet Integration (Optional)

**Flow**:

1. When online appointment is confirmed
2. Create Google Calendar event
3. Add Google Meet link to event
4. Store meet link in `video_sessions` table
5. Send meet link via WhatsApp

**Setup Required**:

- Google Cloud Project
- Service Account with Calendar API access
- Add credentials to .env

## Frontend Changes Needed

### 1. Update Step 2 (Phone Verification)

- Use production endpoint: `/api/patient-auth/send-otp`
- Use production endpoint: `/api/patient-auth/verify-otp`
- Add name and email fields for new users
- Store tokens in localStorage
- Handle new user vs existing user flow

### 2. Update Step 3 (Confirm Booking)

- Call `/api/booking/initiate` with auth token
- Get Razorpay order details
- Open Razorpay checkout
- On success, call `/api/payment/verify`
- Redirect to patient dashboard

### 3. Add Patient Dashboard

- Show upcoming appointments
- Show past appointments
- Show profile information
- Allow profile editing
- Allow appointment cancellation

### 4. Add Login Page

- For returning users
- Enter phone number
- Receive OTP via WhatsApp
- Verify OTP
- Redirect to dashboard

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/mibo-development-db

# JWT
JWT_ACCESS_SECRET=your_access_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Gallabox (WhatsApp)
GALLABOX_API_KEY=695652f2540814a19bebf8b5
GALLABOX_API_SECRET=edd9fb89a68548d6a7fb080ea8255b1e
GALLABOX_CHANNEL_ID=693a63bfeba0dac02ac3d624

# Razorpay (Test Mode)
RAZORPAY_KEY_ID=rzp_test_Rv16VKPj91R00I
RAZORPAY_KEY_SECRET=lVTIWgJw36ydSFnDeGmaKIBx

# Google Meet (Optional)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=primary

# Server
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

## Testing Checklist

### Backend

- [ ] Send OTP via WhatsApp
- [ ] Verify OTP and create new user
- [ ] Verify OTP and login existing user
- [ ] Create appointment
- [ ] Create Razorpay order
- [ ] Verify payment
- [ ] Update appointment status
- [ ] Get patient appointments
- [ ] Update patient profile
- [ ] Cancel appointment
- [ ] Refresh token
- [ ] Logout

### Frontend

- [ ] Complete booking flow
- [ ] OTP verification
- [ ] Payment with Razorpay
- [ ] Redirect to dashboard
- [ ] View appointments
- [ ] View profile
- [ ] Update profile
- [ ] Cancel appointment
- [ ] Login as returning user
- [ ] Logout

### Integration

- [ ] WhatsApp OTP delivery
- [ ] WhatsApp appointment confirmation
- [ ] WhatsApp payment confirmation
- [ ] Razorpay test payment
- [ ] Google Meet link generation (optional)
- [ ] Session persistence
- [ ] Token refresh

## Implementation Order

1. ✅ Fix Gallabox WhatsApp integration
2. **Patient Auth Service** (with database)
3. **Booking Service** (with database)
4. **Payment Service** (Razorpay)
5. **Patient Dashboard** (backend)
6. **Frontend Updates** (all pages)
7. **Testing** (end-to-end)
8. **Google Meet** (optional)

## Next Steps

1. Implement patient auth service with database
2. Implement booking service with database
3. Implement payment verification
4. Update frontend to use production endpoints
5. Test complete flow end-to-end
6. Deploy to production

---

**Status**: Ready to implement
**Database**: No changes needed ✅
**WhatsApp**: Working ✅
**Razorpay**: Configured ✅
