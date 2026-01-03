# Google Meet Integration - Quick Start Guide 🚀

## What It Does

When a patient books an **ONLINE** appointment and completes payment:

1. 📅 Creates Google Calendar event with Meet link
2. 💾 Stores Meet link in database
3. 📱 Sends WhatsApp with Meet link to patient
4. 🖥️ Displays Meet link in patient dashboard

---

## Quick Test (5 Minutes)

### 1. Start Backend

```bash
cd backend
npm run dev
```

### 2. Run Test Script

```bash
node test-google-meet.js
```

### 3. Follow Prompts

- Enter OTP from WhatsApp
- Script will book ONLINE appointment
- Complete payment via Razorpay test mode

### 4. Verify Results

```sql
-- Check database
SELECT id, google_meet_link, google_meet_event_id
FROM appointments
WHERE appointment_type = 'ONLINE'
ORDER BY created_at DESC LIMIT 1;
```

### 5. Check Frontend

- Login at http://localhost:5173
- Go to Dashboard
- See blue "Join Google Meet" button

---

## Configuration Checklist

### ✅ Already Done

- [x] Google service account JSON file in place
- [x] Database columns added
- [x] Code implemented
- [x] Builds successful

### ⚠️ Needs Setup

- [ ] **Google Workspace**: Configure domain-wide delegation

  - Go to: Google Workspace Admin Console
  - Security > API Controls > Domain-wide Delegation
  - Add service account client ID
  - Scope: `https://www.googleapis.com/auth/calendar`

- [ ] **Gallabox**: Create and approve template
  - Template name: `online_consultation_confirmation`
  - Variables: Patient Name, Doctor Name, Date, Time, Meet Link
  - Wait for WhatsApp approval (24-48 hours)

---

## API Endpoints

### Book Online Appointment

```http
POST /api/booking/book
Authorization: Bearer <token>

{
  "clinicianId": 1,
  "centreId": 1,
  "appointmentType": "ONLINE",
  "scheduledStartAt": "2026-01-10T10:00:00Z",
  "durationMinutes": 50
}
```

### Create Payment

```http
POST /api/payment/create-order
Authorization: Bearer <token>

{
  "appointmentId": 123
}
```

### Verify Payment (Triggers Meet Link Creation)

```http
POST /api/payment/verify
Authorization: Bearer <token>

{
  "appointmentId": 123,
  "razorpayOrderId": "order_xxx",
  "razorpayPaymentId": "pay_xxx",
  "razorpaySignature": "signature_xxx"
}
```

---

## Troubleshooting

### Meet Link Not Created?

1. Check backend logs for errors
2. Verify service account has Calendar API access
3. Check domain-wide delegation is configured

### WhatsApp Not Sent?

1. Check if template is approved in Gallabox
2. Verify phone number format (12 digits with 91)
3. Check Gallabox API credentials in .env

### Link Not Showing in Dashboard?

1. Verify appointment_type = 'ONLINE'
2. Check google_meet_link column in database
3. Refresh dashboard page

---

## Key Files

### Backend

- `src/utils/google-meet.ts` - Meet link creation
- `src/utils/gallabox.ts` - WhatsApp notifications
- `src/services/payment.service.ts` - Integration logic
- `src/repositories/booking.repository.ts` - Database operations

### Frontend

- `src/pages/profileDashboard/PatientDashboard.tsx` - Meet link display

### Config

- `clinic-booking-system-483212-31e92efb492d.json` - Google credentials
- `.env` - Gallabox credentials

---

## Environment Variables

```env
# Already configured
GALLABOX_API_KEY=695652f2540814a19bebf8b5
GALLABOX_API_SECRET=edd9fb89a68548d6a7fb080ea8255b1e
GALLABOX_CHANNEL_ID=693a63bfeba0dac02ac3d624
```

---

## Success Indicators

✅ Backend logs show: "Google Meet link created: https://meet.google.com/xxx"
✅ Database has google_meet_link value
✅ WhatsApp message received with Meet link
✅ Dashboard shows blue "Join Google Meet" button
✅ Clicking button opens Google Meet

---

## Support

For detailed documentation, see:

- `GOOGLE_MEET_INTEGRATION_COMPLETE.md` - Full technical details
- `GOOGLE_MEET_COMPLETE_SUMMARY.md` - Complete implementation summary

**Status**: ✅ Ready for Testing
