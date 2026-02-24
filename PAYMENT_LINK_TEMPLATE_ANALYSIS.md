# Payment Link Template Analysis

## Current Implementation vs Required Template

### ❌ What's Missing

The current implementation does NOT use the Gallabox template you specified. Instead, it sends a plain text message.

### Required Template Details:

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

### Template Parameters:

1. `{{1}}` - Patient Name
2. `{{2}}` - Payment Link URL
3. `{{3}}` - Expiry time in minutes
4. `{{4}}` - Appointment ID

---

## Current Implementation

### Location: `backend/src/utils/gallabox.ts` (Lines 591-618)

```typescript
async sendPaymentLink(
  phone: string,
  patientName: string,
  amount: number,
  paymentLink: string,
  clinicianName: string,
  appointmentDate: string,
  appointmentTime: string,
): Promise<any> {
  const message = `Hello ${patientName},

Your appointment has been booked! 🎉

📅 Date: ${appointmentDate}
⏰ Time: ${appointmentTime}
👨‍⚕️ Doctor: ${clinicianName}

💰 Consultation Fee: ₹${amount}

Please complete your payment to confirm the appointment:
🔗 ${paymentLink}

Payment Methods: UPI, Google Pay, PhonePe, Cards

This link is valid for 24 hours.

- Mibo Mental Hospital`;

  return await this.sendWhatsAppMessage(phone, message);
}
```

**Issues**:

1. ❌ Uses plain text message instead of template
2. ❌ Doesn't use template ID `699c48e93b39da99b4ff2047`
3. ❌ Doesn't include Appointment ID
4. ❌ Doesn't specify expiry in minutes (says "24 hours" instead)
5. ❌ Includes extra information (date, time, doctor, amount) not in template
6. ❌ Uses `sendWhatsAppMessage` instead of `sendTemplateMessage`

---

## What Needs to Be Fixed

### 1. Update `gallabox.ts` - Add Template-Based Payment Link Function

Add a new function that uses the template:

```typescript
/**
 * Send payment link using Gallabox template
 * Template ID: 699c48e93b39da99b4ff2047
 */
async sendPaymentLinkTemplate(
  phone: string,
  patientName: string,
  paymentLink: string,
  expiryMinutes: number,
  appointmentId: number
): Promise<any> {
  if (!this.isReady()) {
    logger.warn("Gallabox not configured, skipping payment link template");
    return { success: false, message: "Gallabox not configured" };
  }

  try {
    const formattedPhone = this.formatPhoneNumber(phone);

    const payload = {
      channelId: formattedPhone,
      channelType: "whatsapp",
      recipient: {
        name: patientName,
        phone: formattedPhone,
      },
      whatsapp: {
        type: "template",
        template: {
          name: "699c48e93b39da99b4ff2047", // Template ID
          language: {
            code: "en",
          },
          components: [
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  text: patientName, // {{1}}
                },
                {
                  type: "text",
                  text: paymentLink, // {{2}}
                },
                {
                  type: "text",
                  text: expiryMinutes.toString(), // {{3}}
                },
                {
                  type: "text",
                  text: appointmentId.toString(), // {{4}}
                },
              ],
            },
          ],
        },
      },
    };

    const response = await this.client!.post(
      "/devapi/messages/whatsapp",
      payload
    );

    logger.info(
      `Payment link template sent to ${formattedPhone} for appointment ${appointmentId}`
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    logger.error("Failed to send payment link template:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
```

### 2. Update `payment.service.ts` - Use Template Function

In `sendPaymentLink` function (around line 576), replace:

```typescript
// OLD CODE:
const result = await gallaboxUtil.sendPaymentLink(
  patientPhone,
  patientName,
  consultationFee,
  paymentLink.short_url,
  appointment.clinician_name,
  dateStr,
  timeStr,
);
```

With:

```typescript
// NEW CODE:
// Calculate expiry in minutes (Razorpay default is 15 minutes)
const expiryMinutes = Math.floor(
  (new Date(paymentLink.expire_by * 1000).getTime() - Date.now()) / 60000,
);

const result = await gallaboxUtil.sendPaymentLinkTemplate(
  patientPhone,
  patientName,
  paymentLink.short_url,
  expiryMinutes,
  appointmentId,
);
```

### 3. Update Notification Logging

Update the notification log to include template ID:

```typescript
await notificationRepository.createNotificationLog({
  user_id: appointment.patient_id,
  phone: patientPhone,
  channel: "WHATSAPP",
  template_id: 699, // Add template ID
  payload_data: {
    appointment_id: appointmentId,
    notification_type: "PAYMENT_LINK",
    payment_link: paymentLink.short_url,
    expiry_minutes: expiryMinutes,
  },
  status: result.success ? "SENT" : "FAILED",
  error_message: result.success ? undefined : result.error,
});
```

---

## Flow When Appointment is Booked from Admin Panel

### Current Flow:

1. Admin clicks "Confirm" button in admin panel
2. Frontend calls `POST /api/appointments` with appointment data
3. Backend `appointmentService.createAppointment()` is called
4. Appointment is created in database with status "BOOKED"
5. `paymentService.sendPaymentLink()` is called
6. Razorpay payment link is created
7. **❌ Plain text WhatsApp message is sent** (not using template)
8. Notification is logged in database

### Required Flow:

1. Admin clicks "Confirm" button in admin panel
2. Frontend calls `POST /api/appointments` with appointment data
3. Backend `appointmentService.createAppointment()` is called
4. Appointment is created in database with status "BOOKED"
5. `paymentService.sendPaymentLink()` is called
6. Razorpay payment link is created
7. **✅ Template-based WhatsApp message is sent** using template ID `699c48e93b39da99b4ff2047`
8. Notification is logged in database with template ID

---

## Testing the Fix

### 1. Check Gallabox Template Configuration

First, verify the template exists in Gallabox dashboard:

- Template ID: `699c48e93b39da99b4ff2047`
- Template Name: (check in Gallabox dashboard)
- Status: Approved by WhatsApp

### 2. Test Appointment Creation

```bash
# Start backend server
cd backend
npm run dev

# Create test appointment from admin panel
# Or use API:
curl -X POST http://localhost:3000/api/appointments \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 1,
    "clinician_id": 1,
    "centre_id": 1,
    "appointment_type": "IN_PERSON",
    "scheduled_start_at": "2026-02-25T10:00:00Z",
    "duration_minutes": 30
  }'
```

### 3. Verify WhatsApp Message

Check patient's WhatsApp for message with:

- ✅ Template format (not plain text)
- ✅ Patient name
- ✅ Payment link
- ✅ Expiry time in minutes
- ✅ Appointment ID

### 4. Check Logs

```bash
# Check backend logs for:
# - "Payment link template sent to..."
# - Template ID in notification log
```

---

## Environment Variables

Make sure these are set in `.env`:

```env
# Gallabox Configuration
GALLABOX_API_KEY=your_api_key_here
GALLABOX_API_SECRET=your_api_secret_here
GALLABOX_BASE_URL=https://server.gallabox.com

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

---

## Summary

### What's Currently Happening:

- ✅ Appointment is created successfully
- ✅ Payment link is generated via Razorpay
- ✅ WhatsApp message is sent to patient
- ❌ **BUT** message uses plain text format, not the template

### What Needs to Change:

1. Add `sendPaymentLinkTemplate()` function to `gallabox.ts`
2. Update `payment.service.ts` to use template function
3. Include template ID in notification logs
4. Calculate expiry in minutes from Razorpay response

### Files to Modify:

1. `backend/src/utils/gallabox.ts` - Add template function
2. `backend/src/services/payment.service.ts` - Use template function
3. Test with admin panel appointment creation

---

**Status**: ❌ Not Implemented  
**Priority**: High  
**Estimated Time**: 30 minutes to implement and test
