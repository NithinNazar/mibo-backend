# Backend API Documentation

## Overview

**Project**: Mibo Mental Health Clinic Booking System  
**Architecture**: Monolithic REST API  
**Base URL**: `http://localhost:5000/api` (Development) | `https://your-domain.com/api` (Production)  
**Version**: 1.0.0  
**Database**: PostgreSQL  
**Authentication**: JWT (JSON Web Tokens)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Patient Authentication](#patient-authentication)
3. [Appointments](#appointments)
4. [Booking](#booking)
5. [Staff Management](#staff-management)
6. [Clinicians](#clinicians)
7. [Patients](#patients)
8. [Centres](#centres)
9. [Payments](#payments)
10. [Video Conferencing](#video-conferencing)
11. [Analytics](#analytics)
12. [Notifications](#notifications)
13. [Patient Dashboard](#patient-dashboard)
14. [Error Handling](#error-handling)
15. [Rate Limiting](#rate-limiting)

---

## Authentication

### Overview

Staff authentication system supporting multiple login methods (phone + OTP, phone + password, username + password).

### Base Path: `/api/auth`

#### 1. Send OTP

```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "phone": "+919876543210"
}
```

**Response (200)**:

```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "phone": "+919876543210",
    "expiresIn": 300
  }
}
```

---

#### 2. Login with Phone + OTP

```http
POST /api/auth/login/phone-otp
Content-Type: application/json

{
  "phone": "+919876543210",
  "otp": "123456"
}
```

**Response (200)**:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "fullName": "Dr. John Doe",
      "phone": "+919876543210",
      "email": "john@example.com",
      "roleId": 3,
      "roleName": "CLINICIAN"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### 3. Login with Phone + Password

```http
POST /api/auth/login/phone-password
Content-Type: application/json

{
  "phone": "+919876543210",
  "password": "SecurePassword123"
}
```

---

#### 4. Login with Username + Password

```http
POST /api/auth/login/username-password
Content-Type: application/json

{
  "username": "johndoe",
  "password": "SecurePassword123"
}
```

---

#### 5. Refresh Token

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### 6. Logout

```http
POST /api/auth/logout
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

#### 7. Get Current User

```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "fullName": "Dr. John Doe",
    "phone": "+919876543210",
    "email": "john@example.com",
    "roleId": 3,
    "roleName": "CLINICIAN",
    "isActive": true
  }
}
```

---

## Patient Authentication

### Overview

OTP-based authentication system for patients via WhatsApp (Gallabox).

### Base Path: `/api/patient-auth`

#### 1. Send OTP

```http
POST /api/patient-auth/send-otp
Content-Type: application/json

{
  "phone": "+919876543210",
  "fullName": "Jane Smith"
}
```

**Response (200)**:

```json
{
  "success": true,
  "message": "OTP sent successfully via WhatsApp",
  "data": {
    "phone": "+919876543210",
    "expiresIn": 300
  }
}
```

---

#### 2. Verify OTP (Login/Signup)

```http
POST /api/patient-auth/verify-otp
Content-Type: application/json

{
  "phone": "+919876543210",
  "otp": "123456"
}
```

**Response (200)**:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "patient": {
      "id": 1,
      "fullName": "Jane Smith",
      "phone": "+919876543210",
      "email": null,
      "isNewUser": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### 3. Refresh Token

```http
POST /api/patient-auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

#### 4. Logout

```http
POST /api/patient-auth/logout
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

#### 5. Get Current Patient

```http
GET /api/patient-auth/me
Authorization: Bearer <access_token>
```

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "fullName": "Jane Smith",
    "phone": "+919876543210",
    "email": "jane@example.com",
    "dateOfBirth": "1990-05-15",
    "gender": "FEMALE",
    "bloodGroup": "O+",
    "emergencyContactName": "John Smith",
    "emergencyContactPhone": "+919876543211"
  }
}
```

---

## Appointments

### Overview

Appointment management for staff with role-based access control.

### Base Path: `/api/appointments`

#### 1. Get Appointments (with filters)

```http
GET /api/appointments?centreId=1&clinicianId=5&status=CONFIRMED&date=2024-03-15
Authorization: Bearer <access_token>
```

**Query Parameters**:

- `centreId` (optional): Filter by centre
- `clinicianId` (optional): Filter by clinician
- `patientId` (optional): Filter by patient
- `date` (optional): Filter by date (YYYY-MM-DD)
- `status` (optional): PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW

**Response (200)**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "patientId": 10,
      "patientName": "Jane Smith",
      "clinicianId": 5,
      "clinicianName": "Dr. John Doe",
      "centreId": 1,
      "centreName": "Mibo Bangalore",
      "appointmentDate": "2024-03-15",
      "appointmentTime": "10:00:00",
      "sessionType": "ONLINE",
      "status": "CONFIRMED",
      "consultationFee": 1500,
      "paymentStatus": "PAID"
    }
  ]
}
```

---

#### 2. Get My Appointments (Clinician)

```http
GET /api/appointments/my-appointments
Authorization: Bearer <access_token>
```

**Roles**: CLINICIAN only

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "current": [],
    "upcoming": [
      {
        "id": 1,
        "patientName": "Jane Smith",
        "appointmentDate": "2024-03-15",
        "appointmentTime": "10:00:00",
        "sessionType": "ONLINE",
        "status": "CONFIRMED"
      }
    ],
    "past": []
  }
}
```

---

#### 3. Get Appointment by ID

```http
GET /api/appointments/123
Authorization: Bearer <access_token>
```

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "id": 123,
    "patientId": 10,
    "patientName": "Jane Smith",
    "patientPhone": "+919876543210",
    "clinicianId": 5,
    "clinicianName": "Dr. John Doe",
    "centreId": 1,
    "centreName": "Mibo Bangalore",
    "appointmentDate": "2024-03-15",
    "appointmentTime": "10:00:00",
    "sessionType": "ONLINE",
    "status": "CONFIRMED",
    "consultationFee": 1500,
    "paymentStatus": "PAID",
    "meetLink": "https://meet.google.com/abc-defg-hij",
    "notes": "First consultation"
  }
}
```

---

#### 4. Create Appointment

```http
POST /api/appointments
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "patientId": 10,
  "clinicianId": 5,
  "centreId": 1,
  "appointmentDate": "2024-03-15",
  "appointmentTime": "10:00:00",
  "sessionType": "ONLINE",
  "consultationFee": 1500,
  "notes": "First consultation"
}
```

**Roles**: ADMIN, MANAGER, CENTRE_MANAGER, CARE_COORDINATOR, FRONT_DESK

**Response (201)**:

```json
{
  "success": true,
  "message": "Appointment created successfully",
  "data": {
    "id": 123,
    "appointmentDate": "2024-03-15",
    "appointmentTime": "10:00:00",
    "status": "PENDING",
    "paymentLink": "https://razorpay.com/payment-link/xyz"
  }
}
```

---

#### 5. Update Appointment (Reschedule)

```http
PUT /api/appointments/123
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "appointmentDate": "2024-03-16",
  "appointmentTime": "14:00:00",
  "status": "CONFIRMED"
}
```

**Roles**: ADMIN, MANAGER, CENTRE_MANAGER, CARE_COORDINATOR

---

#### 6. Cancel Appointment

```http
DELETE /api/appointments/123
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "reason": "Patient requested cancellation"
}
```

**Roles**: ADMIN, MANAGER, CENTRE_MANAGER, CARE_COORDINATOR, FRONT_DESK

---

#### 7. Get Clinician Availability

```http
GET /api/appointments/availability?clinician_id=5&centre_id=1&date=2024-03-15
Authorization: Bearer <access_token>
```

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "availableSlots": [
      "09:00:00",
      "10:00:00",
      "11:00:00",
      "14:00:00",
      "15:00:00"
    ]
  }
}
```

---

## Booking

### Overview

Patient-facing booking flow for creating appointments.

### Base Path: `/api/booking`

#### 1. Create Appointment (Patient)

```http
POST /api/booking/create
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "clinicianId": 5,
  "centreId": 1,
  "appointmentDate": "2024-03-15",
  "appointmentTime": "10:00:00",
  "sessionType": "ONLINE",
  "consultationFee": 1500
}
```

**Response (201)**:

```json
{
  "success": true,
  "message": "Appointment created successfully",
  "data": {
    "appointmentId": 123,
    "paymentOrderId": "order_xyz123",
    "amount": 1500
  }
}
```

---

#### 2. Get My Appointments (Patient)

```http
GET /api/booking/my-appointments
Authorization: Bearer <access_token>
```

**Response (200)**:

```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "clinicianName": "Dr. John Doe",
      "centreName": "Mibo Bangalore",
      "appointmentDate": "2024-03-15",
      "appointmentTime": "10:00:00",
      "sessionType": "ONLINE",
      "status": "CONFIRMED",
      "paymentStatus": "PAID",
      "meetLink": "https://meet.google.com/abc-defg-hij"
    }
  ]
}
```

---

#### 3. Get Appointment Details

```http
GET /api/booking/123
Authorization: Bearer <access_token>
```

---

#### 4. Cancel Appointment

```http
POST /api/booking/123/cancel
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "reason": "Unable to attend"
}
```

---

#### 5. Get Available Slots

```http
GET /api/booking/available-slots?clinicianId=5&centreId=1&date=2024-03-15
```

**Public endpoint** (no authentication required)

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "date": "2024-03-15",
    "availableSlots": [
      {
        "time": "09:00:00",
        "available": true
      },
      {
        "time": "10:00:00",
        "available": false
      },
      {
        "time": "11:00:00",
        "available": true
      }
    ]
  }
}
```

---

#### 6. Book for Patient (Front Desk)

```http
POST /api/booking/front-desk
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "patientPhone": "+919876543210",
  "patientName": "Jane Smith",
  "clinicianId": 5,
  "centreId": 1,
  "appointmentDate": "2024-03-15",
  "appointmentTime": "10:00:00",
  "sessionType": "IN_PERSON",
  "consultationFee": 1500
}
```

**Roles**: FRONT_DESK, ADMIN, MANAGER

---

## Staff Management

### Overview

Manage staff users (managers, care coordinators, front desk, etc.).

### Base Path: `/api/users`

#### 1. Get Staff Users

```http
GET /api/users?roleId=2&centreId=1
Authorization: Bearer <access_token>
```

**Roles**: ADMIN only

**Query Parameters**:

- `roleId` (optional): Filter by role
- `centreId` (optional): Filter by centre

**Response (200)**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "fullName": "John Manager",
      "phone": "+919876543210",
      "email": "john@example.com",
      "roleId": 2,
      "roleName": "MANAGER",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

#### 2. Get Staff by ID

```http
GET /api/users/1
Authorization: Bearer <access_token>
```

**Roles**: ADMIN only

---

#### 3. Create Staff User

```http
POST /api/users
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "fullName": "John Manager",
  "phone": "+919876543210",
  "email": "john@example.com",
  "password": "SecurePassword123",
  "roleId": 2,
  "centreId": 1
}
```

**Roles**: ADMIN only

---

#### 4. Update Staff User

```http
PUT /api/users/1
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "fullName": "John Updated",
  "email": "johnupdated@example.com",
  "isActive": true
}
```

**Roles**: ADMIN only

---

#### 5. Delete Staff User (Soft Delete)

```http
DELETE /api/users/1
Authorization: Bearer <access_token>
```

**Roles**: ADMIN only

---

#### 6. Toggle Staff Active Status

```http
PATCH /api/users/1/toggle-active
Authorization: Bearer <access_token>
```

**Roles**: ADMIN, MANAGER

---

#### 7. Create Manager

```http
POST /api/users/managers
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "fullName": "Jane Manager",
  "phone": "+919876543211",
  "email": "jane@example.com",
  "password": "SecurePassword123"
}
```

**Roles**: ADMIN only

---

#### 8. Create Centre Manager

```http
POST /api/users/centre-managers
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "fullName": "Bob Centre Manager",
  "phone": "+919876543212",
  "email": "bob@example.com",
  "password": "SecurePassword123",
  "centreId": 1
}
```

**Roles**: ADMIN only

---

#### 9. Create Care Coordinator

```http
POST /api/users/care-coordinators
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "fullName": "Alice Coordinator",
  "phone": "+919876543213",
  "email": "alice@example.com",
  "password": "SecurePassword123",
  "centreId": 1
}
```

**Roles**: ADMIN only

---

#### 10. Create Front Desk Staff

```http
POST /api/users/front-desk
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "fullName": "Charlie Front Desk",
  "phone": "+919876543214",
  "email": "charlie@example.com",
  "password": "SecurePassword123",
  "centreId": 1
}
```

**Roles**: ADMIN, MANAGER

---

## Clinicians

### Overview

Manage clinician profiles, availability, and specializations.

### Base Path: `/api/clinicians`

#### 1. Get Clinicians (Public)

```http
GET /api/clinicians?centreId=1&specialization=Clinical%20Psychologist
```

**Public endpoint** (no authentication required)

**Query Parameters**:

- `centreId` (optional): Filter by centre
- `specialization` (optional): Filter by specialization

**Response (200)**:

```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "userId": 10,
      "fullName": "Dr. John Doe",
      "specialization": ["Clinical Psychologist", "Therapist"],
      "qualification": ["PhD Psychology", "M.Phil Clinical Psychology"],
      "yearsOfExperience": 10,
      "consultationFee": 1500,
      "languages": ["English", "Hindi", "Kannada"],
      "profilePictureUrl": "https://example.com/profile.jpg",
      "isActive": true
    }
  ]
}
```

---

#### 2. Get Clinician by ID (Public)

```http
GET /api/clinicians/5
```

**Public endpoint** (no authentication required)

---

#### 3. Create Clinician

```http
POST /api/clinicians
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "fullName": "Dr. Jane Smith",
  "phone": "+919876543215",
  "email": "jane.smith@example.com",
  "password": "SecurePassword123",
  "primaryCentreId": 1,
  "specialization": ["Clinical Psychologist"],
  "qualification": ["PhD Psychology"],
  "yearsOfExperience": 8,
  "consultationFee": 1500,
  "languages": ["English", "Hindi"],
  "profilePictureUrl": "https://example.com/jane.jpg",
  "defaultConsultationDurationMinutes": 60
}
```

**Roles**: ADMIN, MANAGER, CENTRE_MANAGER

**Response (201)**:

```json
{
  "success": true,
  "message": "Clinician created successfully",
  "data": {
    "id": 6,
    "userId": 11,
    "fullName": "Dr. Jane Smith"
  }
}
```

---

#### 4. Update Clinician

```http
PUT /api/clinicians/5
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "specialization": ["Clinical Psychologist", "Child Psychologist"],
  "consultationFee": 1800,
  "yearsOfExperience": 11
}
```

**Roles**: ADMIN, MANAGER, CENTRE_MANAGER

---

#### 5. Delete Clinician (Soft Delete)

```http
DELETE /api/clinicians/5
Authorization: Bearer <access_token>
```

**Roles**: ADMIN, MANAGER, CENTRE_MANAGER

---

#### 6. Toggle Clinician Active Status

```http
PATCH /api/clinicians/5/toggle-active
Authorization: Bearer <access_token>
```

**Roles**: ADMIN, MANAGER, CENTRE_MANAGER

---

#### 7. Update Clinician Availability

```http
PUT /api/clinicians/5/availability
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "availabilityRules": [
    {
      "dayOfWeek": "MONDAY",
      "startTime": "09:00:00",
      "endTime": "17:00:00",
      "isAvailable": true
    },
    {
      "dayOfWeek": "TUESDAY",
      "startTime": "09:00:00",
      "endTime": "17:00:00",
      "isAvailable": true
    }
  ]
}
```

**Roles**: ADMIN, MANAGER, CENTRE_MANAGER

---

#### 8. Get Clinician Availability (Public)

```http
GET /api/clinicians/5/availability
```

**Public endpoint** (no authentication required)

**Response (200)**:

```json
{
  "success": true,
  "data": [
    {
      "dayOfWeek": "MONDAY",
      "startTime": "09:00:00",
      "endTime": "17:00:00",
      "isAvailable": true
    },
    {
      "dayOfWeek": "TUESDAY",
      "startTime": "09:00:00",
      "endTime": "17:00:00",
      "isAvailable": true
    }
  ]
}
```

---

## Patients

### Overview

Manage patient records and medical history (staff access only).

### Base Path: `/api/patients`

#### 1. Get Patients

```http
GET /api/patients?search=Jane&phone=9876543210
Authorization: Bearer <access_token>
```

**Roles**: ADMIN, MANAGER, CENTRE_MANAGER, CARE_COORDINATOR, FRONT_DESK

**Query Parameters**:

- `search` (optional): Search by name
- `phone` (optional): Search by phone

**Response (200)**:

```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "fullName": "Jane Smith",
      "phone": "+919876543210",
      "email": "jane@example.com",
      "dateOfBirth": "1990-05-15",
      "gender": "FEMALE",
      "bloodGroup": "O+",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

#### 2. Get Patient by ID

```http
GET /api/patients/10
Authorization: Bearer <access_token>
```

**Roles**: ADMIN, MANAGER, CENTRE_MANAGER, CARE_COORDINATOR, FRONT_DESK, CLINICIAN

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "id": 10,
    "fullName": "Jane Smith",
    "phone": "+919876543210",
    "email": "jane@example.com",
    "dateOfBirth": "1990-05-15",
    "gender": "FEMALE",
    "bloodGroup": "O+",
    "emergencyContactName": "John Smith",
    "emergencyContactPhone": "+919876543211",
    "medicalHistory": "No known allergies",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

#### 3. Create Patient

```http
POST /api/patients
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "fullName": "Jane Smith",
  "phone": "+919876543210",
  "email": "jane@example.com",
  "dateOfBirth": "1990-05-15",
  "gender": "FEMALE",
  "bloodGroup": "O+",
  "emergencyContactName": "John Smith",
  "emergencyContactPhone": "+919876543211"
}
```

**Roles**: ADMIN, MANAGER, CENTRE_MANAGER, CARE_COORDINATOR, FRONT_DESK

---

#### 4. Update Patient

```http
PUT /api/patients/10
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "email": "janeupdated@example.com",
  "bloodGroup": "A+"
}
```

**Roles**: ADMIN, MANAGER, CENTRE_MANAGER, CARE_COORDINATOR, FRONT_DESK

---

#### 5. Get Patient Appointments

```http
GET /api/patients/10/appointments
Authorization: Bearer <access_token>
```

**Roles**: ADMIN, MANAGER, CENTRE_MANAGER, CARE_COORDINATOR, FRONT_DESK, CLINICIAN

**Response (200)**:

```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "clinicianName": "Dr. John Doe",
      "appointmentDate": "2024-03-15",
      "appointmentTime": "10:00:00",
      "status": "COMPLETED",
      "sessionType": "ONLINE"
    }
  ]
}
```

---

#### 6. Add Medical Note

```http
POST /api/patients/10/notes
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "note": "Patient shows improvement in anxiety symptoms",
  "appointmentId": 123
}
```

**Roles**: CLINICIAN, ADMIN

---

## Centres

### Overview

Manage clinic centres/locations.

### Base Path: `/api/centres`

#### 1. Get Centres

```http
GET /api/centres?city=bangalore
Authorization: Bearer <access_token>
```

**Query Parameters**:

- `city` (optional): Filter by city

**Response (200)**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Mibo Bangalore",
      "city": "Bangalore",
      "address": "123 MG Road, Bangalore",
      "phone": "+918012345678",
      "email": "bangalore@mibo.com",
      "isActive": true
    }
  ]
}
```

---

#### 2. Get Centre by ID

```http
GET /api/centres/1
Authorization: Bearer <access_token>
```

---

#### 3. Create Centre

```http
POST /api/centres
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Mibo Mumbai",
  "city": "Mumbai",
  "address": "456 Marine Drive, Mumbai",
  "phone": "+912212345678",
  "email": "mumbai@mibo.com"
}
```

**Roles**: ADMIN, MANAGER

---

#### 4. Update Centre

```http
PUT /api/centres/1
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "phone": "+918012345679",
  "email": "bangalore.updated@mibo.com"
}
```

**Roles**: ADMIN, MANAGER, CENTRE_MANAGER

---

#### 5. Delete Centre

```http
DELETE /api/centres/1
Authorization: Bearer <access_token>
```

**Roles**: ADMIN only

---

#### 6. Toggle Centre Active Status

```http
PATCH /api/centres/1/toggle-active
Authorization: Bearer <access_token>
```

**Roles**: ADMIN, MANAGER

---

## Payments

### Overview

Payment processing via Razorpay with automatic payment link generation.

### Base Path: `/api/payments`

#### 1. Create Payment Order

```http
POST /api/payments/create-order
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "appointmentId": 123,
  "amount": 1500
}
```

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "orderId": "order_xyz123",
    "amount": 1500,
    "currency": "INR",
    "razorpayKeyId": "rzp_test_xxxxx"
  }
}
```

---

#### 2. Verify Payment

```http
POST /api/payments/verify
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "razorpayOrderId": "order_xyz123",
  "razorpayPaymentId": "pay_abc456",
  "razorpaySignature": "signature_hash",
  "appointmentId": 123
}
```

**Response (200)**:

```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "paymentId": "pay_abc456",
    "status": "PAID"
  }
}
```

---

#### 3. Razorpay Webhook

```http
POST /api/payments/webhook
Content-Type: application/json
X-Razorpay-Signature: <signature>

{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_abc456",
        "order_id": "order_xyz123",
        "status": "captured"
      }
    }
  }
}
```

**Public endpoint** (verified by signature)

---

#### 4. Get Payment Details

```http
GET /api/payments/123
Authorization: Bearer <access_token>
```

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "appointmentId": 123,
    "amount": 1500,
    "status": "PAID",
    "paymentMethod": "UPI",
    "transactionId": "pay_abc456",
    "paidAt": "2024-03-15T10:30:00Z"
  }
}
```

---

#### 5. Get Payment History

```http
GET /api/payments/history
Authorization: Bearer <access_token>
```

**Response (200)**:

```json
{
  "success": true,
  "data": [
    {
      "appointmentId": 123,
      "clinicianName": "Dr. John Doe",
      "amount": 1500,
      "status": "PAID",
      "paidAt": "2024-03-15T10:30:00Z"
    }
  ]
}
```

---

#### 6. Create Payment Link

```http
POST /api/payments/create-link
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "appointmentId": 123,
  "amount": 1500,
  "customerName": "Jane Smith",
  "customerPhone": "+919876543210",
  "customerEmail": "jane@example.com"
}
```

**Roles**: ADMIN, MANAGER, FRONT_DESK, CARE_COORDINATOR

**Response (200)**:

```json
{
  "success": true,
  "message": "Payment link created and sent via WhatsApp",
  "data": {
    "paymentLinkId": "plink_xyz789",
    "shortUrl": "https://rzp.io/i/abc123",
    "expiresAt": "2024-03-16T10:00:00Z"
  }
}
```

---

#### 7. Verify Payment Link

```http
GET /api/payments/verify/plink_xyz789
Authorization: Bearer <access_token>
```

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "paymentLinkId": "plink_xyz789",
    "status": "paid",
    "amountPaid": 1500
  }
}
```

---

## Video Conferencing

### Overview

Google Meet integration for online consultations.

### Base Path: `/api/video`

#### 1. Generate Meet Link

```http
POST /api/video/generate-meet-link
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "appointmentId": 123,
  "summary": "Consultation with Dr. John Doe",
  "startTime": "2024-03-15T10:00:00Z",
  "endTime": "2024-03-15T11:00:00Z"
}
```

**Roles**: ADMIN, MANAGER, CENTRE_MANAGER, CARE_COORDINATOR, FRONT_DESK

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "meetLink": "https://meet.google.com/abc-defg-hij",
    "eventId": "event_123"
  }
}
```

---

#### 2. Get Meet Link for Appointment

```http
GET /api/video/appointment/123/meet-link
Authorization: Bearer <access_token>
```

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "meetLink": "https://meet.google.com/abc-defg-hij"
  }
}
```

---

#### 3. Update Meet Link

```http
PUT /api/video/appointment/123/meet-link
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "meetLink": "https://meet.google.com/new-link-xyz"
}
```

**Roles**: ADMIN, MANAGER, CENTRE_MANAGER

---

#### 4. Delete Meet Link

```http
DELETE /api/video/appointment/123/meet-link
Authorization: Bearer <access_token>
```

**Roles**: ADMIN, MANAGER, CENTRE_MANAGER

---

#### 5. Get All Video Links

```http
GET /api/video/links?startDate=2024-03-01&endDate=2024-03-31&provider=google_meet
Authorization: Bearer <access_token>
```

**Roles**: ADMIN, MANAGER

**Response (200)**:

```json
{
  "success": true,
  "data": [
    {
      "appointmentId": 123,
      "meetLink": "https://meet.google.com/abc-defg-hij",
      "provider": "google_meet",
      "createdAt": "2024-03-15T09:00:00Z"
    }
  ]
}
```

---

## Analytics

### Overview

Dashboard metrics and analytics for management.

### Base Path: `/api/analytics`

**Roles**: ADMIN, MANAGER, CENTRE_MANAGER

#### 1. Get Dashboard Metrics

```http
GET /api/analytics/dashboard?centreId=1
Authorization: Bearer <access_token>
```

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "totalPatients": 1250,
    "totalDoctors": 25,
    "totalFollowUps": 150,
    "totalRevenue": 1875000,
    "appointmentsToday": 45,
    "appointmentsThisWeek": 280,
    "appointmentsThisMonth": 1100
  }
}
```

---

#### 2. Get Top Doctors

```http
GET /api/analytics/top-doctors?limit=10&centreId=1
Authorization: Bearer <access_token>
```

**Response (200)**:

```json
{
  "success": true,
  "data": [
    {
      "clinicianId": 5,
      "clinicianName": "Dr. John Doe",
      "totalAppointments": 150,
      "totalRevenue": 225000,
      "averageRating": 4.8
    }
  ]
}
```

---

#### 3. Get Revenue Data

```http
GET /api/analytics/revenue?period=month&centreId=1
Authorization: Bearer <access_token>
```

**Query Parameters**:

- `period`: day, week, month, year

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "period": "month",
    "totalRevenue": 1875000,
    "revenueByDate": [
      {
        "date": "2024-03-01",
        "revenue": 45000
      },
      {
        "date": "2024-03-02",
        "revenue": 52000
      }
    ]
  }
}
```

---

#### 4. Get Leads by Source

```http
GET /api/analytics/leads-by-source?centreId=1
Authorization: Bearer <access_token>
```

**Response (200)**:

```json
{
  "success": true,
  "data": [
    {
      "source": "Website",
      "count": 450,
      "percentage": 45
    },
    {
      "source": "WhatsApp",
      "count": 350,
      "percentage": 35
    },
    {
      "source": "Walk-in",
      "count": 200,
      "percentage": 20
    }
  ]
}
```

---

## Notifications

### Overview

WhatsApp notifications via Gallabox for appointment confirmations and reminders.

### Base Path: `/api/notifications`

#### 1. Send Appointment Confirmation

```http
POST /api/notifications/appointment-confirmation
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "appointmentId": 123
}
```

**Roles**: ADMIN, MANAGER, CENTRE_MANAGER, CARE_COORDINATOR, FRONT_DESK

**Response (200)**:

```json
{
  "success": true,
  "message": "Appointment confirmation sent successfully"
}
```

---

#### 2. Send Appointment Reminder

```http
POST /api/notifications/appointment-reminder
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "appointmentId": 123
}
```

**Roles**: ADMIN, MANAGER

---

#### 3. Get Notification History

```http
GET /api/notifications/history?patientId=10&notificationType=APPOINTMENT_CONFIRMATION&status=SENT
Authorization: Bearer <access_token>
```

**Roles**: ADMIN, MANAGER

**Query Parameters**:

- `patientId` (optional)
- `appointmentId` (optional)
- `notificationType` (optional): APPOINTMENT_CONFIRMATION, APPOINTMENT_REMINDER, PAYMENT_LINK
- `status` (optional): SENT, FAILED, PENDING
- `startDate` (optional)
- `endDate` (optional)
- `limit` (optional)

**Response (200)**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "patientId": 10,
      "appointmentId": 123,
      "notificationType": "APPOINTMENT_CONFIRMATION",
      "status": "SENT",
      "sentAt": "2024-03-15T10:00:00Z"
    }
  ]
}
```

---

#### 4. Get Notification Stats

```http
GET /api/notifications/stats?startDate=2024-03-01&endDate=2024-03-31
Authorization: Bearer <access_token>
```

**Roles**: ADMIN, MANAGER

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "totalSent": 1500,
    "totalFailed": 25,
    "successRate": 98.3,
    "byType": {
      "APPOINTMENT_CONFIRMATION": 800,
      "APPOINTMENT_REMINDER": 600,
      "PAYMENT_LINK": 100
    }
  }
}
```

---

#### 5. Get Notification by ID

```http
GET /api/notifications/1
Authorization: Bearer <access_token>
```

**Roles**: ADMIN, MANAGER, CENTRE_MANAGER

---

## Patient Dashboard

### Overview

Patient-facing dashboard for managing profile and appointments.

### Base Path: `/api/patient`

**All routes require patient authentication**

#### 1. Get Dashboard Overview

```http
GET /api/patient/dashboard
Authorization: Bearer <access_token>
```

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "upcomingAppointments": [
      {
        "id": 123,
        "clinicianName": "Dr. John Doe",
        "appointmentDate": "2024-03-15",
        "appointmentTime": "10:00:00",
        "sessionType": "ONLINE"
      }
    ],
    "recentPayments": [
      {
        "appointmentId": 122,
        "amount": 1500,
        "status": "PAID",
        "paidAt": "2024-03-10T10:30:00Z"
      }
    ],
    "totalAppointments": 15,
    "totalSpent": 22500
  }
}
```

---

#### 2. Get Appointments

```http
GET /api/patient/appointments
Authorization: Bearer <access_token>
```

**Response (200)**:

```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "clinicianName": "Dr. John Doe",
      "centreName": "Mibo Bangalore",
      "appointmentDate": "2024-03-15",
      "appointmentTime": "10:00:00",
      "sessionType": "ONLINE",
      "status": "CONFIRMED",
      "paymentStatus": "PAID",
      "meetLink": "https://meet.google.com/abc-defg-hij"
    }
  ]
}
```

---

#### 3. Get Payments

```http
GET /api/patient/payments
Authorization: Bearer <access_token>
```

**Response (200)**:

```json
{
  "success": true,
  "data": [
    {
      "appointmentId": 123,
      "clinicianName": "Dr. John Doe",
      "amount": 1500,
      "status": "PAID",
      "paymentMethod": "UPI",
      "paidAt": "2024-03-15T10:30:00Z"
    }
  ]
}
```

---

#### 4. Get Profile

```http
GET /api/patient/profile
Authorization: Bearer <access_token>
```

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "id": 10,
    "fullName": "Jane Smith",
    "phone": "+919876543210",
    "email": "jane@example.com",
    "dateOfBirth": "1990-05-15",
    "gender": "FEMALE",
    "bloodGroup": "O+",
    "emergencyContactName": "John Smith",
    "emergencyContactPhone": "+919876543211"
  }
}
```

---

#### 5. Update Profile

```http
PUT /api/patient/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "fullName": "Jane Smith Updated",
  "email": "janeupdated@example.com",
  "dateOfBirth": "1990-05-15",
  "gender": "FEMALE",
  "bloodGroup": "A+",
  "emergencyContactName": "John Smith",
  "emergencyContactPhone": "+919876543211"
}
```

**Response (200)**:

```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

---

#### 6. Cancel Appointment

```http
POST /api/patient/appointments/123/cancel
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "reason": "Unable to attend due to personal reasons"
}
```

**Response (200)**:

```json
{
  "success": true,
  "message": "Appointment cancellation requested"
}
```

---

## Error Handling

### Standard Error Response Format

All errors follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### HTTP Status Codes

| Status Code | Description                             |
| ----------- | --------------------------------------- |
| 200         | Success                                 |
| 201         | Created                                 |
| 400         | Bad Request (validation errors)         |
| 401         | Unauthorized (missing or invalid token) |
| 403         | Forbidden (insufficient permissions)    |
| 404         | Not Found                               |
| 409         | Conflict (duplicate resource)           |
| 429         | Too Many Requests (rate limit exceeded) |
| 500         | Internal Server Error                   |

### Common Error Codes

| Error Code            | Description                |
| --------------------- | -------------------------- |
| `VALIDATION_ERROR`    | Request validation failed  |
| `UNAUTHORIZED`        | Authentication required    |
| `FORBIDDEN`           | Insufficient permissions   |
| `NOT_FOUND`           | Resource not found         |
| `DUPLICATE_ENTRY`     | Resource already exists    |
| `INVALID_CREDENTIALS` | Invalid login credentials  |
| `TOKEN_EXPIRED`       | Access token expired       |
| `INVALID_TOKEN`       | Invalid or malformed token |
| `OTP_EXPIRED`         | OTP has expired            |
| `INVALID_OTP`         | Incorrect OTP              |
| `PAYMENT_FAILED`      | Payment processing failed  |
| `SLOT_UNAVAILABLE`    | Time slot not available    |

### Example Error Responses

**Validation Error (400)**:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "phone": "Phone number is required",
      "email": "Invalid email format"
    }
  }
}
```

**Unauthorized (401)**:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**Forbidden (403)**:

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You don't have permission to access this resource"
  }
}
```

**Not Found (404)**:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Appointment not found"
  }
}
```

---

## Rate Limiting

### Overview

API endpoints are rate-limited to prevent abuse.

### Limits

| Endpoint Type  | Limit        | Window     |
| -------------- | ------------ | ---------- |
| Authentication | 5 requests   | 15 minutes |
| OTP Send       | 3 requests   | 15 minutes |
| General API    | 100 requests | 15 minutes |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1710504000
```

### Rate Limit Exceeded Response (429)

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 900
  }
}
```

---

## Authentication Flow

### Staff Authentication Flow

```
1. POST /api/auth/send-otp (phone)
   ↓
2. Receive OTP via SMS
   ↓
3. POST /api/auth/login/phone-otp (phone + otp)
   ↓
4. Receive accessToken + refreshToken
   ↓
5. Use accessToken in Authorization header
   ↓
6. When accessToken expires:
   POST /api/auth/refresh (refreshToken)
   ↓
7. Receive new accessToken
```

### Patient Authentication Flow

```
1. POST /api/patient-auth/send-otp (phone + fullName)
   ↓
2. Receive OTP via WhatsApp (Gallabox)
   ↓
3. POST /api/patient-auth/verify-otp (phone + otp)
   ↓
4. Receive accessToken + refreshToken + patient data
   ↓
5. Use accessToken in Authorization header
   ↓
6. When accessToken expires:
   POST /api/patient-auth/refresh-token (refreshToken)
   ↓
7. Receive new accessToken
```

---

## Role-Based Access Control (RBAC)

### Roles

| Role ID | Role Name        | Description                    |
| ------- | ---------------- | ------------------------------ |
| 1       | ADMIN            | Full system access             |
| 2       | MANAGER          | Manage centres and staff       |
| 3       | CLINICIAN        | View appointments and patients |
| 4       | CENTRE_MANAGER   | Manage specific centre         |
| 5       | CARE_COORDINATOR | Manage appointments            |
| 6       | FRONT_DESK       | Book appointments              |
| 7       | PATIENT          | Patient access                 |

### Permission Matrix

| Resource                | ADMIN | MANAGER | CLINICIAN | CENTRE_MANAGER | CARE_COORDINATOR | FRONT_DESK | PATIENT |
| ----------------------- | ----- | ------- | --------- | -------------- | ---------------- | ---------- | ------- |
| Staff Management        | ✅    | ❌      | ❌        | ❌             | ❌               | ❌         | ❌      |
| Centres                 | ✅    | ✅      | ❌        | ✅             | ❌               | ❌         | ❌      |
| Clinicians              | ✅    | ✅      | ❌        | ✅             | ❌               | ❌         | ❌      |
| Appointments (Create)   | ✅    | ✅      | ❌        | ✅             | ✅               | ✅         | ✅      |
| Appointments (View All) | ✅    | ✅      | ❌        | ✅             | ✅               | ✅         | ❌      |
| Appointments (View Own) | ✅    | ✅      | ✅        | ✅             | ✅               | ✅         | ✅      |
| Patients                | ✅    | ✅      | ✅        | ✅             | ✅               | ✅         | ❌      |
| Analytics               | ✅    | ✅      | ❌        | ✅             | ❌               | ❌         | ❌      |
| Payments                | ✅    | ✅      | ❌        | ✅             | ✅               | ✅         | ✅      |

---

## Environment Variables

### Required Variables

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mibo_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Gallabox (WhatsApp)
GALLABOX_API_KEY=your_gallabox_key
GALLABOX_API_SECRET=your_gallabox_secret

# Google Meet
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

---

## Testing

### Health Check

```http
GET /api/health
```

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-03-15T10:00:00Z",
    "uptime": 3600,
    "database": "connected"
  }
}
```

---

## Changelog

### Version 1.0.0 (2024-03-15)

- Initial API release
- Staff and patient authentication
- Appointment booking system
- Payment integration (Razorpay)
- WhatsApp notifications (Gallabox)
- Google Meet integration
- Analytics dashboard
- Dynamic clinician management

---

## Support

For API support, contact:

- **Email**: support@mibo.com
- **Documentation**: See README.md
- **Issues**: Report bugs via project repository

---

**End of Backend API Documentation**
