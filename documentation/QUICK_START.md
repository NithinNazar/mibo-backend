# MIBO API Quick Start Guide

## Setup in 5 Minutes

### 1. Import Postman Collection

- Open Postman
- Click Import
- Select `MIBO_API_Postman_Collection.json`
- Collection appears in sidebar

### 2. Configure Environment Variables

Create new environment in Postman with:

```
base_url = https://api.mibo.care/api
access_token = (leave empty, will be set after login)
refresh_token = (leave empty, will be set after login)
```

### 3. Test Authentication

#### Patient Flow (OTP-based)

1. Send OTP: `POST /patient-auth/send-otp` with phone number
2. Check WhatsApp for OTP
3. Verify OTP: `POST /patient-auth/verify-otp` with phone and OTP
4. Copy `accessToken` from response to environment variable

#### Staff Flow (Username/Password)

1. Login: `POST /auth/login/username-password`
   ```json
   {
     "username": "admin",
     "password": "your_password"
   }
   ```
2. Copy `accessToken` from response to environment variable

### 4. Test Your First API Call

```
GET /centres
```

No authentication required. Should return list of centres.

### 5. Test Authenticated Endpoint

```
GET /appointments
```

Requires authentication. Should return appointments based on your role.

## Common Test Scenarios

### Scenario 1: Get Available Slots

```
GET /booking/available-slots?clinicianId=1&centreId=1&date=2024-12-25
```

Returns available time slots for booking.

### Scenario 2: Get Clinician List

```
GET /clinicians?centreId=1
```

Returns clinicians at specified centre.

### Scenario 3: Get Patient Dashboard

```
GET /patient/dashboard
```

Requires patient authentication. Returns dashboard overview.

## Rate Limits

- Global: 100 requests/minute/IP
- Authentication: 5 requests/minute/IP

Exceeding limits returns 429 status.

## Response Format

Success:

```json
{
  "success": true,
  "data": { ... }
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Description"
  }
}
```

## Status Codes

- 200: Success
- 201: Created
- 400: Validation error
- 401: Unauthorized (invalid/expired token)
- 403: Forbidden (insufficient permissions)
- 404: Not found
- 429: Rate limit exceeded
- 500: Server error

## Next Steps

1. Read WORKFLOWS.md for complete integration flows
2. Check API_REFERENCE.md for all available endpoints
3. Review ARCHITECTURE.md to understand system design

## Troubleshooting

### 401 Unauthorized

- Token expired: Use refresh token endpoint
- Invalid token: Re-authenticate
- Missing token: Add Authorization header

### 403 Forbidden

- Check user role has permission for endpoint
- Verify endpoint allows your role in API_REFERENCE.md

### 429 Rate Limit

- Wait 1 minute
- Implement exponential backoff in your code

### 500 Server Error

- Check request body format
- Verify all required fields present
- Contact support if issue persists

## Testing Tips

1. Start with public endpoints (centres, clinicians)
2. Test authentication before other endpoints
3. Save commonly used IDs (clinician_id, centre_id) in environment
4. Use Postman environment variables for reusable data
5. Check response for proper error messages

## Support

Technical documentation: See other files in this folder
API issues: tech@mibo.care
