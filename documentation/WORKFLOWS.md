# MIBO Common Workflows

## Patient Booking Workflow

### Step 1: Patient Authentication

```
POST /api/patient-auth/send-otp
Body: { "phone": "919876543210" }
```

### Step 2: Verify OTP

```
POST /api/patient-auth/verify-otp
Body: { "phone": "919876543210", "otp": "123456" }
Response: { "accessToken": "...", "refreshToken": "..." }
```

### Step 3: Get Available Clinicians

```
GET /api/clinicians?centreId=1
```

### Step 4: Get Available Slots

```
GET /api/booking/available-slots?clinicianId=1&centreId=1&date=2024-12-25
```

### Step 5: Create Appointment

```
POST /api/booking/create
Headers: Authorization: Bearer {accessToken}
Body: {
  "clinician_id": 1,
  "centre_id": 1,
  "appointment_date": "2024-12-25",
  "appointment_time": "10:00:00",
  "session_duration": 45,
  "session_type": "IN_PERSON"
}
Response: { "appointment_id": 123, "status": "BOOKED" }
```

### Step 6: Create Payment Order

```
POST /api/payments/create-order
Headers: Authorization: Bearer {accessToken}
Body: { "appointment_id": 123, "amount": 1500 }
Response: { "order_id": "order_xxx", "amount": 1500, "currency": "INR" }
```

### Step 7: Frontend opens Razorpay Checkout

Payment happens in Razorpay modal on frontend.

### Step 8: Verify Payment (after success)

```
POST /api/payments/verify
Headers: Authorization: Bearer {accessToken}
Body: {
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx"
}
Response: { "success": true, "appointment_status": "CONFIRMED" }
```

Alternatively, Razorpay webhook handles verification automatically.

---

## Staff Creating Appointment (Admin Panel)

### Step 1: Staff Login

```
POST /api/auth/login/username-password
Body: { "username": "admin", "password": "password123" }
Response: { "accessToken": "...", "refreshToken": "..." }
```

### Step 2: Search for Patient or Create New

```
GET /api/patients?phone=919876543210
```

If not found:

```
POST /api/patients
Body: {
  "full_name": "John Doe",
  "phone": "919876543210",
  "email": "john@example.com",
  "date_of_birth": "1990-01-01",
  "gender": "MALE"
}
```

### Step 3: Get Available Slots

```
GET /api/booking/available-slots?clinicianId=1&centreId=1&date=2024-12-25
```

### Step 4: Create Appointment

```
POST /api/appointments
Headers: Authorization: Bearer {accessToken}
Body: {
  "patient_id": 1,
  "clinician_id": 1,
  "centre_id": 1,
  "appointment_date": "2024-12-25",
  "appointment_time": "10:00:00",
  "session_duration": 45,
  "session_type": "IN_PERSON",
  "notes": "First consultation"
}
Response: { "appointment_id": 123, "status": "BOOKED" }
```

### Step 5A: Send Payment Link (Online Payment)

```
POST /api/appointments/123/send-payment-link
Headers: Authorization: Bearer {accessToken}
Body: { "amount": 1500 }
Response: { "payment_link": "https://razorpay.com/...", "sent_to": "919876543210" }
```

Patient receives WhatsApp message with payment link.

### Step 5B: Confirm Direct Payment (Cash/Card/UPI at Desk)

```
POST /api/appointments/123/confirm-direct-payment
Headers: Authorization: Bearer {accessToken}
Body: {
  "amount": 1500,
  "payment_method": "CASH",
  "payment_notes": "Paid at front desk"
}
Response: { "success": true, "appointment_status": "CONFIRMED" }
```

---

## Clinician Session Workflow

### Step 1: Clinician Login

```
POST /api/auth/login/username-password
Body: { "username": "drjohn", "password": "password123" }
```

### Step 2: Get Today's Appointments

```
GET /api/appointments/dashboard/appointments?date=2024-12-25
Headers: Authorization: Bearer {accessToken}
```

### Step 3: Start Session

```
POST /api/appointments/123/start-session
Headers: Authorization: Bearer {accessToken}
Response: { "appointment_status": "IN_PROGRESS", "session_started_at": "..." }
```

### Step 4: Get Previous Session Notes (if follow-up)

```
GET /api/appointments/123/previous-notes
Headers: Authorization: Bearer {accessToken}
Response: { "notes": [...previous session notes...] }
```

### Step 5: Save Session Notes

```
POST /api/appointments/123/clinician-notes
Headers: Authorization: Bearer {accessToken}
Body: {
  "notes": "Patient showed improvement. Recommended continued therapy.",
  "diagnosis": "Anxiety Disorder",
  "prescription": "Meditation, 10mg Lexapro daily"
}
```

### Step 6: End Session

```
POST /api/appointments/123/end-session
Headers: Authorization: Bearer {accessToken}
Response: { "appointment_status": "COMPLETED", "session_ended_at": "..." }
```

### Step 7: Schedule Follow-up (Optional)

```
POST /api/appointments/123/schedule-followup
Headers: Authorization: Bearer {accessToken}
Body: {
  "followup_date": "2025-01-15",
  "followup_time": "10:00:00",
  "notes": "Follow-up after 3 weeks"
}
```

---

## Managing Clinician Availability

### Step 1: Get Current Availability

```
GET /api/clinicians/1/availability
```

### Step 2: Update Availability Rules

```
PUT /api/clinicians/1/availability
Headers: Authorization: Bearer {accessToken}
Body: {
  "availability_rules": [
    {
      "day_of_week": 1,
      "start_time": "09:00:00",
      "end_time": "13:00:00",
      "centre_id": 1
    },
    {
      "day_of_week": 1,
      "start_time": "14:00:00",
      "end_time": "18:00:00",
      "centre_id": 1
    },
    {
      "day_of_week": 2,
      "start_time": "09:00:00",
      "end_time": "17:00:00",
      "centre_id": 1
    }
  ]
}
```

### Step 3: Block Specific Slots (Leave/Emergency)

```
POST /api/clinicians/1/slot-exceptions
Headers: Authorization: Bearer {accessToken}
Body: {
  "exception_date": "2024-12-25",
  "start_time": "10:00:00",
  "end_time": "12:00:00",
  "centre_id": 1,
  "reason": "Personal leave"
}
```

### Step 4: Block Entire Day

```
POST /api/admin/slots/block-day
Headers: Authorization: Bearer {accessToken}
Body: {
  "clinician_id": 1,
  "centre_id": 1,
  "block_date": "2024-12-25",
  "reason": "Public holiday"
}
```

---

## Patient Self-Service (Dashboard)

### Step 1: View Dashboard

```
GET /api/patient/dashboard
Headers: Authorization: Bearer {accessToken}
Response: {
  "upcoming_appointments": [...],
  "past_appointments": [...],
  "total_appointments": 5,
  "upcoming_count": 1
}
```

### Step 2: View Profile

```
GET /api/patient/profile
Headers: Authorization: Bearer {accessToken}
```

### Step 3: Update Profile

```
PUT /api/patient/profile
Headers: Authorization: Bearer {accessToken}
Body: {
  "full_name": "John Doe Updated",
  "email": "newemail@example.com",
  "date_of_birth": "1990-01-01",
  "gender": "MALE",
  "blood_group": "O+",
  "emergency_contact_name": "Jane Doe",
  "emergency_contact_phone": "919999999999"
}
```

### Step 4: View Payment History

```
GET /api/patient/payments
Headers: Authorization: Bearer {accessToken}
```

### Step 5: Cancel Appointment

```
POST /api/patient/appointments/123/cancel
Headers: Authorization: Bearer {accessToken}
Body: { "reason": "Unable to attend due to emergency" }
```

### Step 6: View Notifications

```
GET /api/patient/notifications
Headers: Authorization: Bearer {accessToken}
```

### Step 7: Mark Notification as Read

```
PUT /api/patient/notifications/456/read
Headers: Authorization: Bearer {accessToken}
```

---

## Admin Analytics & Reporting

### Step 1: Get Dashboard Overview

```
GET /api/analytics/dashboard?centreId=1
Headers: Authorization: Bearer {accessToken}
Response: {
  "total_patients": 1250,
  "total_doctors": 12,
  "pending_followups": 45,
  "revenue_this_month": 450000
}
```

### Step 2: Get Top Performing Doctors

```
GET /api/analytics/top-doctors?limit=10&centreId=1
Headers: Authorization: Bearer {accessToken}
Response: [
  {
    "clinician_id": 1,
    "full_name": "Dr. John Doe",
    "total_appointments": 150,
    "revenue": 225000
  }
]
```

### Step 3: Get Revenue Data

```
GET /api/analytics/revenue?period=month&centreId=1
Headers: Authorization: Bearer {accessToken}
Response: {
  "current_month": 450000,
  "previous_month": 420000,
  "growth": 7.14
}
```

### Step 4: Get Appointment Sources

```
GET /api/analytics/leads-by-source
Headers: Authorization: Bearer {accessToken}
Response: {
  "WEB_PATIENT": 450,
  "FRONT_DESK": 320,
  "PHONE_BOOKING": 180
}
```

---

## Token Refresh Workflow

When access token expires (401 Unauthorized):

```
POST /api/auth/refresh
Body: { "refreshToken": "{stored_refresh_token}" }
Response: {
  "accessToken": "new_access_token",
  "refreshToken": "new_refresh_token"
}
```

Store new tokens and retry the failed request.

---

## Error Handling Best Practices

### 400 Bad Request

Validation error. Check request body format and required fields.

### 401 Unauthorized

Token expired or invalid. Refresh token or re-authenticate.

### 403 Forbidden

Insufficient permissions. Check user role.

### 404 Not Found

Resource does not exist. Verify ID in request.

### 429 Too Many Requests

Rate limit exceeded. Wait 1 minute and retry.

### 500 Internal Server Error

Server error. Retry with exponential backoff or contact support.
