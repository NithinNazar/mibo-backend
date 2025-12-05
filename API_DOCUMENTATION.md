# Mibo Backend - API Documentation

## Base URL

```
Development: http://localhost:5000/api
Production: https://api.mibo.com/api
```

## Authentication

Most endpoints require authentication. Include the JWT access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }  // Optional, for validation errors
  }
}
```

## HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request format
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate)
- `422 Unprocessable Entity` - Validation failed
- `500 Internal Server Error` - Server error

---

## 🔐 Authentication Endpoints

### Send OTP

Send OTP to staff user's phone number.

**Endpoint**: `POST /auth/send-otp`

**Request Body**:

```json
{
  "phone": "9876543210"
}
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "message": "OTP sent successfully"
  }
}
```

**Notes**:

- Phone must be 10 digits
- OTP is valid for 10 minutes
- In development, OTP is logged to console
- Only works for STAFF users

---

### Login with Phone + OTP

Authenticate using phone number and OTP.

**Endpoint**: `POST /auth/login/phone-otp`

**Request Body**:

```json
{
  "phone": "9876543210",
  "otp": "123456"
}
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "1",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "username": "johndoe",
      "role": "ADMIN",
      "avatar": null,
      "centreIds": ["1", "2"],
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

**Errors**:

- `403 Forbidden` - Patient users cannot access admin panel
- `400 Bad Request` - Invalid or expired OTP
- `422 Unprocessable Entity` - Validation failed

---

### Login with Phone + Password

Authenticate using phone number and password.

**Endpoint**: `POST /auth/login/phone-password`

**Request Body**:

```json
{
  "phone": "9876543210",
  "password": "securePassword123"
}
```

**Response**: `200 OK` (same as phone+OTP)

**Errors**:

- `401 Unauthorized` - Invalid credentials
- `403 Forbidden` - Patient users cannot access

---

### Login with Username + Password

Authenticate using username and password.

**Endpoint**: `POST /auth/login/username-password`

**Request Body**:

```json
{
  "username": "johndoe",
  "password": "securePassword123"
}
```

**Response**: `200 OK` (same as phone+OTP)

---

### Refresh Access Token

Get a new access token using refresh token.

**Endpoint**: `POST /auth/refresh`

**Request Body**:

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errors**:

- `401 Unauthorized` - Invalid or expired refresh token

---

### Logout

Revoke refresh token and logout user.

**Endpoint**: `POST /auth/logout`

**Authentication**: Required

**Request Body**:

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

### Get Current User

Get authenticated user's details.

**Endpoint**: `GET /auth/me`

**Authentication**: Required

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "1",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "username": "johndoe",
      "role": "ADMIN",
      "avatar": null,
      "centreIds": ["1", "2"],
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

## 📊 Analytics Endpoints

### Get Dashboard Metrics

Get dashboard metrics with percentage changes.

**Endpoint**: `GET /analytics/dashboard`

**Authentication**: Required

**Permissions**: ADMIN, MANAGER, CENTRE_MANAGER

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "totalPatients": 150,
    "totalPatientsChange": 12.5,
    "activeDoctors": 25,
    "activeDoctorsChange": 4.2,
    "followUpsBooked": 45,
    "followUpsBookedChange": -8.3,
    "totalRevenue": 125000,
    "totalRevenueChange": 15.7
  }
}
```

---

### Get Top Doctors

Get top performing doctors by completed appointments.

**Endpoint**: `GET /analytics/top-doctors`

**Authentication**: Required

**Permissions**: ADMIN, MANAGER, CENTRE_MANAGER

**Query Parameters**:

- `limit` (optional): Number of doctors to return (default: 10)
- `centreId` (optional): Filter by centre

**Response**: `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Dr. John Doe",
      "specialty": "Psychiatrist",
      "avatar": null,
      "patientCount": 45
    },
    {
      "id": "2",
      "name": "Dr. Jane Smith",
      "specialty": "Psychologist",
      "avatar": "https://...",
      "patientCount": 38
    }
  ]
}
```

---

### Get Revenue Data

Get revenue time series data.

**Endpoint**: `GET /analytics/revenue`

**Authentication**: Required

**Permissions**: ADMIN, MANAGER, CENTRE_MANAGER

**Query Parameters**:

- `period` (required): `week`, `month`, or `year`
- `centreId` (optional): Filter by centre

**Response**: `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-01",
      "value": 5000
    },
    {
      "date": "2024-01-02",
      "value": 6500
    }
  ]
}
```

---

### Get Leads by Source

Get appointment distribution by source.

**Endpoint**: `GET /analytics/leads-by-source`

**Authentication**: Required

**Permissions**: ADMIN, MANAGER, CENTRE_MANAGER

**Query Parameters**:

- `centreId` (optional): Filter by centre

**Response**: `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "label": "Website",
      "value": 120,
      "color": "#3b82f6"
    },
    {
      "label": "Phone",
      "value": 85,
      "color": "#10b981"
    },
    {
      "label": "Direct",
      "value": 45,
      "color": "#f59e0b"
    },
    {
      "label": "Referrals",
      "value": 30,
      "color": "#8b5cf6"
    }
  ]
}
```

---

## 🏥 Centre Endpoints

### Get All Centres

Get list of all centres.

**Endpoint**: `GET /centres`

**Authentication**: Required

**Query Parameters**:

- `city` (optional): Filter by city (`bangalore`, `kochi`, `mumbai`)

**Response**: `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Mibo Bangalore Centre",
      "city": "bangalore",
      "address": "123 MG Road, Near Metro Station",
      "pincode": "560001",
      "phone": "9876543210",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Get Centre by ID

Get specific centre details.

**Endpoint**: `GET /centres/:id`

**Authentication**: Required

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "1",
    "name": "Mibo Bangalore Centre",
    "city": "bangalore",
    "address": "123 MG Road, Near Metro Station",
    "pincode": "560001",
    "phone": "9876543210",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errors**:

- `404 Not Found` - Centre not found

---

### Create Centre

Create a new centre.

**Endpoint**: `POST /centres`

**Authentication**: Required

**Permissions**: ADMIN only

**Request Body**:

```json
{
  "name": "Mibo Bangalore Centre",
  "city": "bangalore",
  "addressLine1": "123 MG Road",
  "addressLine2": "Near Metro Station",
  "pincode": "560001",
  "contactPhone": "9876543210"
}
```

**Validation Rules**:

- `name`: 3-150 characters, required
- `city`: Must be `bangalore`, `kochi`, or `mumbai`, required
- `addressLine1`: Max 255 characters, required
- `addressLine2`: Max 255 characters, optional
- `pincode`: 6 digits, required
- `contactPhone`: 10 digits, required

**Response**: `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "1",
    "name": "Mibo Bangalore Centre",
    "city": "bangalore",
    "address": "123 MG Road, Near Metro Station",
    "pincode": "560001",
    "phone": "9876543210",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Centre created successfully"
}
```

**Errors**:

- `422 Unprocessable Entity` - Validation failed
- `403 Forbidden` - Insufficient permissions

---

### Update Centre

Update an existing centre.

**Endpoint**: `PUT /centres/:id`

**Authentication**: Required

**Permissions**: ADMIN, CENTRE_MANAGER

**Request Body** (all fields optional):

```json
{
  "name": "Updated Centre Name",
  "city": "bangalore",
  "addressLine1": "New Address",
  "addressLine2": "New Address Line 2",
  "pincode": "560002",
  "contactPhone": "9876543211"
}
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "1",
    "name": "Updated Centre Name",
    "city": "bangalore",
    "address": "New Address, New Address Line 2",
    "pincode": "560002",
    "phone": "9876543211",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  },
  "message": "Centre updated successfully"
}
```

**Errors**:

- `404 Not Found` - Centre not found
- `422 Unprocessable Entity` - Validation failed
- `403 Forbidden` - Insufficient permissions

---

### Delete Centre

Delete (soft delete) a centre.

**Endpoint**: `DELETE /centres/:id`

**Authentication**: Required

**Permissions**: ADMIN only

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "message": "Centre deleted successfully"
  }
}
```

**Errors**:

- `404 Not Found` - Centre not found
- `403 Forbidden` - Insufficient permissions

---

## 🏥 Health Check

### System Health

Check system health and status.

**Endpoint**: `GET /health`

**Authentication**: Not required

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "database": "connected",
    "version": "1.0.0",
    "environment": "development",
    "uptime": 3600
  }
}
```

---

## 🔒 Role-Based Access Control

### Roles and Permissions

| Role             | Description              | Permissions                                    |
| ---------------- | ------------------------ | ---------------------------------------------- |
| ADMIN            | System administrator     | Full access to all endpoints and all centres   |
| MANAGER          | Multi-centre manager     | View all bookings, analytics for all centres   |
| CENTRE_MANAGER   | Single centre manager    | Manage assigned centre, clinicians, bookings   |
| CLINICIAN        | Doctor/Therapist         | View own appointments only                     |
| CARE_COORDINATOR | Patient flow coordinator | Manage appointments for assigned centre        |
| FRONT_DESK       | Reception staff          | Book and view appointments for assigned centre |

### Permission Matrix

| Endpoint      | ADMIN | MANAGER | CENTRE_MANAGER  | CLINICIAN | CARE_COORDINATOR | FRONT_DESK |
| ------------- | ----- | ------- | --------------- | --------- | ---------------- | ---------- |
| Analytics     | ✅    | ✅      | ✅ (own centre) | ❌        | ❌               | ❌         |
| Create Centre | ✅    | ❌      | ❌              | ❌        | ❌               | ❌         |
| Update Centre | ✅    | ❌      | ✅ (own centre) | ❌        | ❌               | ❌         |
| Delete Centre | ✅    | ❌      | ❌              | ❌        | ❌               | ❌         |
| View Centres  | ✅    | ✅      | ✅              | ✅        | ✅               | ✅         |

---

## 📝 Common Patterns

### Pagination (Future)

```
GET /resource?page=1&limit=20
```

Response includes:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Filtering

```
GET /resource?field=value&status=active
```

### Sorting

```
GET /resource?sortBy=createdAt&order=desc
```

### Search

```
GET /resource?search=keyword
```

---

## 🚨 Error Codes

| Code                     | HTTP Status | Description                          |
| ------------------------ | ----------- | ------------------------------------ |
| BAD_REQUEST              | 400         | Invalid request format or parameters |
| UNAUTHORIZED             | 401         | Missing or invalid authentication    |
| FORBIDDEN                | 403         | Insufficient permissions             |
| NOT_FOUND                | 404         | Resource not found                   |
| CONFLICT                 | 409         | Resource conflict (duplicate)        |
| VALIDATION_ERROR         | 422         | Input validation failed              |
| INTERNAL_ERROR           | 500         | Server error                         |
| SERVICE_UNAVAILABLE      | 503         | External service unavailable         |
| AUTH_RATE_LIMIT_EXCEEDED | 429         | Too many auth attempts               |
| RATE_LIMIT_EXCEEDED      | 429         | Too many requests                    |

---

## 📚 Examples

### Complete Authentication Flow

```bash
# 1. Send OTP
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210"}'

# 2. Login with OTP (check console for OTP in development)
curl -X POST http://localhost:5000/api/auth/login/phone-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210","otp":"123456"}'

# Save the accessToken and refreshToken from response

# 3. Use access token for authenticated requests
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 4. Refresh token when access token expires
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'

# 5. Logout
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

### Centre Management Flow

```bash
# Get all centres
curl http://localhost:5000/api/centres \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Create centre (ADMIN only)
curl -X POST http://localhost:5000/api/centres \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mibo Bangalore Centre",
    "city": "bangalore",
    "addressLine1": "123 MG Road",
    "addressLine2": "Near Metro Station",
    "pincode": "560001",
    "contactPhone": "9876543210"
  }'

# Update centre
curl -X PUT http://localhost:5000/api/centres/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name"}'

# Delete centre
curl -X DELETE http://localhost:5000/api/centres/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🔄 Rate Limiting

- **Global**: 100 requests per minute per IP
- **Authentication**: 5 requests per minute per IP

When rate limit is exceeded:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later"
  }
}
```

---

## 📞 Support

For API support:

- Check this documentation
- Check `DEVELOPER_GUIDE.md`
- Check `README.md`
- Contact development team

---

**Last Updated**: December 5, 2024  
**API Version**: 1.0.0  
**Base URL**: http://localhost:5000/api
