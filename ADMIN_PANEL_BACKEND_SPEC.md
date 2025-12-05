# Mibo Care Admin Panel - Complete Backend Specification

## 🎯 Project Overview

**Admin Panel for Mental Hospital Chain Management**

- **Frontend**: React + TypeScript + Vite + Tailwind (COMPLETE)
- **Backend**: Express + TypeScript + PostgreSQL (TO BUILD)
- **Authentication**: JWT (Access + Refresh tokens)
- **Database**: Already exists with comprehensive schema

## 🚨 CRITICAL: Patient vs Staff Users

### Admin Panel Users (STAFF ONLY)

- **Who can login**: Admin, Manager, Centre Manager, Clinician, Care Coordinator, Front Desk
- **Authentication**: Phone+OTP, Phone+Password, Username+Password
- **Database**: `users` table where `user_type = 'STAFF'`
- **Purpose**: Manage hospital operations, view/manage patient data

### Patients (WEBSITE ONLY - NOT ADMIN PANEL)

- **Who can login**: Patients
- **Where**: Mibo website (separate project, build later)
- **Database**: `users` table where `user_type = 'PATIENT'`
- **Admin panel can**: View patient data, create patient records, book appointments for them
- **Admin panel CANNOT**: Allow patients to login

## 📊 Your Existing Database Schema

### Core Tables

#### 1. Users & Authentication

```sql
-- Main users table
users (
  id BIGSERIAL PRIMARY KEY,
  phone VARCHAR(20),
  email VARCHAR(255),
  username VARCHAR(50),
  password_hash TEXT,
  full_name VARCHAR(150) NOT NULL,
  user_type VARCHAR(20) CHECK (user_type IN ('PATIENT', 'STAFF')),
  is_active BOOLEAN DEFAULT TRUE
)

-- Roles lookup
roles (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE -- ADMIN, MANAGER, CENTRE_MANAGER, CLINICIAN, CARE_COORDINATOR, FRONT_DESK
)

-- User role assignments (many-to-many)
user_roles (
  user_id BIGINT REFERENCES users(id),
  role_id BIGINT REFERENCES roles(id),
  centre_id BIGINT REFERENCES centres(id),
  is_active BOOLEAN DEFAULT TRUE
)

-- OTP for phone authentication
otp_requests (
  phone VARCHAR(20),
  otp_hash TEXT,
  purpose VARCHAR(30) CHECK (purpose IN ('LOGIN', 'SIGNUP', 'PASSWORD_RESET')),
  expires_at TIMESTAMPTZ,
  is_used BOOLEAN DEFAULT FALSE
)

-- JWT refresh tokens
auth_sessions (
  user_id BIGINT REFERENCES users(id),
  refresh_token_hash TEXT,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
)
```

#### 2. Centres (Hospital Locations)

```sql
centres (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(150),
  city VARCHAR(100), -- 'bangalore', 'kochi', 'mumbai'
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  pincode VARCHAR(20),
  contact_phone VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE
)
```

#### 3. Patients

```sql
-- Patient profiles (linked to users table)
patient_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE REFERENCES users(id),
  date_of_birth DATE,
  gender VARCHAR(20),
  blood_group VARCHAR(10),
  emergency_contact_name VARCHAR(150),
  emergency_contact_phone VARCHAR(20),
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE
)

-- Medical notes
patient_medical_notes (
  patient_id BIGINT REFERENCES patient_profiles(id),
  author_user_id BIGINT REFERENCES users(id),
  note_text TEXT,
  visibility VARCHAR(20) DEFAULT 'INTERNAL'
)
```

#### 4. Staff & Clinicians

```sql
-- Staff profiles
staff_profiles (
  user_id BIGINT UNIQUE REFERENCES users(id),
  designation VARCHAR(100),
  profile_picture_url TEXT,
  is_active BOOLEAN DEFAULT TRUE
)

-- Clinician (doctor) profiles
clinician_profiles (
  user_id BIGINT UNIQUE REFERENCES users(id),
  primary_centre_id BIGINT REFERENCES centres(id),
  specialization VARCHAR(150),
  registration_number VARCHAR(100),
  years_of_experience INTEGER,
  consultation_fee NUMERIC(10,2), -- ⚠️ ADD THIS COLUMN
  default_consultation_duration_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE
)

-- Staff-centre assignments
centre_staff_assignments (
  user_id BIGINT REFERENCES users(id),
  centre_id BIGINT REFERENCES centres(id),
  role_id BIGINT REFERENCES roles(id),
  is_primary BOOLEAN DEFAULT FALSE
)

-- Clinician availability
clinician_availability_rules (
  clinician_id BIGINT REFERENCES clinician_profiles(id),
  centre_id BIGINT REFERENCES centres(id),
  day_of_week SMALLINT CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME,
  end_time TIME,
  slot_duration_minutes INTEGER,
  mode VARCHAR(20) CHECK (mode IN ('IN_PERSON', 'ONLINE'))
)
```

#### 5. Appointments

```sql
appointments (
  id BIGSERIAL PRIMARY KEY,
  patient_id BIGINT REFERENCES patient_profiles(id),
  clinician_id BIGINT REFERENCES clinician_profiles(id),
  centre_id BIGINT REFERENCES centres(id),
  appointment_type VARCHAR(30) CHECK (appointment_type IN ('IN_PERSON', 'ONLINE', 'INPATIENT_ASSESSMENT', 'FOLLOW_UP')),
  scheduled_start_at TIMESTAMPTZ,
  scheduled_end_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  status VARCHAR(20) CHECK (status IN ('BOOKED', 'CONFIRMED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
  parent_appointment_id BIGINT REFERENCES appointments(id),
  booked_by_user_id BIGINT REFERENCES users(id),
  source VARCHAR(30) CHECK (source IN ('WEB_PATIENT', 'ADMIN_FRONT_DESK', 'ADMIN_CARE_COORDINATOR', 'ADMIN_MANAGER')),
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE
)

-- Appointment status history (audit trail)
appointment_status_history (
  appointment_id BIGINT REFERENCES appointments(id),
  previous_status VARCHAR(20),
  new_status VARCHAR(20),
  changed_by_user_id BIGINT REFERENCES users(id),
  changed_at TIMESTAMPTZ,
  reason TEXT
)
```

#### 6. Payments (Razorpay)

```sql
payments (
  patient_id BIGINT REFERENCES patient_profiles(id),
  appointment_id BIGINT REFERENCES appointments(id),
  provider VARCHAR(30) DEFAULT 'RAZORPAY',
  order_id VARCHAR(100),
  payment_id VARCHAR(100),
  amount NUMERIC(10,2),
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(20) CHECK (status IN ('CREATED', 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED')),
  paid_at TIMESTAMPTZ
)
```

## 🔐 Authentication Endpoints (STAFF ONLY)

### POST `/api/auth/send-otp`

Send OTP to staff phone number

```typescript
Request: { phone: string }
Response: { message: "OTP sent successfully" }

Implementation:
1. Generate 6-digit OTP
2. Hash and store in otp_requests table
3. Send via SMS (Twilio)
4. Set expires_at = NOW() + 10 minutes
```

### POST `/api/auth/login/phone-otp`

Login with phone + OTP

```typescript
Request: { phone: string, otp: string }
Response: {
  user: {
    id: string,
    name: string,
    email: string,
    phone: string,
    username: string,
    role: string, // 'admin', 'manager', etc.
    avatar: string,
    centreIds: string[],
    isActive: boolean,
    createdAt: Date,
    updatedAt: Date
  },
  accessToken: string,
  refreshToken: string
}

Implementation:
1. Find OTP in otp_requests (not used, not expired)
2. Verify OTP hash
3. Mark OTP as used
4. Find user WHERE phone = $1 AND user_type = 'STAFF'
5. Get user roles and centres
6. Generate JWT tokens
7. Store refresh token in auth_sessions
8. Return user + tokens
```

### POST `/api/auth/login/phone-password`

Login with phone + password

```typescript
Request: { phone: string, password: string }
Response: Same as phone-otp

Implementation:
1. Find user WHERE phone = $1 AND user_type = 'STAFF'
2. Verify password_hash with bcrypt
3. Get user roles and centres
4. Generate JWT tokens
5. Store refresh token
6. Return user + tokens
```

### POST `/api/auth/login/username-password`

Login with username + password

```typescript
Request: { username: string, password: string }
Response: Same as phone-otp

Implementation:
1. Find user WHERE username = $1 AND user_type = 'STAFF'
2. Verify password_hash
3. Get user roles and centres
4. Generate JWT tokens
5. Store refresh token
6. Return user + tokens
```

### POST `/api/auth/refresh`

Refresh access token

```typescript
Request: { refreshToken: string }
Response: { accessToken: string }

Implementation:
1. Verify refresh token JWT
2. Find in auth_sessions (not revoked, not expired)
3. Generate new access token
4. Return new access token
```

### POST `/api/auth/logout`

Logout user

```typescript
Headers: Authorization: Bearer {accessToken}
Response: { message: "Logged out successfully" }

Implementation:
1. Verify access token
2. Mark refresh token as revoked in auth_sessions
3. Return success
```

### GET `/api/auth/me`

Get current user

```typescript
Headers: Authorization: Bearer {accessToken}
Response: User object (same as login response)

Implementation:
1. Verify access token
2. Get userId from token
3. Query user with roles and centres
4. Return user object
```

## 📊 Dashboard Analytics Endpoints

### GET `/api/analytics/dashboard`

Get dashboard metrics

```typescript
Response: {
  totalPatients: number,
  totalPatientsChange: number, // percentage
  activeDoctors: number,
  activeDoctorsChange: number,
  followUpsBooked: number,
  followUpsBookedChange: number,
  totalRevenue: number,
  totalRevenueChange: number
}

Queries:
-- Total patients (this month vs last month)
SELECT COUNT(*) FROM patient_profiles WHERE is_active = true;

-- Active doctors
SELECT COUNT(*) FROM clinician_profiles WHERE is_active = true;

-- Follow-ups booked
SELECT COUNT(*) FROM appointments
WHERE appointment_type = 'FOLLOW_UP'
  AND status IN ('BOOKED', 'CONFIRMED');

-- Total revenue
SELECT SUM(amount) FROM payments WHERE status = 'SUCCESS';
```

### GET `/api/analytics/top-doctors`

Get top performing doctors

```typescript
Response: [
  {
    id: string,
    name: string,
    specialty: string,
    avatar: string,
    patientCount: number
  }
]

Query:
SELECT
  cp.id, u.full_name, cp.specialization,
  sp.profile_picture_url,
  COUNT(a.id) as patient_count
FROM clinician_profiles cp
JOIN users u ON cp.user_id = u.id
LEFT JOIN staff_profiles sp ON u.id = sp.user_id
LEFT JOIN appointments a ON cp.id = a.clinician_id
  AND a.status = 'COMPLETED'
WHERE cp.is_active = true
GROUP BY cp.id, u.full_name, cp.specialization, sp.profile_picture_url
ORDER BY patient_count DESC
LIMIT 10;
```

### GET `/api/analytics/revenue`

Get revenue over time

```typescript
Query params: ?period=month|week|year
Response: [
  { date: string, value: number }
]

Query:
SELECT
  DATE_TRUNC('day', paid_at) as date,
  SUM(amount) as value
FROM payments
WHERE status = 'SUCCESS'
  AND paid_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', paid_at)
ORDER BY date;
```

### GET `/api/analytics/leads-by-source`

Get appointment sources

```typescript
Response: [
  { label: 'Website', value: number, color: string },
  { label: 'Phone', value: number, color: string },
  { label: 'Direct', value: number, color: string },
  { label: 'Referrals', value: number, color: string }
]

Query:
SELECT
  source,
  COUNT(*) as count
FROM appointments
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY source;
```

## 👥 User Management Endpoints

### GET `/api/users`

Get all staff users

```typescript
Query params: ?role=admin&centreId=123
Headers: Authorization: Bearer {token}
Permissions: ADMIN only

Response: [
  {
    id: string,
    name: string,
    email: string,
    phone: string,
    username: string,
    role: string,
    centreIds: string[],
    isActive: boolean
  }
]

Query:
SELECT u.*, r.name as role_name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.user_type = 'STAFF'
  AND u.is_active = true;
```

### POST `/api/users`

Create new staff user

```typescript
Headers: Authorization: Bearer {token}
Permissions: ADMIN only

Request: {
  fullName: string,
  phone: string,
  email?: string,
  username?: string,
  password: string,
  roleId: number,
  centreIds: number[]
}

Response: User object

Implementation:
1. Hash password
2. Insert into users (user_type = 'STAFF')
3. Insert into user_roles
4. Insert into centre_staff_assignments
5. Return created user
```

### PUT `/api/users/:id`

Update staff user

```typescript
Headers: Authorization: Bearer {token}
Permissions: ADMIN or self

Request: {
  fullName?: string,
  email?: string,
  phone?: string,
  isActive?: boolean
}

Response: Updated user object
```

### DELETE `/api/users/:id`

Delete staff user

```typescript
Headers: Authorization: Bearer {token}
Permissions: ADMIN only

Response: { message: "User deleted" }

Implementation:
Soft delete: SET is_active = false
```

## 🏥 Centre Management Endpoints

### GET `/api/centres`

Get all centres

```typescript
Response: [
  {
    id: string,
    name: string,
    city: string,
    address: string,
    phone: string,
    isActive: boolean,
  },
];
```

### POST `/api/centres`

Create centre

```typescript
Permissions: ADMIN only

Request: {
  name: string,
  city: 'bangalore' | 'kochi' | 'mumbai',
  addressLine1: string,
  addressLine2?: string,
  pincode: string,
  contactPhone: string
}

Response: Created centre object
```

### PUT `/api/centres/:id`

Update centre

```typescript
Permissions: ADMIN, CENTRE_MANAGER

Request: Same as POST (partial)
Response: Updated centre object
```

### DELETE `/api/centres/:id`

Delete centre

```typescript
Permissions: ADMIN only
Response: { message: "Centre deleted" }
```

## 👨‍⚕️ Clinician Management Endpoints

### GET `/api/clinicians`

Get all clinicians

```typescript
Query params: ?centreId=123&specialization=therapy

Response: [
  {
    id: string,
    userId: string,
    name: string,
    specialization: string,
    experience: number,
    centreId: string,
    centreName: string,
    consultationFee: number,
    isAvailable: boolean
  }
]

Query:
SELECT
  cp.*, u.full_name, c.name as centre_name
FROM clinician_profiles cp
JOIN users u ON cp.user_id = u.id
JOIN centres c ON cp.primary_centre_id = c.id
WHERE cp.is_active = true;
```

### POST `/api/clinicians`

Create clinician

```typescript
Permissions: ADMIN, CENTRE_MANAGER

Request: {
  userId: number, // Must be existing STAFF user
  primaryCentreId: number,
  specialization: string,
  registrationNumber: string,
  yearsOfExperience: number,
  consultationFee: number
}

Response: Created clinician object
```

### PUT `/api/clinicians/:id`

Update clinician

```typescript
Permissions: ADMIN, CENTRE_MANAGER

Request: Partial clinician object
Response: Updated clinician object
```

### DELETE `/api/clinicians/:id`

Delete clinician

```typescript
Permissions: ADMIN, CENTRE_MANAGER;
Response: {
  message: "Clinician deleted";
}
```

## 👤 Patient Management Endpoints

### GET `/api/patients`

Get all patients

```typescript
Query params: ?search=name&phone=123

Response: [
  {
    id: string,
    name: string,
    phone: string,
    email: string,
    dateOfBirth: Date,
    gender: string,
    emergencyContact: {
      name: string,
      phone: string
    }
  }
]

Query:
SELECT
  pp.*, u.full_name, u.phone, u.email
FROM patient_profiles pp
JOIN users u ON pp.user_id = u.id
WHERE pp.is_active = true;
```

### POST `/api/patients`

Create patient (for walk-ins or phone bookings)

```typescript
Permissions: FRONT_DESK, CARE_COORDINATOR, ADMIN

Request: {
  fullName: string,
  phone: string,
  email?: string,
  dateOfBirth?: Date,
  gender?: string,
  emergencyContactName?: string,
  emergencyContactPhone?: string
}

Response: Created patient object

Implementation:
1. Create user (user_type = 'PATIENT', no password)
2. Create patient_profile
3. Return patient object
```

### GET `/api/patients/:id`

Get patient details

```typescript
Response: {
  ...patient details,
  appointments: [...],
  payments: [...],
  medicalNotes: [...]
}
```

### PUT `/api/patients/:id`

Update patient

```typescript
Request: Partial patient object
Response: Updated patient object
```

## 📅 Appointment Management Endpoints

### GET `/api/appointments`

Get appointments

```typescript
Query params:
  ?centreId=123
  &clinicianId=456
  &patientId=789
  &date=2024-01-01
  &status=BOOKED

Response: [
  {
    id: string,
    patientId: string,
    patientName: string,
    clinicianId: string,
    clinicianName: string,
    centreId: string,
    centreName: string,
    scheduledStartAt: Date,
    scheduledEndAt: Date,
    status: string,
    type: string,
    notes: string
  }
]

Query:
SELECT
  a.*,
  pu.full_name as patient_name,
  cu.full_name as clinician_name,
  c.name as centre_name
FROM appointments a
JOIN patient_profiles pp ON a.patient_id = pp.id
JOIN users pu ON pp.user_id = pu.id
JOIN clinician_profiles cp ON a.clinician_id = cp.id
JOIN users cu ON cp.user_id = cu.id
JOIN centres c ON a.centre_id = c.id
WHERE a.is_active = true;
```

### POST `/api/appointments`

Book appointment

```typescript
Permissions: FRONT_DESK, CARE_COORDINATOR, ADMIN

Request: {
  patientId: number,
  clinicianId: number,
  centreId: number,
  appointmentType: string,
  scheduledStartAt: Date,
  durationMinutes: number,
  notes?: string
}

Response: Created appointment object

Implementation:
1. Check clinician availability
2. Check for conflicts
3. Create appointment
4. Update appointment status history
5. Send notification (optional)
6. Return appointment
```

### PUT `/api/appointments/:id`

Update appointment (reschedule, change status)

```typescript
Permissions: CARE_COORDINATOR, ADMIN

Request: {
  scheduledStartAt?: Date,
  status?: string,
  notes?: string
}

Response: Updated appointment object

Implementation:
1. Update appointment
2. Log status change in appointment_status_history
3. Send notification
4. Return updated appointment
```

### DELETE `/api/appointments/:id`

Cancel appointment

```typescript
Permissions: CARE_COORDINATOR, ADMIN

Request: { reason: string }
Response: { message: "Appointment cancelled" }

Implementation:
1. Set status = 'CANCELLED'
2. Log in status history
3. Send notification
```

## 🔒 Role-Based Access Control

### Middleware Implementation

```typescript
// Check if user has required role
export const requireRole = (...allowedRoles: string[]) => {
  return async (req, res, next) => {
    const userId = req.user.userId; // From JWT

    const result = await db.query(
      `
      SELECT r.name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1 AND ur.is_active = true
    `,
      [userId]
    );

    const userRoles = result.rows.map((r) => r.name);
    const hasPermission = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasPermission) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
};
```

### Permission Matrix

| Endpoint              | ADMIN | MANAGER | CENTRE_MANAGER  | CLINICIAN     | CARE_COORDINATOR | FRONT_DESK      |
| --------------------- | ----- | ------- | --------------- | ------------- | ---------------- | --------------- |
| Create User           | ✅    | ❌      | ❌              | ❌            | ❌               | ❌              |
| Create Centre         | ✅    | ❌      | ❌              | ❌            | ❌               | ❌              |
| Create Clinician      | ✅    | ❌      | ✅              | ❌            | ❌               | ❌              |
| View All Appointments | ✅    | ✅      | ✅ (own centre) | ✅ (own only) | ✅ (own centre)  | ✅ (own centre) |
| Book Appointment      | ✅    | ✅      | ✅              | ❌            | ✅               | ✅              |
| Cancel Appointment    | ✅    | ✅      | ✅              | ❌            | ✅               | ✅              |
| View Analytics        | ✅    | ✅      | ✅ (own centre) | ❌            | ❌               | ❌              |

## 🔄 Data Transformation

### Status Mapping (DB → Frontend)

```typescript
const statusMap = {
  BOOKED: "scheduled",
  CONFIRMED: "confirmed",
  RESCHEDULED: "scheduled",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no-show",
};
```

### Type Mapping (DB → Frontend)

```typescript
const typeMap = {
  FOLLOW_UP: "follow-up",
  IN_PERSON: "first-visit",
  ONLINE: "first-visit",
  INPATIENT_ASSESSMENT: "first-visit",
};
```

## 🚀 Quick Start Checklist

### 1. Database Modifications

```sql
-- Add consultation fee
ALTER TABLE clinician_profiles
ADD COLUMN consultation_fee NUMERIC(10,2) DEFAULT 0;

-- Ensure city values
UPDATE centres SET city = LOWER(city);
ALTER TABLE centres
ADD CONSTRAINT check_city
CHECK (city IN ('bangalore', 'kochi', 'mumbai'));
```

### 2. Seed Roles

```sql
INSERT INTO roles (name, description) VALUES
('ADMIN', 'Full system access'),
('MANAGER', 'Multi-centre manager'),
('CENTRE_MANAGER', 'Single centre manager'),
('CLINICIAN', 'Doctor/Therapist'),
('CARE_COORDINATOR', 'Patient flow coordinator'),
('FRONT_DESK', 'Reception staff');
```

### 3. Environment Variables

```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/mibo_admin
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
OTP_EXPIRY_MINUTES=10
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=your-number
CORS_ORIGIN=http://localhost:5173
```

### 4. Implementation Order

1. ✅ Authentication endpoints (STAFF only)
2. ✅ User management (CRUD)
3. ✅ Centre management (CRUD)
4. ✅ Clinician management (CRUD)
5. ✅ Patient management (CRUD)
6. ✅ Appointment management (CRUD)
7. ✅ Dashboard analytics
8. ✅ Role-based middleware

## 📞 Frontend Integration

**Frontend expects:**

- Base URL: `http://localhost:5000/api`
- JWT in `Authorization: Bearer {token}` header
- Automatic token refresh on 401
- All responses in JSON

**Frontend is ready at:**

- Admin Panel: `http://localhost:5173`
- All UI components built
- All API calls configured
- Waiting for backend endpoints

## ✅ Summary

Your database schema is excellent! You just need to:

1. Add `consultation_fee` column
2. Standardize `city` values
3. Build Express API endpoints
4. Implement JWT authentication (STAFF only)
5. Add role-based access control
6. Transform data to match frontend expectations

**Remember**: Patients CANNOT login to admin panel. Only STAFF users (admin, manager, etc.) can authenticate.
