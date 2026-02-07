# Payment Link Integration - Complete

## Overview

Integrated automatic payment link generation and WhatsApp delivery into the appointment booking flow. Now when admins or patients book appointments, payment links are automatically generated via Razorpay and sent to patients via WhatsApp.

## Changes Made

### 1. Backend - Appointment Service (`backend/src/services/appointment.services.ts`)

**Added Import:**

```typescript
import { paymentService } from "./payment.service";
```

**Modified `createAppointment` Method:**

- Refactored to fetch patient and clinician details once at the beginning
- Added automatic payment link generation after appointment creation
- Payment link is generated for BOTH online and in-person appointments
- Payment link is sent via WhatsApp using Gallabox integration

**New Flow:**

1. Create appointment in database
2. For ONLINE appointments:
   - Generate Google Meet link
   - Send Meet link via WhatsApp and email
   - Notify doctor and admins
3. For IN_PERSON appointments:
   - Send regular confirmation via WhatsApp
4. **NEW**: Generate Razorpay payment link
5. **NEW**: Send payment link via WhatsApp to patient
6. Return appointment with payment link info

**Response Enhancement:**
The appointment response now includes:

- `paymentLink`: The Razorpay payment link URL
- `paymentLinkSent`: Boolean indicating if WhatsApp was sent successfully
- `paymentAmount`: The consultation fee amount
- `paymentLinkError`: Error message if payment link generation failed (optional)

## How It Works

### Admin Booking Flow

1. Admin opens `BookAppointmentPage` in admin panel
2. Admin selects centre, clinician, date/time, session type, and patient
3. Admin clicks "Confirm Booking"
4. Backend creates appointment
5. **Backend automatically generates payment link**
6. **Backend sends payment link via WhatsApp to patient**
7. Patient receives WhatsApp with:
   - Appointment details (date, time, doctor, centre)
   - Consultation fee amount
   - Payment link (valid for 24 hours)
   - Payment methods (UPI, Google Pay, PhonePe, Cards)

### Patient Booking Flow (Frontend)

1. Patient selects clinician and books appointment
2. Backend creates appointment
3. **Backend automatically generates payment link**
4. **Backend sends payment link via WhatsApp**
5. Patient receives WhatsApp with payment link
6. Patient clicks link and completes payment
7. Appointment status updates to "CONFIRMED" after payment

## Payment Link Features

### Razorpay Integration

- Creates payment link with 24-hour validity
- Supports multiple payment methods (UPI, Cards, Wallets)
- Includes appointment reference ID
- Stores payment link in database

### WhatsApp Notification (via Gallabox)

The WhatsApp message includes:

- Patient name
- Doctor name
- Appointment date and time
- Consultation fee amount
- Payment link
- Payment methods available
- Link validity (24 hours)

### Error Handling

- If payment link generation fails, appointment is still created
- Error is logged but doesn't block appointment creation
- Payment link can be regenerated manually if needed

## Database Storage

Payment links are stored in the `payments` table with:

- `payment_link_id`: Razorpay payment link ID
- `payment_link_url`: Short URL for payment
- `appointment_id`: Reference to appointment
- `amount`: Consultation fee
- `status`: Payment status (PENDING, SUCCESS, FAILED)

## Testing

### Test Scenarios

1. **Admin books appointment** → Payment link sent automatically
2. **Patient books appointment** → Payment link sent automatically
3. **Online appointment** → Google Meet link + Payment link sent
4. **In-person appointment** → Confirmation + Payment link sent
5. **Payment link fails** → Appointment still created, error logged

### Verify Payment Link

1. Check backend logs for: `✅ Payment link generated and sent for appointment X`
2. Check patient's WhatsApp for payment link message
3. Check appointment response for `paymentLink` field
4. Verify payment link in database: `SELECT * FROM payments WHERE appointment_id = X`

## Configuration Required

### Environment Variables

Ensure these are set in `.env`:

```
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
GALLABOX_API_KEY=your_gallabox_api_key
GALLABOX_API_SECRET=your_gallabox_api_secret
GALLABOX_CHANNEL_ID=your_gallabox_channel_id
```

### Razorpay Setup

1. Sign up at https://razorpay.com/
2. Get API keys from Dashboard > Settings > API Keys
3. Add keys to environment variables

### Gallabox Setup

1. Sign up at https://gallabox.com/
2. Connect WhatsApp Business Account
3. Get API credentials from Dashboard > Settings > API
4. Add credentials to environment variables

## Benefits

### For Admins

- No manual payment link generation needed
- Automatic WhatsApp delivery
- Payment tracking in database
- Reduced manual work

### For Patients

- Instant payment link via WhatsApp
- Multiple payment options
- Secure Razorpay checkout
- 24-hour validity window

### For Business

- Faster payment collection
- Reduced payment delays
- Better payment tracking
- Automated workflow

## Next Steps

### Optional Enhancements

1. Add payment reminder system (send reminder after 12 hours if unpaid)
2. Add payment link expiry notification
3. Add manual payment link regeneration endpoint
4. Add payment status webhook handling
5. Add refund processing for cancelled appointments

## Files Modified

- `backend/src/services/appointment.services.ts` - Added payment link generation

## Files Referenced

- `backend/src/services/payment.service.ts` - Payment link creation logic
- `backend/src/utils/razorpay.ts` - Razorpay API integration
- `backend/src/utils/gallabox.ts` - WhatsApp messaging integration

## Deployment Notes

- No database migrations required (payment link fields already exist)
- Ensure Razorpay and Gallabox credentials are configured in production
- Test payment link generation in staging before production deployment
- Monitor logs for payment link generation errors

---

**Status**: ✅ Complete
**Date**: 2026-02-07
**Impact**: High - Automates payment collection for all appointments
