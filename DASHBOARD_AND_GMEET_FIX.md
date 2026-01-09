# Fix: Dashboard Not Showing Appointments & Google Meet Links Missing

## Issues Identified

### 1. Google Meet Links Not Generated

**Cause**: Environment variable `GOOGLE_SERVICE_ACCOUNT_KEY` not set correctly on Render

### 2. Appointments Not Showing on Dashboard

**Cause**: Dashboard filters appointments by date and status. If Google Meet creation fails, the appointment is still created but might not show up due to filtering logic.

## Root Cause Analysis

### Payment Flow

```
1. Create appointment → status: "BOOKED"
2. Create payment order
3. User pays via Razorpay
4. Verify payment → status: "CONFIRMED"
5. Send WhatsApp confirmation
   ├─ If ONLINE → Create Google Meet link
   │  ├─ Success → Send online_consultation_confirmation template
   │  └─ Failure → Send regular appointment_confirmation template
   └─ If IN_PERSON → Send regular appointment_confirmation template
```

### Dashboard Query Logic

```typescript
// Dashboard filters:
const upcomingAppointments = appointments.filter(
  (apt: any) =>
    new Date(apt.scheduled_start_at) > now && // Future appointments
    apt.status !== "CANCELLED" && // Not cancelled
    apt.status !== "COMPLETED" // Not completed
);
```

**Why appointments might not show:**

1. Status is not "CONFIRMED" (but it should be after payment)
2. Date is in the past (check if appointment date is correct)
3. Status is "CANCELLED" or "COMPLETED" (shouldn't happen for new bookings)

### Google Meet Creation Failure

When Google Meet creation fails:

- Error is logged but caught
- Falls back to regular WhatsApp message
- Appointment still exists with status "CONFIRMED"
- But `google_meet_link` field is NULL

## Solution

### Fix 1: Set Correct Environment Variable on Render

**Delete these variables:**

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_CALENDAR_ID`

**Add this single variable:**

- **Key**: `GOOGLE_SERVICE_ACCOUNT_KEY`
- **Value**: Entire JSON from `clinic-booking-system-483212-31e92efb492d.json`

**How to get the JSON:**

```bash
# On your local machine
cat clinic-booking-system-483212-31e92efb492d.json
```

Copy the entire output and paste it into Render as the value for `GOOGLE_SERVICE_ACCOUNT_KEY`.

**Example format:**

```json
{
  "type": "service_account",
  "project_id": "clinic-booking-system-483212",
  "private_key_id": "31e92efb492d...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDAOe6fRL5u2F41P...\n-----END PRIVATE KEY-----\n",
  "client_email": "clinic-booking-system@clinic-booking-system-483212.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

### Fix 2: Verify Dashboard API

The dashboard should show appointments if:

1. Status is "CONFIRMED" ✅ (set after payment)
2. Date is in the future ✅ (you just booked it)
3. Status is not "CANCELLED" or "COMPLETED" ✅

**To debug:**

1. Check Render logs after booking
2. Look for these log messages:

   ```
   ✅ Payment verified: rzp_xxx for appointment 123
   📹 Creating Google Meet link for online appointment 123
   ✅ Google Meet link created: https://meet.google.com/xxx-xxxx-xxx
   ✅ WhatsApp online consultation confirmation sent to +91XXXXXXXXXX with Google Meet link
   ```

3. If you see error:
   ```
   ❌ Error creating Google Meet link: ...
   ```
   Then Google Meet setup is the issue.

### Fix 3: Check Database Directly

If appointments still don't show, check the database:

```sql
-- Check appointment status
SELECT id, patient_id, status, appointment_type, scheduled_start_at, google_meet_link
FROM appointments
WHERE id = YOUR_APPOINTMENT_ID;

-- Should show:
-- status: "CONFIRMED"
-- appointment_type: "ONLINE"
-- scheduled_start_at: future date
-- google_meet_link: "https://meet.google.com/xxx-xxxx-xxx" (if Google Meet works)
```

## Testing Steps

### Step 1: Fix Environment Variable

1. Go to Render dashboard
2. Delete old Google env vars
3. Add `GOOGLE_SERVICE_ACCOUNT_KEY` with full JSON
4. Save and wait for redeploy

### Step 2: Check Logs

1. Go to Render logs
2. Look for:
   ```
   ✅ Using Google credentials from environment variable
   ✅ Google Meet utility initialized
   ```

### Step 3: Book Test Appointment

1. Go to Vercel frontend
2. Sign in
3. Book an ONLINE appointment
4. Complete payment
5. Check WhatsApp - should receive message with Google Meet link
6. Check dashboard - appointment should appear in "Upcoming Appointments"
7. Click appointment - should see "Join Google Meet" button

### Step 4: Verify in Render Logs

After booking, check logs for:

```
✅ Payment order created: order_xxx for appointment 123
✅ Payment verified: rzp_xxx for appointment 123
📹 Creating Google Meet link for online appointment 123
📅 Creating Google Meet event for Patient Name with Dr. Name
✅ Google Meet link created: https://meet.google.com/xxx-xxxx-xxx
📅 Calendar event ID: abc123def456
✅ WhatsApp online consultation confirmation sent to +91XXXXXXXXXX with Google Meet link
```

## Common Issues

### Issue 1: "Failed to initialize Google Meet utility"

**Cause**: JSON parsing error in `GOOGLE_SERVICE_ACCOUNT_KEY`
**Solution**:

- Verify JSON is valid (use jsonlint.com)
- Ensure no extra quotes or escaping
- Copy-paste directly from file

### Issue 2: "Error creating Google Meet link: insufficient permissions"

**Cause**: Service account doesn't have Calendar API access
**Solution**:

- Go to Google Cloud Console
- Enable Google Calendar API
- Ensure domain-wide delegation is enabled

### Issue 3: Appointments show in "All Appointments" but not Dashboard

**Cause**: Date filtering issue
**Solution**:

- Check appointment date is in the future
- Check system timezone matches appointment timezone
- Verify `scheduled_start_at` in database

### Issue 4: Regular WhatsApp message instead of Google Meet message

**Cause**: Google Meet creation failed, fell back to regular message
**Solution**:

- Check Render logs for Google Meet error
- Fix Google Meet setup
- Rebook appointment to test

## Environment Variables Checklist

After fixing, you should have on Render:

- ✅ `GOOGLE_SERVICE_ACCOUNT_KEY` - Entire JSON
- ✅ `DATABASE_URL` - PostgreSQL connection
- ✅ `JWT_ACCESS_SECRET` - JWT secret
- ✅ `JWT_REFRESH_SECRET` - JWT refresh secret
- ✅ `RAZORPAY_KEY_ID` - Razorpay key
- ✅ `RAZORPAY_KEY_SECRET` - Razorpay secret
- ✅ `GALLABOX_API_KEY` - Gallabox key
- ✅ `GALLABOX_API_SECRET` - Gallabox secret
- ✅ `GALLABOX_CHANNEL_ID` - Gallabox channel
- ✅ `CORS_ORIGIN` - Vercel URL
- ✅ `NODE_ENV` - production

## Summary

1. **Google Meet not working** → Fix `GOOGLE_SERVICE_ACCOUNT_KEY` env var
2. **Dashboard not showing appointments** → Should work after Google Meet fix
3. **Appointments in "All Appointments" but not dashboard** → Check date/status filtering

The main issue is the Google Meet environment variable. Once that's fixed, everything should work correctly.
