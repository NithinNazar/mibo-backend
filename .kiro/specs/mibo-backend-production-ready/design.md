# Design Document

## Overview

The Mibo Mental Hospital Chain backend is an Express + TypeScript + PostgreSQL application that provides RESTful APIs for both a patient-facing website and an admin panel. The system manages multi-centre hospital operations including appointment scheduling, staff management, patient records, payments, and notifications.

### Key Design Principles

1. **Separation of Concerns**: Clear layering with controllers, services, repositories, and utilities
2. **Type Safety**: Comprehensive TypeScript types throughout the application
3. **Security First**: JWT authentication, role-based access control, input validation
4. **Scalability**: Connection pooling, efficient queries, stateless authentication
5. **Maintainability**: Consistent code patterns, error handling, and logging

## Architecture

### High-Level Architecture

```
┌─────────────────┐         ┌─────────────────┐
│  Patient Web    │         │   Admin Panel   │
│   (Frontend)    │         │   (Frontend)    │
└────────┬────────┘         └────────┬────────┘
         │                           │
         └───────────┬───────────────┘
                     │ HTTPS/REST
         ┌───────────▼────────────┐
         │   Express Backend      │
         │  (This Application)    │
         └───────────┬────────────┘
                     │
         ┌───────────┼────────────┐
         │           │            │
    ┌────▼───┐  ┌───▼────┐  ┌───▼─────┐
    │ Postgre│  │Gallabox│  │Razorpay │
    │   SQL  │  │WhatsApp│  │ Payment │
    └────────┘  └────────┘  └─────────┘
```

### Layered Architecture

```
┌──────────────────────────────────────┐
│         Routes Layer                 │  HTTP routing and endpoint definition
├──────────────────────────────────────┤
│      Middleware Layer                │  Auth, validation, error handling
├──────────────────────────────────────┤
│      Controllers Layer               │  Request/response handling
├──────────────────────────────────────┤
│       Services Layer                 │  Business logic
├──────────────────────────────────────┤
│     Repositories Layer               │  Database access
├──────────────────────────────────────┤
│      Utilities Layer                 │  JWT, OTP, external APIs
└──────────────────────────────────────┘
```

## Components and Interfaces

### 1. Configuration Module

**Purpose**: Centralize all environment configuration and database connection

**Files**:

- `src/config/env.ts` - Environment variable validation and export
- `src/config/db.ts` - PostgreSQL connection with pg-promise
- `src/config/gallabox.ts` - Gallabox API configuration
- `src/config/logger.ts` - Winston logger configuration

**Environment Variables**:

```typescript
interface EnvironmentConfig {
  PORT: number;
  NODE_ENV: "development" | "staging" | "production";
  DATABASE_URL: string;

  // JWT Configuration
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRY: string; // e.g., '15m'
  JWT_REFRESH_EXPIRY: string; // e.g., '7d'

  // OTP Configuration
  OTP_EXPIRY_MINUTES: number;

  // Gallabox (WhatsApp)
  GALLABOX_BASE_URL: string;
  GALLABOX_API_KEY: string;
  GALLABOX_API_SECRET: string;

  // Razorpay
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;

  // Google Meet
  GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
  GOOGLE_PRIVATE_KEY: string;
  GOOGLE_CALENDAR_ID: string;

  // CORS
  CORS_ORIGIN: string;
}
```

**Database Connection**:

- Use pg-promise with connection pooling
- Pool configuration: min 2, max 10 connections
- Implement connection error handling
- Add query logging in development mode

### 2. Authentication Module

**Purpose**: Handle staff authentication with multiple methods (phone+OTP, phone+password, username+password)

**Key Components**:

**Auth Controller** (`src/controllers/auth.controllers.ts`):

```typescript
class AuthController {
  sendOtp(req, res, next): Promise<void>;
  loginWithPhoneOtp(req, res, next): Promise<void>;
  loginWithPhonePassword(req, res, next): Promise<void>;
  loginWithUsernamePassword(req, res, next): Promise<void>;
  refreshToken(req, res, next): Promise<void>;
  logout(req, res, next): Promise<void>;
  getCurrentUser(req, res, next): Promise<void>;
}
```

**Auth Service** (`src/services/auth.services.ts`):

```typescript
class AuthService {
  sendOtp(phone: string): Promise<{ message: string }>;
  verifyOtpAndLogin(phone: string, otp: string): Promise<AuthResponse>;
  loginWithPhonePassword(
    phone: string,
    password: string
  ): Promise<AuthResponse>;
  loginWithUsernamePassword(
    username: string,
    password: string
  ): Promise<AuthResponse>;
  refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }>;
  logout(userId: number, refreshToken: string): Promise<void>;
  getCurrentUser(userId: number): Promise<UserResponse>;
}
```

**Auth Response Interface**:

```typescript
interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    username: string | null;
    role: string;
    avatar: string | null;
    centreIds: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  accessToken: string;
  refreshToken: string;
}
```

**Authentication Flow**:

1. User submits credentials (phone+OTP, phone+password, or username+password)
2. Controller validates input format
3. Service verifies credentials against database
4. Service checks user_type is 'STAFF' (reject PATIENT users)
5. Service retrieves user roles and centre assignments
6. Service generates JWT access token (15min expiry) and refresh token (7 days expiry)
7. Service stores refresh token hash in auth_sessions table
8. Controller returns user object and tokens

**OTP Flow**:

1. User requests OTP with phone number
2. System generates 6-digit OTP
3. System hashes OTP and stores in otp_requests table with 10-minute expiry
4. System sends OTP via SMS (future: Twilio integration)
5. User submits phone + OTP
6. System verifies OTP hash and checks expiry
7. System marks OTP as used
8. System proceeds with authentication flow

### 3. Authorization Module

**Purpose**: Implement role-based access control for different staff roles

**Middleware** (`src/middlewares/auth.middleware.ts`):

```typescript
// Verify JWT and attach user to request
function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void;

// Extended request interface
interface AuthRequest extends Request {
  user?: {
    userId: number;
    userType: "STAFF" | "PATIENT";
    roles: string[];
  };
}
```

**Role Middleware** (`src/middlewares/role.middleware.ts`):

```typescript
// Check if user has required role
function requireRole(...allowedRoles: string[]): RequestHandler;

// Check if user has access to specific centre
function requireCentreAccess(centreIdParam: string): RequestHandler;

// Check if user can access specific clinician data
function requireClinicianAccess(clinicianIdParam: string): RequestHandler;
```

**Role Hierarchy**:

- **ADMIN**: Full access to all endpoints and all centres
- **MANAGER**: Access to multiple centres, view all bookings, analytics
- **CENTRE_MANAGER**: Access to assigned centre only, manage clinicians and bookings
- **CLINICIAN**: View own appointments only
- **CARE_COORDINATOR**: Manage appointments for assigned centre
- **FRONT_DESK**: Book and view appointments for assigned centre

**Permission Matrix Implementation**:

```typescript
const PERMISSIONS = {
  "users.create": ["ADMIN"],
  "users.update": ["ADMIN"],
  "users.delete": ["ADMIN"],
  "centres.create": ["ADMIN"],
  "centres.update": ["ADMIN", "CENTRE_MANAGER"],
  "centres.delete": ["ADMIN"],
  "clinicians.create": ["ADMIN", "CENTRE_MANAGER"],
  "clinicians.update": ["ADMIN", "CENTRE_MANAGER"],
  "clinicians.delete": ["ADMIN", "CENTRE_MANAGER"],
  "appointments.view_all": ["ADMIN", "MANAGER"],
  "appointments.view_centre": [
    "ADMIN",
    "MANAGER",
    "CENTRE_MANAGER",
    "CARE_COORDINATOR",
    "FRONT_DESK",
  ],
  "appointments.view_own": ["CLINICIAN"],
  "appointments.create": [
    "ADMIN",
    "MANAGER",
    "CENTRE_MANAGER",
    "CARE_COORDINATOR",
    "FRONT_DESK",
  ],
  "appointments.update": [
    "ADMIN",
    "MANAGER",
    "CENTRE_MANAGER",
    "CARE_COORDINATOR",
  ],
  "appointments.cancel": [
    "ADMIN",
    "MANAGER",
    "CENTRE_MANAGER",
    "CARE_COORDINATOR",
    "FRONT_DESK",
  ],
  "analytics.view": ["ADMIN", "MANAGER", "CENTRE_MANAGER"],
  "patients.create": [
    "ADMIN",
    "MANAGER",
    "CENTRE_MANAGER",
    "CARE_COORDINATOR",
    "FRONT_DESK",
  ],
  "patients.view": [
    "ADMIN",
    "MANAGER",
    "CENTRE_MANAGER",
    "CARE_COORDINATOR",
    "FRONT_DESK",
    "CLINICIAN",
  ],
  "patients.update": [
    "ADMIN",
    "MANAGER",
    "CENTRE_MANAGER",
    "CARE_COORDINATOR",
    "FRONT_DESK",
  ],
};
```

### 4. Dashboard Analytics Module

**Purpose**: Provide real-time metrics and analytics for admin panel dashboard

**Analytics Controller** (`src/controllers/analytics.controller.ts`):

```typescript
class AnalyticsController {
  getDashboardMetrics(req, res, next): Promise<void>;
  getTopDoctors(req, res, next): Promise<void>;
  getRevenueData(req, res, next): Promise<void>;
  getLeadsBySource(req, res, next): Promise<void>;
}
```

**Analytics Service** (`src/services/analytics.service.ts`):

```typescript
class AnalyticsService {
  getDashboardMetrics(
    userId: number,
    roles: string[]
  ): Promise<DashboardMetrics>;
  getTopDoctors(centreId?: number, limit?: number): Promise<TopDoctor[]>;
  getRevenueData(
    period: "week" | "month" | "year",
    centreId?: number
  ): Promise<RevenueDataPoint[]>;
  getLeadsBySource(centreId?: number): Promise<LeadSource[]>;
}
```

**Dashboard Metrics Interface**:

```typescript
interface DashboardMetrics {
  totalPatients: number;
  totalPatientsChange: number; // percentage
  activeDoctors: number;
  activeDoctorsChange: number;
  followUpsBooked: number;
  followUpsBookedChange: number;
  totalRevenue: number;
  totalRevenueChange: number;
}
```

**Query Optimization**:

- Use aggregation queries with proper indexes
- Cache frequently accessed metrics (Redis in future)
- Filter by centre for CENTRE_MANAGER role
- Calculate percentage changes by comparing current period with previous period

### 5. Appointment Management Module

**Purpose**: Handle appointment booking, rescheduling, cancellation, and status management

**Appointment Controller** (`src/controllers/appointment.controller.ts`):

```typescript
class AppointmentController {
  getAppointments(req, res, next): Promise<void>;
  getAppointmentById(req, res, next): Promise<void>;
  createAppointment(req, res, next): Promise<void>;
  updateAppointment(req, res, next): Promise<void>;
  cancelAppointment(req, res, next): Promise<void>;
  getClinicianAvailability(req, res, next): Promise<void>;
}
```

**Appointment Service** (`src/services/appointment.service.ts`):

```typescript
class AppointmentService {
  getAppointments(
    filters: AppointmentFilters,
    userId: number,
    roles: string[]
  ): Promise<Appointment[]>;
  getAppointmentById(
    id: number,
    userId: number,
    roles: string[]
  ): Promise<Appointment>;
  createAppointment(
    data: CreateAppointmentDTO,
    bookedByUserId: number
  ): Promise<Appointment>;
  updateAppointment(
    id: number,
    data: UpdateAppointmentDTO,
    updatedByUserId: number
  ): Promise<Appointment>;
  cancelAppointment(
    id: number,
    reason: string,
    cancelledByUserId: number
  ): Promise<void>;
  checkClinicianAvailability(
    clinicianId: number,
    centreId: number,
    date: Date
  ): Promise<TimeSlot[]>;
}
```

**Appointment Creation Flow**:

1. Validate patient exists
2. Validate clinician exists and is active
3. Check clinician availability rules for the requested date/time
4. Check for scheduling conflicts (overlapping appointments)
5. Create appointment record with status 'BOOKED'
6. Record booking source (WEB_PATIENT, ADMIN_FRONT_DESK, etc.)
7. Log status in appointment_status_history
8. If appointment type is ONLINE, generate Google Meet link
9. Send WhatsApp confirmation via Gallabox
10. Return created appointment

**Availability Checking Algorithm**:

```typescript
// Check clinician_availability_rules for day of week
// Generate time slots based on start_time, end_time, slot_duration_minutes
// Query existing appointments for conflicts
// Return available slots
```

**Status Transitions**:

- BOOKED → CONFIRMED (after payment)
- BOOKED → CANCELLED (by staff or patient)
- CONFIRMED → RESCHEDULED (when date/time changed)
- CONFIRMED → COMPLETED (after consultation)
- CONFIRMED → NO_SHOW (patient didn't arrive)

### 6. Patient Management Module

**Purpose**: Manage patient records, profiles, and medical notes

**Patient Controller** (`src/controllers/patient.controller.ts`):

```typescript
class PatientController {
  getPatients(req, res, next): Promise<void>;
  getPatientById(req, res, next): Promise<void>;
  createPatient(req, res, next): Promise<void>;
  updatePatient(req, res, next): Promise<void>;
  getPatientAppointments(req, res, next): Promise<void>;
  addMedicalNote(req, res, next): Promise<void>;
}
```

**Patient Service** (`src/services/patient.service.ts`):

```typescript
class PatientService {
  getPatients(search?: string, phone?: string): Promise<Patient[]>;
  getPatientById(id: number): Promise<PatientDetail>;
  createPatient(data: CreatePatientDTO): Promise<Patient>;
  updatePatient(id: number, data: UpdatePatientDTO): Promise<Patient>;
  getPatientAppointments(patientId: number): Promise<Appointment[]>;
  addMedicalNote(
    patientId: number,
    note: string,
    authorUserId: number
  ): Promise<void>;
}
```

**Patient Creation for Walk-ins**:

1. Check if phone number already exists
2. Create user record with user_type 'PATIENT'
3. Create patient_profile record
4. Return patient object
5. No password required (patients login via OTP on website)

**Patient Detail Response**:

```typescript
interface PatientDetail {
  id: number;
  userId: number;
  fullName: string;
  phone: string;
  email: string | null;
  dateOfBirth: Date | null;
  gender: string | null;
  bloodGroup: string | null;
  emergencyContact: {
    name: string | null;
    phone: string | null;
  };
  appointments: Appointment[];
  payments: Payment[];
  medicalNotes: MedicalNote[];
  createdAt: Date;
  updatedAt: Date;
}
```

### 7. Staff and Clinician Management Module

**Purpose**: Manage staff users, roles, and clinician profiles

**Staff Controller** (`src/controllers/staff.controller.ts`):

```typescript
class StaffController {
  getStaffUsers(req, res, next): Promise<void>;
  getStaffById(req, res, next): Promise<void>;
  createStaffUser(req, res, next): Promise<void>;
  updateStaffUser(req, res, next): Promise<void>;
  deleteStaffUser(req, res, next): Promise<void>;

  getClinicians(req, res, next): Promise<void>;
  getClinicianById(req, res, next): Promise<void>;
  createClinician(req, res, next): Promise<void>;
  updateClinician(req, res, next): Promise<void>;
  deleteClinician(req, res, next): Promise<void>;
  updateClinicianAvailability(req, res, next): Promise<void>;
}
```

**Staff Service** (`src/services/staff.service.ts`):

```typescript
class StaffService {
  getStaffUsers(roleFilter?: string, centreId?: number): Promise<StaffUser[]>;
  getStaffById(id: number): Promise<StaffUser>;
  createStaffUser(data: CreateStaffDTO): Promise<StaffUser>;
  updateStaffUser(id: number, data: UpdateStaffDTO): Promise<StaffUser>;
  deleteStaffUser(id: number): Promise<void>;

  getClinicians(
    centreId?: number,
    specialization?: string
  ): Promise<Clinician[]>;
  getClinicianById(id: number): Promise<ClinicianDetail>;
  createClinician(data: CreateClinicianDTO): Promise<Clinician>;
  updateClinician(id: number, data: UpdateClinicianDTO): Promise<Clinician>;
  deleteClinician(id: number): Promise<void>;
  updateClinicianAvailability(
    clinicianId: number,
    rules: AvailabilityRule[]
  ): Promise<void>;
}
```

**Staff User Creation Flow**:

1. Validate role exists in roles table
2. Hash password using bcrypt (cost factor 10)
3. Create user record with user_type 'STAFF'
4. Create user_roles record linking user to role
5. Create centre_staff_assignments for centre associations
6. Create staff_profiles record
7. Return staff user object

**Clinician Profile**:

```typescript
interface ClinicianDetail {
  id: number;
  userId: number;
  name: string;
  email: string | null;
  phone: string;
  specialization: string;
  registrationNumber: string;
  yearsOfExperience: number;
  consultationFee: number;
  defaultDuration: number;
  primaryCentre: {
    id: number;
    name: string;
    city: string;
  };
  availabilityRules: AvailabilityRule[];
  isActive: boolean;
}
```

### 8. Centre Management Module

**Purpose**: Manage hospital centre locations

**Centre Controller** (`src/controllers/centre.controller.ts`):

```typescript
class CentreController {
  getCentres(req, res, next): Promise<void>;
  getCentreById(req, res, next): Promise<void>;
  createCentre(req, res, next): Promise<void>;
  updateCentre(req, res, next): Promise<void>;
  deleteCentre(req, res, next): Promise<void>;
}
```

**Centre Service** (`src/services/centre.service.ts`):

```typescript
class CentreService {
  getCentres(city?: string): Promise<Centre[]>;
  getCentreById(id: number): Promise<Centre>;
  createCentre(data: CreateCentreDTO): Promise<Centre>;
  updateCentre(id: number, data: UpdateCentreDTO): Promise<Centre>;
  deleteCentre(id: number): Promise<void>;
}
```

**Centre Interface**:

```typescript
interface Centre {
  id: number;
  name: string;
  city: "bangalore" | "kochi" | "mumbai";
  addressLine1: string;
  addressLine2: string | null;
  pincode: string;
  contactPhone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 9. Payment Integration Module

**Purpose**: Handle payment processing through Razorpay

**Payment Controller** (`src/controllers/payment.controller.ts`):

```typescript
class PaymentController {
  createOrder(req, res, next): Promise<void>;
  verifyPayment(req, res, next): Promise<void>;
  handleWebhook(req, res, next): Promise<void>;
  getPaymentsByPatient(req, res, next): Promise<void>;
}
```

**Payment Service** (`src/services/payment.service.ts`):

```typescript
class PaymentService {
  createRazorpayOrder(
    appointmentId: number,
    amount: number
  ): Promise<RazorpayOrder>;
  verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean;
  handlePaymentSuccess(paymentId: string, orderId: string): Promise<void>;
  handlePaymentFailure(orderId: string): Promise<void>;
  getPaymentsByPatient(patientId: number): Promise<Payment[]>;
}
```

**Payment Flow**:

1. Frontend requests payment order for appointment
2. Backend creates Razorpay order with appointment amount
3. Backend stores order in payments table with status 'CREATED'
4. Frontend displays Razorpay checkout
5. User completes payment
6. Razorpay sends webhook to backend
7. Backend verifies webhook signature
8. Backend updates payment status to 'SUCCESS'
9. Backend updates appointment status to 'CONFIRMED'
10. Backend triggers WhatsApp confirmation notification

**Razorpay Utility** (`src/utils/razorpay.ts`):

```typescript
class RazorpayUtil {
  createOrder(
    amount: number,
    currency: string,
    receipt: string
  ): Promise<RazorpayOrder>;
  verifySignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean;
}
```

### 10. Notification Module (Gallabox WhatsApp)

**Purpose**: Send WhatsApp notifications for appointments and updates

**Notification Controller** (`src/controllers/notification.controller.ts`):

```typescript
class NotificationController {
  sendAppointmentConfirmation(req, res, next): Promise<void>;
  sendAppointmentReminder(req, res, next): Promise<void>;
  getNotificationHistory(req, res, next): Promise<void>;
}
```

**Notification Service** (`src/services/notification.service.ts`):

```typescript
class NotificationService {
  sendAppointmentConfirmation(appointmentId: number): Promise<void>;
  sendAppointmentRescheduled(appointmentId: number): Promise<void>;
  sendAppointmentCancelled(appointmentId: number): Promise<void>;
  sendAppointmentReminder(appointmentId: number): Promise<void>;
  sendOnlineMeetingLink(appointmentId: number, meetLink: string): Promise<void>;
}
```

**Gallabox Utility** (`src/utils/gallabox.ts`):

```typescript
class GallaboxUtil {
  sendWhatsAppMessage(
    phone: string,
    message: string
  ): Promise<GallaboxResponse>;
  sendTemplateMessage(
    phone: string,
    templateId: string,
    params: Record<string, string>
  ): Promise<GallaboxResponse>;
}
```

**Message Templates**:

- Appointment Confirmation: "Your appointment with Dr. {name} is confirmed for {date} at {time} at {centre}."
- Online Meeting: "Your online consultation link: {meetLink}. Join at {time}."
- Rescheduled: "Your appointment has been rescheduled to {date} at {time}."
- Cancelled: "Your appointment on {date} has been cancelled. Reason: {reason}"
- Reminder: "Reminder: You have an appointment tomorrow at {time} with Dr. {name}."

**Notification Logging**:

- Store all notification attempts in notification_logs table
- Track delivery status, timestamps, and error messages
- Enable retry mechanism for failed notifications

### 11. Video Consultation Module (Google Meet)

**Purpose**: Generate Google Meet links for online consultations

**Video Controller** (`src/controllers/video.controller.ts`):

```typescript
class VideoController {
  generateMeetLink(req, res, next): Promise<void>;
  getMeetLinkForAppointment(req, res, next): Promise<void>;
}
```

**Video Service** (`src/services/video.service.ts`):

```typescript
class VideoService {
  generateGoogleMeetLink(appointmentId: number): Promise<string>;
  getMeetLinkForAppointment(appointmentId: number): Promise<string | null>;
}
```

**Google Meet Utility** (`src/utils/googleMeet.ts`):

```typescript
class GoogleMeetUtil {
  createCalendarEvent(
    summary: string,
    startTime: Date,
    endTime: Date,
    attendees: string[]
  ): Promise<CalendarEvent>;
  getEventMeetLink(eventId: string): Promise<string>;
}
```

**Google Meet Integration Flow**:

1. When online appointment is created, trigger Meet link generation
2. Authenticate with Google Calendar API using service account
3. Create calendar event with appointment details
4. Enable Google Meet for the event
5. Extract Meet link from event response
6. Store Meet link with appointment
7. Include Meet link in WhatsApp notification

**Service Account Setup**:

- Use Google Service Account for server-to-server authentication
- Grant Calendar API access to service account
- Store service account credentials in environment variables
- Use googleapis npm package for API calls

## Data Models

### Core Database Tables

**users**

```sql
id BIGSERIAL PRIMARY KEY
phone VARCHAR(20) UNIQUE
email VARCHAR(255) UNIQUE
username VARCHAR(50) UNIQUE
password_hash TEXT
full_name VARCHAR(150) NOT NULL
user_type VARCHAR(20) CHECK (user_type IN ('PATIENT', 'STAFF'))
is_active BOOLEAN DEFAULT TRUE
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

**roles**

```sql
id BIGSERIAL PRIMARY KEY
name VARCHAR(50) UNIQUE NOT NULL
description TEXT
created_at TIMESTAMPTZ DEFAULT NOW()
```

**user_roles**

```sql
id BIGSERIAL PRIMARY KEY
user_id BIGINT REFERENCES users(id)
role_id BIGINT REFERENCES roles(id)
centre_id BIGINT REFERENCES centres(id)
is_active BOOLEAN DEFAULT TRUE
created_at TIMESTAMPTZ DEFAULT NOW()
```

**centres**

```sql
id BIGSERIAL PRIMARY KEY
name VARCHAR(150) NOT NULL
city VARCHAR(100) CHECK (city IN ('bangalore', 'kochi', 'mumbai'))
address_line1 VARCHAR(255)
address_line2 VARCHAR(255)
pincode VARCHAR(20)
contact_phone VARCHAR(20)
is_active BOOLEAN DEFAULT TRUE
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

**patient_profiles**

```sql
id BIGSERIAL PRIMARY KEY
user_id BIGINT UNIQUE REFERENCES users(id)
date_of_birth DATE
gender VARCHAR(20)
blood_group VARCHAR(10)
emergency_contact_name VARCHAR(150)
emergency_contact_phone VARCHAR(20)
notes TEXT
is_active BOOLEAN DEFAULT TRUE
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

**clinician_profiles**

```sql
id BIGSERIAL PRIMARY KEY
user_id BIGINT UNIQUE REFERENCES users(id)
primary_centre_id BIGINT REFERENCES centres(id)
specialization VARCHAR(150)
registration_number VARCHAR(100)
years_of_experience INTEGER
consultation_fee NUMERIC(10,2)
default_consultation_duration_minutes INTEGER DEFAULT 30
is_active BOOLEAN DEFAULT TRUE
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

**appointments**

```sql
id BIGSERIAL PRIMARY KEY
patient_id BIGINT REFERENCES patient_profiles(id)
clinician_id BIGINT REFERENCES clinician_profiles(id)
centre_id BIGINT REFERENCES centres(id)
appointment_type VARCHAR(30) CHECK (appointment_type IN ('IN_PERSON', 'ONLINE', 'INPATIENT_ASSESSMENT', 'FOLLOW_UP'))
scheduled_start_at TIMESTAMPTZ NOT NULL
scheduled_end_at TIMESTAMPTZ NOT NULL
duration_minutes INTEGER
status VARCHAR(20) CHECK (status IN ('BOOKED', 'CONFIRMED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'))
parent_appointment_id BIGINT REFERENCES appointments(id)
booked_by_user_id BIGINT REFERENCES users(id)
source VARCHAR(30) CHECK (source IN ('WEB_PATIENT', 'ADMIN_FRONT_DESK', 'ADMIN_CARE_COORDINATOR', 'ADMIN_MANAGER'))
meet_link TEXT
notes TEXT
is_active BOOLEAN DEFAULT TRUE
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

**payments**

```sql
id BIGSERIAL PRIMARY KEY
patient_id BIGINT REFERENCES patient_profiles(id)
appointment_id BIGINT REFERENCES appointments(id)
provider VARCHAR(30) DEFAULT 'RAZORPAY'
order_id VARCHAR(100)
payment_id VARCHAR(100)
amount NUMERIC(10,2)
currency VARCHAR(10) DEFAULT 'INR'
status VARCHAR(20) CHECK (status IN ('CREATED', 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'))
paid_at TIMESTAMPTZ
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

**otp_requests**

```sql
id BIGSERIAL PRIMARY KEY
phone VARCHAR(20) NOT NULL
otp_hash TEXT NOT NULL
purpose VARCHAR(30) CHECK (purpose IN ('LOGIN', 'SIGNUP', 'PASSWORD_RESET'))
expires_at TIMESTAMPTZ NOT NULL
is_used BOOLEAN DEFAULT FALSE
attempts_count INTEGER DEFAULT 0
created_at TIMESTAMPTZ DEFAULT NOW()
```

**auth_sessions**

```sql
id BIGSERIAL PRIMARY KEY
user_id BIGINT REFERENCES users(id)
refresh_token_hash TEXT NOT NULL
expires_at TIMESTAMPTZ NOT NULL
revoked_at TIMESTAMPTZ
created_at TIMESTAMPTZ DEFAULT NOW()
```

## Error Handling

### Error Classification

**Client Errors (4xx)**:

- 400 Bad Request: Invalid input, validation failures
- 401 Unauthorized: Missing or invalid authentication token
- 403 Forbidden: Insufficient permissions for the requested resource
- 404 Not Found: Resource does not exist
- 409 Conflict: Resource conflict (e.g., duplicate phone number)
- 422 Unprocessable Entity: Semantic validation errors

**Server Errors (5xx)**:

- 500 Internal Server Error: Unexpected server errors
- 503 Service Unavailable: External service failures (Razorpay, Gallabox, Google)

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    stack?: string; // Only in development
  };
}
```

### ApiError Class

```typescript
class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: any;

  static badRequest(message: string, details?: any): ApiError;
  static unauthorized(message?: string): ApiError;
  static forbidden(message?: string): ApiError;
  static notFound(message: string): ApiError;
  static conflict(message: string): ApiError;
  static internal(message: string): ApiError;
}
```

### Error Middleware

```typescript
function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error with context
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.userId,
  });

  // Handle ApiError instances
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      },
    });
  }

  // Handle unexpected errors
  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    },
  });
}
```

### Database Error Handling

```typescript
// Wrap database queries with try-catch
try {
  const result = await db.query("SELECT * FROM users WHERE id = $1", [userId]);
} catch (error) {
  if (error.code === "23505") {
    // Unique violation
    throw ApiError.conflict("Resource already exists");
  }
  if (error.code === "23503") {
    // Foreign key violation
    throw ApiError.badRequest("Referenced resource does not exist");
  }
  throw ApiError.internal("Database error occurred");
}
```

## Testing Strategy

### Testing Pyramid

```
        /\
       /  \
      / E2E \
     /______\
    /        \
   /Integration\
  /____________\
 /              \
/  Unit Tests    \
/________________\
```

### Unit Testing

**Scope**: Test individual functions and methods in isolation

**Tools**: Jest, ts-jest

**Coverage Targets**:

- Utilities: 90%+ (JWT, OTP, validation)
- Services: 80%+ (business logic)
- Repositories: 70%+ (database queries)

**Example Unit Tests**:

```typescript
describe("OTP Utils", () => {
  test("generateOtp should return 6-digit string", () => {
    const otp = generateOtp();
    expect(otp).toMatch(/^\d{6}$/);
  });

  test("verifyOtp should return true for matching OTP", () => {
    const otp = "123456";
    const hash = hashOtp(otp);
    expect(verifyOtp(otp, hash)).toBe(true);
  });
});

describe("AuthService", () => {
  test("loginWithPhonePassword should reject PATIENT users", async () => {
    // Mock repository to return patient user
    await expect(
      authService.loginWithPhonePassword("1234567890", "password")
    ).rejects.toThrow("Access denied");
  });
});
```

### Integration Testing

**Scope**: Test API endpoints with real database (test database)

**Tools**: Jest, Supertest

**Setup**:

- Use separate test database
- Seed test data before each test suite
- Clean up after tests

**Example Integration Tests**:

```typescript
describe("POST /api/auth/login/phone-password", () => {
  test("should return tokens for valid staff credentials", async () => {
    const response = await request(app)
      .post("/api/auth/login/phone-password")
      .send({ phone: "9876543210", password: "test123" })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("accessToken");
    expect(response.body.data).toHaveProperty("refreshToken");
  });

  test("should reject patient users", async () => {
    await request(app)
      .post("/api/auth/login/phone-password")
      .send({ phone: "1234567890", password: "test123" })
      .expect(403);
  });
});
```

### End-to-End Testing

**Scope**: Test complete user workflows

**Tools**: Jest, Supertest

**Example E2E Tests**:

```typescript
describe("Appointment Booking Flow", () => {
  test("should complete full booking workflow", async () => {
    // 1. Login as front desk
    const loginRes = await request(app)
      .post("/api/auth/login/phone-password")
      .send({ phone: "9876543210", password: "test123" });

    const token = loginRes.body.data.accessToken;

    // 2. Create patient
    const patientRes = await request(app)
      .post("/api/patients")
      .set("Authorization", `Bearer ${token}`)
      .send({ fullName: "Test Patient", phone: "1111111111" });

    const patientId = patientRes.body.data.id;

    // 3. Check clinician availability
    const availabilityRes = await request(app)
      .get("/api/appointments/availability")
      .set("Authorization", `Bearer ${token}`)
      .query({ clinicianId: 1, date: "2024-01-15" });

    // 4. Book appointment
    const appointmentRes = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        patientId,
        clinicianId: 1,
        centreId: 1,
        appointmentType: "IN_PERSON",
        scheduledStartAt: "2024-01-15T10:00:00Z",
        durationMinutes: 30,
      })
      .expect(201);

    expect(appointmentRes.body.data).toHaveProperty("id");
    expect(appointmentRes.body.data.status).toBe("BOOKED");
  });
});
```

### Manual Testing Checklist

- [ ] All authentication methods work correctly
- [ ] Role-based access control enforces permissions
- [ ] Dashboard displays correct metrics
- [ ] Appointments can be created, updated, and cancelled
- [ ] Payment flow completes successfully
- [ ] WhatsApp notifications are sent
- [ ] Google Meet links are generated for online appointments
- [ ] Error messages are user-friendly
- [ ] API responses follow consistent format

## Security Considerations

### Authentication Security

1. **Password Hashing**: Use bcrypt with cost factor 10
2. **JWT Secrets**: Use strong, randomly generated secrets (minimum 32 characters)
3. **Token Expiry**: Short-lived access tokens (15 minutes), longer refresh tokens (7 days)
4. **Token Storage**: Store refresh token hashes, not plain tokens
5. **OTP Security**: Hash OTPs before storage, limit attempts to 3, expire after 10 minutes

### Authorization Security

1. **Role Verification**: Verify roles on every protected endpoint
2. **Centre Scoping**: Filter data by user's assigned centres
3. **Ownership Checks**: Verify user owns or has access to requested resources
4. **Principle of Least Privilege**: Grant minimum necessary permissions

### Input Validation

1. **Schema Validation**: Validate all inputs against defined schemas
2. **SQL Injection Prevention**: Use parameterized queries exclusively
3. **XSS Prevention**: Sanitize string inputs
4. **Phone Number Validation**: Enforce Indian format (10 digits)
5. **Email Validation**: Use standard email regex

### API Security

1. **CORS**: Configure allowed origins (admin panel and patient website)
2. **Rate Limiting**: Implement rate limiting on authentication endpoints (5 requests per minute)
3. **Request Size Limits**: Limit request body size to 10MB
4. **HTTPS**: Enforce HTTPS in production
5. **Security Headers**: Use helmet middleware for security headers

### Database Security

1. **Connection Pooling**: Limit maximum connections
2. **Prepared Statements**: Always use parameterized queries
3. **Least Privilege**: Database user should have minimum required permissions
4. **Backup Strategy**: Regular automated backups
5. **Encryption at Rest**: Enable database encryption

### External API Security

1. **API Key Storage**: Store API keys in environment variables, never in code
2. **Webhook Verification**: Verify signatures for Razorpay webhooks
3. **Timeout Configuration**: Set timeouts for external API calls
4. **Error Handling**: Don't expose internal errors to clients
5. **Retry Logic**: Implement exponential backoff for failed requests

### Logging and Monitoring

1. **Sensitive Data**: Never log passwords, tokens, or OTPs
2. **PII Protection**: Mask phone numbers and emails in logs
3. **Audit Trail**: Log all authentication attempts and permission changes
4. **Error Tracking**: Use structured logging with correlation IDs
5. **Monitoring**: Set up alerts for unusual activity patterns

## Deployment and Production Readiness

### Environment Configuration

**Development**:

- Local PostgreSQL database
- Console logging for OTPs
- Detailed error messages with stack traces
- CORS allowing all origins
- Hot reload with ts-node-dev

**Staging**:

- Staging database
- Real SMS/WhatsApp integration
- Error messages without stack traces
- CORS restricted to staging frontend
- Compiled TypeScript

**Production**:

- Production database with replication
- All external integrations enabled
- Generic error messages
- CORS restricted to production domains
- Compiled and optimized code
- Process manager (PM2)
- HTTPS only

### Health Check Endpoint

```typescript
GET /api/health

Response:
{
  status: 'healthy',
  timestamp: '2024-01-15T10:00:00Z',
  database: 'connected',
  version: '1.0.0',
  uptime: 3600
}
```

### Graceful Shutdown

```typescript
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");

  // Stop accepting new requests
  server.close(() => {
    logger.info("HTTP server closed");
  });

  // Close database connections
  await db.$pool.end();
  logger.info("Database connections closed");

  process.exit(0);
});
```

### Performance Optimization

1. **Database Indexes**: Create indexes on frequently queried columns
   - users: phone, email, username
   - appointments: patient_id, clinician_id, centre_id, scheduled_start_at
   - payments: appointment_id, order_id
2. **Query Optimization**: Use EXPLAIN ANALYZE to optimize slow queries

3. **Connection Pooling**: Configure appropriate pool size based on load

4. **Caching**: Implement Redis caching for frequently accessed data (future enhancement)

5. **Compression**: Enable gzip compression for API responses

### Monitoring and Logging

**Logging Strategy**:

- Use Winston for structured logging
- Log levels: error, warn, info, debug
- Separate log files for errors and combined logs
- Rotate logs daily, keep 14 days

**Metrics to Monitor**:

- Request rate and response times
- Error rates by endpoint
- Database query performance
- External API response times
- Memory and CPU usage
- Active database connections

**Alerting**:

- Error rate exceeds threshold
- Response time exceeds 2 seconds
- Database connection pool exhausted
- External API failures

### Backup and Recovery

1. **Database Backups**: Daily automated backups with 30-day retention
2. **Point-in-Time Recovery**: Enable WAL archiving for PostgreSQL
3. **Backup Testing**: Monthly restore tests
4. **Disaster Recovery Plan**: Document recovery procedures

### Scalability Considerations

1. **Horizontal Scaling**: Stateless design allows multiple instances
2. **Load Balancing**: Use nginx or AWS ALB for load distribution
3. **Database Scaling**: Read replicas for analytics queries
4. **Caching Layer**: Redis for session storage and frequently accessed data
5. **CDN**: Serve static assets through CDN

### CI/CD Pipeline

1. **Build**: Compile TypeScript, run linters
2. **Test**: Run unit and integration tests
3. **Security Scan**: Check for vulnerabilities
4. **Deploy**: Deploy to staging, run smoke tests, deploy to production
5. **Rollback**: Automated rollback on deployment failure

## API Endpoints Summary

### Authentication Endpoints

| Method | Endpoint                          | Description                    | Auth Required |
| ------ | --------------------------------- | ------------------------------ | ------------- |
| POST   | /api/auth/send-otp                | Send OTP to phone              | No            |
| POST   | /api/auth/login/phone-otp         | Login with phone + OTP         | No            |
| POST   | /api/auth/login/phone-password    | Login with phone + password    | No            |
| POST   | /api/auth/login/username-password | Login with username + password | No            |
| POST   | /api/auth/refresh                 | Refresh access token           | No            |
| POST   | /api/auth/logout                  | Logout user                    | Yes           |
| GET    | /api/auth/me                      | Get current user               | Yes           |

### Dashboard Analytics Endpoints

| Method | Endpoint                       | Description                | Roles                          |
| ------ | ------------------------------ | -------------------------- | ------------------------------ |
| GET    | /api/analytics/dashboard       | Get dashboard metrics      | ADMIN, MANAGER, CENTRE_MANAGER |
| GET    | /api/analytics/top-doctors     | Get top performing doctors | ADMIN, MANAGER, CENTRE_MANAGER |
| GET    | /api/analytics/revenue         | Get revenue data           | ADMIN, MANAGER, CENTRE_MANAGER |
| GET    | /api/analytics/leads-by-source | Get appointment sources    | ADMIN, MANAGER, CENTRE_MANAGER |

### User Management Endpoints

| Method | Endpoint       | Description          | Roles |
| ------ | -------------- | -------------------- | ----- |
| GET    | /api/users     | Get all staff users  | ADMIN |
| GET    | /api/users/:id | Get staff user by ID | ADMIN |
| POST   | /api/users     | Create staff user    | ADMIN |
| PUT    | /api/users/:id | Update staff user    | ADMIN |
| DELETE | /api/users/:id | Delete staff user    | ADMIN |

### Centre Management Endpoints

| Method | Endpoint         | Description      | Roles                 |
| ------ | ---------------- | ---------------- | --------------------- |
| GET    | /api/centres     | Get all centres  | All authenticated     |
| GET    | /api/centres/:id | Get centre by ID | All authenticated     |
| POST   | /api/centres     | Create centre    | ADMIN                 |
| PUT    | /api/centres/:id | Update centre    | ADMIN, CENTRE_MANAGER |
| DELETE | /api/centres/:id | Delete centre    | ADMIN                 |

### Clinician Management Endpoints

| Method | Endpoint                         | Description         | Roles                 |
| ------ | -------------------------------- | ------------------- | --------------------- |
| GET    | /api/clinicians                  | Get all clinicians  | All authenticated     |
| GET    | /api/clinicians/:id              | Get clinician by ID | All authenticated     |
| POST   | /api/clinicians                  | Create clinician    | ADMIN, CENTRE_MANAGER |
| PUT    | /api/clinicians/:id              | Update clinician    | ADMIN, CENTRE_MANAGER |
| DELETE | /api/clinicians/:id              | Delete clinician    | ADMIN, CENTRE_MANAGER |
| PUT    | /api/clinicians/:id/availability | Update availability | ADMIN, CENTRE_MANAGER |

### Patient Management Endpoints

| Method | Endpoint                       | Description              | Roles                                                        |
| ------ | ------------------------------ | ------------------------ | ------------------------------------------------------------ |
| GET    | /api/patients                  | Get all patients         | All staff                                                    |
| GET    | /api/patients/:id              | Get patient by ID        | All staff                                                    |
| POST   | /api/patients                  | Create patient           | ADMIN, MANAGER, CENTRE_MANAGER, CARE_COORDINATOR, FRONT_DESK |
| PUT    | /api/patients/:id              | Update patient           | ADMIN, MANAGER, CENTRE_MANAGER, CARE_COORDINATOR, FRONT_DESK |
| GET    | /api/patients/:id/appointments | Get patient appointments | All staff                                                    |
| POST   | /api/patients/:id/notes        | Add medical note         | CLINICIAN, ADMIN                                             |

### Appointment Management Endpoints

| Method | Endpoint                       | Description                  | Roles                                                        |
| ------ | ------------------------------ | ---------------------------- | ------------------------------------------------------------ |
| GET    | /api/appointments              | Get appointments             | All staff (filtered by role)                                 |
| GET    | /api/appointments/:id          | Get appointment by ID        | All staff                                                    |
| POST   | /api/appointments              | Create appointment           | ADMIN, MANAGER, CENTRE_MANAGER, CARE_COORDINATOR, FRONT_DESK |
| PUT    | /api/appointments/:id          | Update appointment           | ADMIN, MANAGER, CENTRE_MANAGER, CARE_COORDINATOR             |
| DELETE | /api/appointments/:id          | Cancel appointment           | ADMIN, MANAGER, CENTRE_MANAGER, CARE_COORDINATOR, FRONT_DESK |
| GET    | /api/appointments/availability | Check clinician availability | All staff                                                    |

### Payment Endpoints

| Method | Endpoint                   | Description           | Roles                        |
| ------ | -------------------------- | --------------------- | ---------------------------- |
| POST   | /api/payments/create-order | Create Razorpay order | All staff                    |
| POST   | /api/payments/verify       | Verify payment        | All staff                    |
| POST   | /api/payments/webhook      | Razorpay webhook      | No auth (signature verified) |
| GET    | /api/payments/patient/:id  | Get patient payments  | All staff                    |

### Notification Endpoints

| Method | Endpoint                                    | Description              | Roles  |
| ------ | ------------------------------------------- | ------------------------ | ------ |
| POST   | /api/notifications/appointment-confirmation | Send confirmation        | System |
| POST   | /api/notifications/appointment-reminder     | Send reminder            | System |
| GET    | /api/notifications/history                  | Get notification history | ADMIN  |

### Video Consultation Endpoints

| Method | Endpoint                             | Description                   | Roles     |
| ------ | ------------------------------------ | ----------------------------- | --------- |
| POST   | /api/video/generate-meet-link        | Generate Google Meet link     | System    |
| GET    | /api/video/appointment/:id/meet-link | Get Meet link for appointment | All staff |

### Health Check Endpoint

| Method | Endpoint    | Description         | Auth Required |
| ------ | ----------- | ------------------- | ------------- |
| GET    | /api/health | System health check | No            |

## Technology Stack

### Core Technologies

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.x
- **Framework**: Express 5.x
- **Database**: PostgreSQL 14+
- **Database Client**: pg-promise

### Dependencies

**Production Dependencies**:

```json
{
  "express": "^5.2.1",
  "cors": "^2.8.5",
  "dotenv": "^17.2.3",
  "pg-promise": "^12.3.0",
  "jsonwebtoken": "^9.0.2",
  "bcrypt": "^5.1.1",
  "morgan": "^1.10.1",
  "winston": "^3.11.0",
  "helmet": "^7.1.0",
  "express-rate-limit": "^7.1.5",
  "razorpay": "^2.9.6",
  "googleapis": "^166.0.0",
  "axios": "^1.6.5",
  "joi": "^17.11.0"
}
```

**Development Dependencies**:

```json
{
  "typescript": "^5.9.3",
  "ts-node-dev": "^2.0.0",
  "@types/express": "^5.0.6",
  "@types/node": "^24.10.1",
  "@types/cors": "^2.8.19",
  "@types/morgan": "^1.9.10",
  "@types/bcrypt": "^5.0.2",
  "@types/jsonwebtoken": "^9.0.5",
  "jest": "^29.7.0",
  "ts-jest": "^29.1.1",
  "@types/jest": "^29.5.11",
  "supertest": "^6.3.3",
  "@types/supertest": "^6.0.2",
  "eslint": "^8.56.0",
  "@typescript-eslint/eslint-plugin": "^6.19.0",
  "@typescript-eslint/parser": "^6.19.0"
}
```

### External Services

- **SMS Provider**: Twilio (for OTP delivery)
- **WhatsApp Provider**: Gallabox
- **Payment Gateway**: Razorpay
- **Video Conferencing**: Google Meet (via Google Calendar API)

## Implementation Priorities

### Phase 1: Core Infrastructure (High Priority)

1. Fix environment configuration (env.ts)
2. Implement proper error handling
3. Complete authentication system for staff users
4. Implement role-based access control middleware
5. Add input validation for all endpoints

### Phase 2: Essential Features (High Priority)

1. Complete appointment management
2. Complete patient management
3. Complete staff and clinician management
4. Complete centre management
5. Implement dashboard analytics

### Phase 3: Integrations (Medium Priority)

1. Razorpay payment integration
2. Gallabox WhatsApp notifications
3. Google Meet link generation
4. SMS OTP delivery

### Phase 4: Production Readiness (Medium Priority)

1. Comprehensive logging
2. Health check endpoint
3. Rate limiting
4. Security headers
5. Graceful shutdown

### Phase 5: Testing and Documentation (Lower Priority)

1. Unit tests for critical functions
2. Integration tests for API endpoints
3. API documentation
4. Deployment documentation

## Design Decisions and Rationale

### Why pg-promise over other PostgreSQL clients?

- Provides promise-based API
- Built-in query formatting and SQL injection prevention
- Excellent TypeScript support
- Flexible query methods (any, one, oneOrNone, none)

### Why separate access and refresh tokens?

- Security: Short-lived access tokens limit exposure
- User experience: Refresh tokens allow seamless re-authentication
- Revocation: Can revoke refresh tokens without affecting active sessions

### Why hash OTPs before storage?

- Security: Prevents OTP theft if database is compromised
- Compliance: Follows security best practices
- Minimal overhead: Hashing is fast enough for OTP use case

### Why role-based instead of permission-based access control?

- Simplicity: Easier to understand and maintain
- Sufficient granularity: Roles map well to job functions
- Performance: Fewer database queries for authorization
- Future extensibility: Can add permissions within roles if needed

### Why separate services and repositories?

- Separation of concerns: Business logic vs data access
- Testability: Can mock repositories in service tests
- Reusability: Repositories can be used by multiple services
- Maintainability: Changes to database don't affect business logic
