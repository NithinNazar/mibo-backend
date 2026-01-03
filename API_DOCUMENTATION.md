# API Documentation - Mibo Mental Hospital

Complete API reference for all backend endpoints.

**Base URL**: `http://localhost:5000/api`

## Authentication

Most endpoints require JWT authentication. Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Test Endpoints (No Database Required)

### Send OTP (Test Mode)

Send OTP without database validation - perfect for testing!

**Endpoint**: `POST /test/send-otp`

**Request**:

```json
{
  "phone": "919876543210"
}
```

**Response**:

```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "phone": "919876543210",
    "otp": "123456" // Only in development mode
  }
}
```

**Notes**:

- OTP shown in server console
- OTP shown in browser alert (dev mode)
- OTP sent via WhatsApp (if Gallabox configured)
- No database required

### Verify OTP (Test Mode)

Verify OTP without database.

**Endpoint**: `POST /test/verify-otp`

**Request**:

```json
{
  "phone": "919876543210",
  "otp": "123456"
}
```

**Response**:

```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "phone": "919876543210",
    "verified": true,
    "accessToken": "test_access_token_...",
    "refreshToken": "test_refresh_token_..."
  }
}
```

### Check OTP Status (Test Mode)

Debug endpoint to see all stored OTPs.

**Endpoint**: `GET /test/otp-status`

**Response**:

```json
{
  "success": true,
  "data": {
    "count": 1,
    "otps": [
      {
        "phone": "919876543210",
        "otp": "123456",
        "expiresAt": "2026-01-02T10:30:00.000Z",
        "expired": false
      }
    ]
  }
}
```

## Patient Authentication

### Send OTP

Send OTP for patient login/registration.

**Endpoint**: `POST /patient-auth/send-otp`

**Request**:

```json
{
  "phone": "919876543210"
}
```

**Response**:

```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "phone": "919876543210"
  }
}
```

### Verify OTP

Verify OTP and get authentication tokens.

**Endpoint**: `POST /patient-auth/verify-otp`

**Request**:

```json
{
  "phone": "919876543210",
  "otp": "123456"
}
```

**Response**:

```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "patient": {
      "id": "uuid",
      "phone": "+919876543210",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "accessToken": "jwt_token",
    "refreshToken": "jwt_token"
  }
}
```

### Refresh Token

Get new access token using refresh token.

**Endpoint**: `POST /patient-auth/refresh-token`

**Request**:

```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_token"
  }
}
```

## Booking Flow

### Initiate Booking

Start booking process (requires database).

**Endpoint**: `POST /booking/initiate`

**Request**:

```json
{
  "clinicianId": "uuid",
  "centreId": "uuid",
  "appointmentDate": "2026-01-15",
  "appointmentTime": "10:00",
  "consultationType": "online"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "bookingId": "uuid",
    "clinician": {...},
    "centre": {...},
    "appointmentDate": "2026-01-15",
    "appointmentTime": "10:00"
  }
}
```

### Confirm Booking

Confirm booking after OTP verification.

**Endpoint**: `POST /booking/confirm`

**Headers**: `Authorization: Bearer <token>`

**Request**:

```json
{
  "bookingId": "uuid",
  "patientName": "John Doe",
  "patientEmail": "john@example.com",
  "patientAge": 30,
  "patientGender": "male"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "appointment": {
      "id": "uuid",
      "appointmentNumber": "APT-2026-001",
      "status": "pending_payment"
    },
    "payment": {
      "orderId": "order_xyz",
      "amount": 50000,
      "currency": "INR"
    }
  }
}
```

## Payment

### Create Payment Order

Create Razorpay order for appointment.

**Endpoint**: `POST /payment/create-order`

**Headers**: `Authorization: Bearer <token>`

**Request**:

```json
{
  "appointmentId": "uuid",
  "amount": 500
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "orderId": "order_xyz",
    "amount": 50000,
    "currency": "INR",
    "razorpayKeyId": "rzp_test_..."
  }
}
```

### Verify Payment

Verify payment after successful transaction.

**Endpoint**: `POST /payment/verify`

**Headers**: `Authorization: Bearer <token>`

**Request**:

```json
{
  "appointmentId": "uuid",
  "razorpayOrderId": "order_xyz",
  "razorpayPaymentId": "pay_abc",
  "razorpaySignature": "signature_hash"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "appointment": {
      "id": "uuid",
      "status": "confirmed",
      "paymentStatus": "paid"
    }
  }
}
```

### Create Payment Link

Create payment link for WhatsApp sharing.

**Endpoint**: `POST /payment/create-link`

**Headers**: `Authorization: Bearer <token>`

**Request**:

```json
{
  "appointmentId": "uuid",
  "amount": 500,
  "customerName": "John Doe",
  "customerPhone": "919876543210"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "paymentLinkId": "plink_xyz",
    "shortUrl": "https://rzp.io/i/abc123",
    "amount": 50000,
    "currency": "INR"
  }
}
```

## Patient Dashboard

### Get Patient Profile

Get authenticated patient's profile.

**Endpoint**: `GET /patient-dashboard/profile`

**Headers**: `Authorization: Bearer <token>`

**Response**:

```json
{
  "success": true,
  "data": {
    "patient": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+919876543210",
      "age": 30,
      "gender": "male"
    }
  }
}
```

### Update Patient Profile

Update patient information.

**Endpoint**: `PUT /patient-dashboard/profile`

**Headers**: `Authorization: Bearer <token>`

**Request**:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30,
  "gender": "male"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "patient": {...}
  }
}
```

### Get Appointments

Get patient's appointments.

**Endpoint**: `GET /patient-dashboard/appointments`

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:

- `status` (optional): `upcoming`, `completed`, `cancelled`
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response**:

```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "id": "uuid",
        "appointmentNumber": "APT-2026-001",
        "appointmentDate": "2026-01-15",
        "appointmentTime": "10:00",
        "status": "confirmed",
        "clinician": {...},
        "centre": {...}
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25
    }
  }
}
```

### Cancel Appointment

Cancel an appointment.

**Endpoint**: `POST /patient-dashboard/appointments/:id/cancel`

**Headers**: `Authorization: Bearer <token>`

**Request**:

```json
{
  "reason": "Personal emergency"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Appointment cancelled successfully",
  "data": {
    "appointment": {
      "id": "uuid",
      "status": "cancelled"
    }
  }
}
```

## Staff Management (Admin Only)

### Get All Staff

Get list of all staff members.

**Endpoint**: `GET /staff`

**Headers**: `Authorization: Bearer <admin_token>`

**Response**:

```json
{
  "success": true,
  "data": {
    "staff": [
      {
        "id": "uuid",
        "name": "Dr. Smith",
        "email": "smith@example.com",
        "role": "clinician",
        "specialization": "Psychiatrist"
      }
    ]
  }
}
```

### Create Staff

Create new staff member.

**Endpoint**: `POST /staff`

**Headers**: `Authorization: Bearer <admin_token>`

**Request**:

```json
{
  "name": "Dr. Smith",
  "email": "smith@example.com",
  "password": "secure_password",
  "role": "clinician",
  "specialization": "Psychiatrist",
  "phone": "919876543210"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Staff created successfully",
  "data": {
    "staff": {...}
  }
}
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

**Common HTTP Status Codes**:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- 100 requests per 15 minutes per IP
- OTP endpoints: 5 requests per 15 minutes per phone number

## Testing with cURL

**Send OTP (Test Mode)**:

```bash
curl -X POST http://localhost:5000/api/test/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"919876543210"}'
```

**Verify OTP (Test Mode)**:

```bash
curl -X POST http://localhost:5000/api/test/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"919876543210","otp":"123456"}'
```

**Get Profile (Authenticated)**:

```bash
curl -X GET http://localhost:5000/api/patient-dashboard/profile \
  -H "Authorization: Bearer <your_token>"
```

## WebSocket Events (Future)

Real-time notifications will be added via WebSocket:

- Appointment reminders
- Payment confirmations
- Status updates

## Webhooks

### Razorpay Webhook

**Endpoint**: `POST /payment/webhook`

Razorpay sends payment status updates to this endpoint.

**Events**:

- `payment.captured` - Payment successful
- `payment.failed` - Payment failed
- `order.paid` - Order completed

## Next Steps

1. Review [SETUP_GUIDE.md](./SETUP_GUIDE.md) for setup instructions
2. Check [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) for architecture
3. Test endpoints using provided examples
4. Integrate with frontend application
