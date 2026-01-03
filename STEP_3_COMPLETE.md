# Step 3: Payment Service Complete! 💳

## ✅ What's Been Implemented

### Payment Integration with Razorpay

- Create payment orders in database
- Generate Razorpay orders
- Verify payment signatures
- Update appointment status after payment
- Send WhatsApp confirmations
- Handle Razorpay webhooks
- Payment history tracking

## 📁 Files Created (4 files)

1. **`src/repositories/payment.repository.ts`** (220 lines)

   - Database operations for payments
   - Payment status updates
   - Webhook event storage
   - Payment statistics

2. **`src/services/payment.service.new.ts`** (350 lines)

   - Create Razorpay orders
   - Verify payment signatures
   - Update appointment status
   - Send WhatsApp confirmations
   - Handle webhooks

3. **`src/controllers/payment.controller.new.ts`** (180 lines)

   - Request handlers for payment endpoints
   - Input validation
   - Error handling

4. **`src/routes/payment.routes.new.ts`** (60 lines)
   - API route definitions
   - Middleware integration

## 🔧 Activation Steps

Add to your activation script or run manually:

```bash
# Windows
move src\services\payment.service.new.ts src\services\payment.service.ts
move src\controllers\payment.controller.new.ts src\controllers\payment.controller.ts
move src\routes\payment.routes.new.ts src\routes\payment.routes.ts

# Or run the updated activation script
activate-new-files.bat
```

## 🎯 API Endpoints

### Payment Endpoints (5 endpoints):

- `POST /api/payment/create-order` - Create Razorpay order (protected)
- `POST /api/payment/verify` - Verify payment (protected)
- `POST /api/payment/webhook` - Razorpay webhook (public)
- `GET /api/payment/:appointmentId` - Get payment details (protected)
- `GET /api/payment/history` - Get payment history (protected)

## 🧪 Testing the Payment Flow

### 1. Create Appointment First

```bash
# Login and get access token
curl -X POST http://localhost:5000/api/patient-auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"919048810697","otp":"123456","full_name":"John Doe"}'

# Create appointment
curl -X POST http://localhost:5000/api/booking/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "clinicianId": 1,
    "centreId": 1,
    "appointmentDate": "2026-01-10",
    "appointmentTime": "10:00",
    "appointmentType": "ONLINE"
  }'

# Save the appointment ID from response
```

### 2. Create Payment Order

```bash
curl -X POST http://localhost:5000/api/payment/create-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"appointmentId": 1}'
```

**Response**:

```json
{
  "success": true,
  "message": "Payment order created successfully",
  "data": {
    "orderId": "order_xyz123",
    "amount": 50000,
    "currency": "INR",
    "razorpayKeyId": "rzp_test_...",
    "appointment": {
      "id": 1,
      "clinicianName": "Dr. Smith",
      "scheduledStartAt": "2026-01-10T10:00:00Z"
    }
  }
}
```

### 3. Frontend Integration (Razorpay Checkout)

```javascript
// Load Razorpay script
const script = document.createElement("script");
script.src = "https://checkout.razorpay.com/v1/checkout.js";
document.body.appendChild(script);

// Open Razorpay checkout
const options = {
  key: data.razorpayKeyId,
  amount: data.amount,
  currency: data.currency,
  order_id: data.orderId,
  name: "Mibo Mental Hospital",
  description: "Consultation Fee",
  handler: async function (response) {
    // Payment successful - verify on backend
    await verifyPayment(response);
  },
  prefill: {
    contact: "9876543210",
  },
  theme: {
    color: "#1c0d54",
  },
};

const razorpay = new Razorpay(options);
razorpay.open();
```

### 4. Verify Payment

```bash
curl -X POST http://localhost:5000/api/payment/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "appointmentId": 1,
    "razorpayOrderId": "order_xyz123",
    "razorpayPaymentId": "pay_abc456",
    "razorpaySignature": "signature_hash"
  }'
```

**Response**:

```json
{
  "success": true,
  "message": "Payment verified successfully! Your appointment is confirmed.",
  "data": {
    "success": true,
    "appointment": {
      "id": 1,
      "status": "CONFIRMED",
      "scheduledStartAt": "2026-01-10T10:00:00Z",
      "clinicianName": "Dr. Smith",
      "centreName": "Main Centre"
    },
    "payment": {
      "id": 1,
      "amount": 500,
      "status": "SUCCESS",
      "paidAt": "2026-01-02T12:00:00Z"
    }
  }
}
```

### 5. Get Payment History

```bash
curl -X GET http://localhost:5000/api/payment/history \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🔐 Security Features

- ✅ Payment signature verification
- ✅ Authentication required for all payment operations
- ✅ Patient ownership verification
- ✅ Webhook signature verification
- ✅ Secure payment data storage
- ✅ Razorpay test mode for development

## 📊 Database Tables Used

- `payments` - Payment records
- `appointments` - Updated to CONFIRMED after payment
- `payment_webhook_events` - Webhook event logs

## 🎨 Payment Flow

1. **User creates appointment** → Status: BOOKED
2. **Backend creates Razorpay order** → Payment record created
3. **Frontend opens Razorpay checkout** → User pays
4. **Razorpay returns payment details** → Frontend gets payment_id, signature
5. **Frontend calls verify endpoint** → Backend verifies signature
6. **Backend updates database** → Appointment: CONFIRMED, Payment: SUCCESS
7. **WhatsApp confirmation sent** → Patient receives confirmation message

## 💳 Razorpay Test Cards

**Success**:

- Card: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date

**Failure**:

- Card: `4000 0000 0000 0002`

## 📱 WhatsApp Confirmation

After successful payment, patient receives:

```
Hello John Doe,

Your appointment has been confirmed! 🎉

📅 Date: 10 January 2026
⏰ Time: 10:00 AM
👨‍⚕️ Doctor: Dr. Smith
🏥 Centre: Main Centre

Please arrive 10 minutes before your scheduled time.

- Mibo Mental Hospital
```

## 🔄 Webhook Setup (Optional)

Configure Razorpay webhook:

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL: `https://your-domain.com/api/payment/webhook`
3. Select events: `payment.captured`, `payment.failed`
4. Save webhook secret (not needed for signature verification)

## 📝 Complete Flow Summary

### Steps 1-3 Complete:

**Step 1: Authentication** ✅

- OTP-based login/signup
- JWT tokens
- Session management

**Step 2: Booking** ✅

- Create appointments
- Validate availability
- Get appointment details

**Step 3: Payment** ✅

- Create Razorpay orders
- Verify payments
- Update appointment status
- Send confirmations

## 🚀 What's Next: Step 4 - Patient Dashboard

### Features to Implement:

- View upcoming appointments
- View past appointments
- View appointment details with payment info
- Update profile information
- Cancel appointments

### Files to Create:

1. `src/services/patient-dashboard.service.ts`
2. `src/controllers/patient-dashboard.controller.ts`
3. `src/routes/patient-dashboard.routes.ts`

### API Endpoints:

- `GET /api/patient-dashboard/profile` - Get profile
- `PUT /api/patient-dashboard/profile` - Update profile
- `GET /api/patient-dashboard/appointments` - List appointments
- `GET /api/patient-dashboard/appointments/:id` - Get appointment details

---

**Status**: Steps 1, 2, 3 Complete ✅  
**Next**: Step 4 (Patient Dashboard) or Frontend Integration
