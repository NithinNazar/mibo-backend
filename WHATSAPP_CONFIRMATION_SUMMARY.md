# WhatsApp Booking Confirmation - Quick Summary

## What Was Done ✅

Updated the booking confirmation system to use your Gallabox template `booking_conformation` instead of plain text messages.

## Template Variables Mapping

Your template: `Hello {{1}}, This is to confirm your appointment with Dr. {{2}} at the {{3}} centre. The session is scheduled on {{4}} at {{5}}. Please arrive at least 10 minutes early. If you need assistance, you can reply to this message. Regards, The {{6}} team`

Mapped to:

- **{{1}}** → Patient Name (e.g., "Nithin")
- **{{2}}** → Clinician Name (e.g., "Prajwal Devurkar")
- **{{3}}** → Centre Name (e.g., "Bangalore")
- **{{4}}** → Appointment Date (e.g., "10 January 2026")
- **{{5}}** → Appointment Time (e.g., "11:30 AM")
- **{{6}}** → "Mibo Care"

## When It Sends

**Automatically** after successful payment:

1. User books appointment
2. User completes payment
3. Payment verified ✅
4. Appointment confirmed ✅
5. **WhatsApp confirmation sent** ✅

## Test It

Run this command:

```bash
cd backend
node test-booking-confirmation.js
```

Or test the full flow:

1. Book an appointment through the website
2. Complete payment
3. Check your WhatsApp for the confirmation message

## Fallback

If the template fails for any reason, the system automatically sends a plain text message with the same information. Your users will always get a confirmation!

## Files Changed

- `backend/src/utils/gallabox.ts` - Updated to use template
- `backend/test-booking-confirmation.js` - Test script (new)

## No Changes Needed

The payment service already calls this method, so it works automatically!

---

**Status**: ✅ Ready to use
**Template**: `booking_conformation`
**Fallback**: Plain text message
