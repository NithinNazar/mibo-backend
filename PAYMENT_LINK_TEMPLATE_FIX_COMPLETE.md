# Payment Link Template Fix - COMPLETE ✅

## Issue Summary

When appointments were booked from the admin panel, the system was sending a plain text WhatsApp message instead of using the required Gallabox template.

## Required Template

- **Template ID**: `699c48e93b39da99b4ff2047`
- **Template Body**:

```
Hello {{1}},

Your appointment with Mibo Care has been successfully booked.

To confirm your appointment, please complete the payment using the secure link below:
{{2}}

This payment link will expire in {{3}} minutes.

Appointment ID: {{4}}

If you have any questions, please contact our support team.

Thank you,
Mibo Care
```

## Changes Made

### 1. Added New Template Function in `gallabox.ts`

**File**: `backend/src/utils/gallabox.ts`

Added `sendPaymentLinkTemplate()` function that:

- Uses template ID `699c48e93b39da99b4ff2047`
- Accepts parameters: phone, patientName, paymentLink, expiryMinutes, appointmentId
- Formats payload according to Gallabox template API requirements
- Uses `bodyValues` format with numbered parameters (1, 2, 3, 4)

```typescript
async sendPaymentLinkTemplate(
  phone: string,
  patientName: string,
  paymentLink: string,
  expiryMinutes: number,
  appointmentId: number,
): Promise<any>
```

### 2. Updated Payment Service to Use Template

**File**: `backend/src/services/payment.service.ts`

Modified `sendPaymentLink()` function (around line 576) to:

- Calculate expiry time in minutes from Razorpay payment link
- Call `gallaboxUtil.sendPaymentLinkTemplate()` instead of `sendPaymentLink()`
- Pass appointmentId as parameter
- Updated logging to indicate template usage

**Key Changes**:

```typescript
// Calculate expiry in minutes from Razorpay payment link
const expiryMinutes = Math.floor(
  (new Date(paymentLink.expire_by * 1000).getTime() - Date.now()) / 60000,
);

// Use template-based message
const result = await gallaboxUtil.sendPaymentLinkTemplate(
  patientPhone,
  patientName,
  paymentLink.short_url,
  expiryMinutes,
  appointmentId,
);
```

## How It Works Now

### Flow When Appointment is Booked from Admin Panel:

1. Admin clicks "Confirm" button in admin panel
2. Frontend calls `POST /api/appointments` with appointment data
3. Backend `appointmentService.createAppointment()` is called
4. Appointment is created in database with status "BOOKED"
5. `paymentService.sendPaymentLink()` is called
6. Razorpay payment link is created
7. **✅ Template-based WhatsApp message is sent** using template ID `699c48e93b39da99b4ff2047`
8. Message includes:
   - Patient name ({{1}})
   - Payment link URL ({{2}})
   - Expiry time in minutes ({{3}})
   - Appointment ID ({{4}})

## Template Parameters

| Parameter | Value            | Example                   |
| --------- | ---------------- | ------------------------- |
| {{1}}     | Patient Name     | "John Doe"                |
| {{2}}     | Payment Link URL | "https://rzp.io/l/abc123" |
| {{3}}     | Expiry Minutes   | "15"                      |
| {{4}}     | Appointment ID   | "123"                     |

## Testing

### Backend Server Status

✅ Server running on port 5000
✅ Database connected successfully
✅ Gallabox initialized successfully
✅ Razorpay initialized successfully
✅ No TypeScript errors

### To Test the Fix:

1. **From Admin Panel**:
   - Go to admin panel
   - Create a new appointment
   - Click "Confirm" button
   - Check patient's WhatsApp for template message

2. **Expected WhatsApp Message**:

   ```
   Hello [Patient Name],

   Your appointment with Mibo Care has been successfully booked.

   To confirm your appointment, please complete the payment using the secure link below:
   [Payment Link]

   This payment link will expire in [X] minutes.

   Appointment ID: [ID]

   If you have any questions, please contact our support team.

   Thank you,
   Mibo Care
   ```

3. **Check Backend Logs**:
   - Look for: `✅ Payment link template sent to...`
   - Verify appointment ID is included

## Environment Variables

Required in `.env`:

```env
GALLABOX_API_KEY=your_api_key_here
GALLABOX_API_SECRET=your_api_secret_here
GALLABOX_CHANNEL_ID=your_channel_id_here
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

## Files Modified

1. ✅ `backend/src/utils/gallabox.ts` - Added `sendPaymentLinkTemplate()` function
2. ✅ `backend/src/services/payment.service.ts` - Updated to use template function

## Verification Checklist

- ✅ Backend server running successfully
- ✅ No TypeScript compilation errors
- ✅ Template function added to gallabox.ts
- ✅ Payment service updated to use template
- ✅ Expiry time calculated in minutes
- ✅ Appointment ID included in message
- ✅ Server auto-reloaded with changes

## Status

**✅ IMPLEMENTATION COMPLETE**

The payment link template feature is now fully implemented. When appointments are booked from the admin panel, patients will receive a properly formatted WhatsApp message using the Gallabox template ID `699c48e93b39da99b4ff2047`.

## Next Steps

1. Test by creating an appointment from admin panel
2. Verify WhatsApp message format matches template
3. Confirm all 4 parameters are populated correctly
4. Check backend logs for successful template sending

---

**Date**: February 24, 2026
**Backend Server**: Running on port 5000
**Status**: Ready for testing
