# MIBO System Architecture

## Overview

MIBO is a mental health clinic management system with three main applications: Patient Frontend, Admin Panel, and Backend API. The system manages appointments, payments, clinician schedules, and patient records across multiple centres.

## System Components

### 1. Backend API (Node.js/Express/TypeScript)

- RESTful API server
- PostgreSQL database
- JWT-based authentication
- Deployed on AWS Elastic Beanstalk

### 2. Patient Frontend (React/TypeScript/Vite)

- Patient-facing booking application
- OTP-based authentication via WhatsApp
- Razorpay payment integration
- Deployed on AWS S3 + CloudFront (mibo.care)

### 3. Admin Panel (React/TypeScript/Vite)

- Staff management interface
- Username/password or phone/OTP authentication
- Appointment, clinician, patient management
- Deployed on AWS S3 + CloudFront (admin.mibo.care)

## Technology Stack

### Backend

- Runtime: Node.js 18+
- Framework: Express.js
- Language: TypeScript
- Database: PostgreSQL (AWS RDS)
- ORM: Raw SQL with connection pooling
- Authentication: JWT (jsonwebtoken)
- Payment: Razorpay SDK
- Notifications: Gallabox WhatsApp API
- Video: Google Meet API
- Storage: AWS S3 + CloudFront

### Frontend (Patient)

- Framework: React 18
- Build Tool: Vite
- Language: TypeScript
- Routing: React Router v6
- State: React Context API
- HTTP: Axios
- Payment: Razorpay Checkout
- Styling: Tailwind CSS

### Admin Panel

- Framework: React 18
- Build Tool: Vite
- Language: TypeScript
- Routing: React Router v6
- State: React Context API
- HTTP: Axios
- UI: Custom components + Lucide icons
- Styling: Tailwind CSS

## Architecture Patterns

### Backend Architecture (3-Layer)

#### 1. Routes Layer (`/routes`)

- HTTP endpoint definitions
- Request parameter extraction
- Route-level middleware (validation, rate limiting)

#### 2. Controller Layer (`/controllers`)

- Request/response handling
- Input validation
- Business logic orchestration
- Error handling

#### 3. Service Layer (`/services`)

- Business logic implementation
- Transaction management
- External API integration
- Data transformation

#### 4. Repository Layer (`/repositories`)

- Database queries
- SQL execution
- Data access abstraction

#### 5. Middleware Layer (`/middlewares`)

- Authentication (JWT verification)
- Authorization (role-based access control)
- Error handling (global error middleware)
- Request validation (express-validator)

### Frontend Architecture

#### Patient Frontend

- Pages: Home, Experts, Booking, Profile Dashboard, About, Services
- Components: Reusable UI components (Header, Footer, Cards)
- Services: API client modules (authService, bookingService, paymentService)
- Hooks: Custom React hooks (useRazorpayPayment, useWhatsAppNotifications)
- Context: AuthContext for user state
- Utils: Date helpers, image optimization, retry logic

#### Admin Panel

- Modules: Appointments, Clinicians, Patients, Staff, Dashboard, Centres
- Layouts: AdminLayout with sidebar navigation
- Components: Calendar, Charts, Slot Blocking, Modals
- Services: API client modules (appointmentService, clinicianService, staffService)
- Context: AuthContext for staff authentication
- Utils: Date utilities, export helpers, slot generators

## Database Schema

### Core Tables

- `users`: All system users (staff and patients)
- `roles`: User roles (Admin, Manager, Clinician, etc.)
- `user_roles`: User-role assignments
- `patient_profiles`: Patient-specific data (DOB, gender, medical history)
- `clinician_profiles`: Clinician-specific data (specialization, bio, profile picture)
- `staff_profiles`: Staff-specific data (designation, department)
- `centres`: Clinic locations (Bangalore, Kochi, Mumbai)
- `centre_staff_assignments`: Staff-centre relationships

### Appointment System

- `appointments`: Appointment records with status tracking
- `clinician_availability_rules`: Recurring availability patterns
- `clinician_slot_exceptions`: Specific date/time blocks
- `blocked_slots`: Admin-blocked slots with reasons
- `appointment_status_history`: Audit trail for status changes

### Payment System

- `payments`: Payment transactions via Razorpay
- Tracks: order_id, payment_id, status, amount, method
- Supports: Online payments and direct payments (CASH/CARD/UPI)

### Session Management

- `auth_sessions`: JWT refresh tokens
- `clinician_notes_history`: Session notes by clinicians
- `follow_up_appointments`: Follow-up scheduling

### Notifications

- `notifications`: Staff notifications (appointment confirmations, reminders)
- `patient_notifications`: Patient notifications (WhatsApp messages)

## Authentication & Authorization

### Patient Authentication

1. User enters phone number
2. OTP sent via WhatsApp (Gallabox)
3. OTP verified, user created/logged in
4. JWT access token (15m) and refresh token (7d) issued
5. Tokens stored in localStorage
6. Auto-refresh on token expiry

### Staff Authentication

Multiple methods supported:

1. Phone + OTP (WhatsApp)
2. Phone + Password
3. Username + Password

Role-based access control enforced at API level.

### Roles & Permissions

- ADMIN: Full system access
- MANAGER: Multi-centre management
- CENTRE_MANAGER: Single centre management
- CARE_COORDINATOR: Appointment coordination
- FRONT_DESK: Patient check-in, booking
- CLINICIAN: Session management, notes

## Payment Flow

### Patient Booking Flow

1. Patient selects slot and creates appointment (status: BOOKED)
2. Frontend initiates Razorpay order creation
3. Backend creates Razorpay order and payment record
4. Razorpay Checkout modal opens on frontend
5. Payment completed, Razorpay sends webhook
6. Backend verifies webhook signature
7. Appointment status updated to CONFIRMED
8. WhatsApp confirmation sent to patient

### Admin Booking Flow

1. Staff creates appointment for patient
2. Staff generates Razorpay payment link
3. Payment link sent to patient via WhatsApp
4. Patient pays via link (30-minute expiry)
5. Razorpay sends payment_link.paid webhook
6. Backend confirms appointment
7. WhatsApp confirmation sent

### Direct Payment Flow

1. Staff creates appointment
2. Patient pays at front desk (CASH/CARD/UPI)
3. Staff confirms payment in admin panel
4. Appointment status updated to CONFIRMED
5. No online payment record created

## Slot Management System

### Availability Rules

- Clinicians have recurring availability rules (day of week, time ranges)
- Rules define regular working hours per centre
- Multiple rules per day allowed (split shifts)

### Slot Exceptions

- Override availability for specific dates/times
- Used for: Leaves, breaks, emergency blocks
- Higher priority than availability rules

### Blocked Slots

- Admin-initiated blocks for entire days/time ranges
- Requires reason and affected patient notification
- Audit trail maintained

### Slot Generation Algorithm

1. Check availability rules for requested date
2. Apply slot exceptions (blocks)
3. Check existing appointments (booked slots)
4. Check blocked_slots table
5. Return available slots with 15/30/45/60-minute durations

## Notification System

### WhatsApp Notifications (Gallabox)

- Appointment confirmations
- Payment link delivery
- Appointment reminders
- Cancellation notifications
- Rescheduling notifications

### In-App Notifications

- Patient dashboard notifications
- Staff dashboard notifications
- Real-time updates on appointment status changes

## External Integrations

### Razorpay

- Order creation
- Payment verification
- Webhook handling (payment.captured, payment.failed, payment_link.paid, payment_link.expired)
- Refund processing

### Gallabox (WhatsApp Business API)

- Template message sending
- OTP delivery
- Appointment notifications
- Payment links

### Google Meet

- Automated meeting link generation
- Calendar integration
- Meeting link storage in appointments table

### AWS S3 + CloudFront

- Clinician profile picture storage
- Image delivery via CDN
- 10MB upload limit

## Security Measures

### API Security

- CORS whitelist (production domains only)
- Helmet for security headers
- Rate limiting (global and auth-specific)
- Request timeout (30s)
- JWT token expiry and rotation
- Webhook signature verification

### Data Security

- Password hashing with bcrypt
- SQL injection prevention (parameterized queries)
- XSS protection
- HTTPS-only in production
- Environment variable isolation

### Access Control

- Role-based authorization middleware
- Clinician scope enforcement (access own appointments only)
- Patient data isolation (access own records only)

## Deployment Architecture

### Backend (AWS Elastic Beanstalk)

- Platform: Node.js 18 on Amazon Linux 2
- Database: AWS RDS PostgreSQL
- Load Balancer: Application Load Balancer
- Health Check: /health endpoint
- Environment Variables: Managed in EB console
- Auto-scaling: Configured based on CPU/memory

### Frontend (AWS S3 + CloudFront)

- Patient Frontend: mibo.care
- Admin Panel: admin.mibo.care
- Static file hosting on S3
- Global CDN via CloudFront
- Automatic cache invalidation on deployment
- Environment variables in build process

### Database (AWS RDS)

- Engine: PostgreSQL 14
- Instance: db.t3.micro
- Storage: 20GB SSD
- Backups: Automated daily backups (7-day retention)
- Multi-AZ: Disabled (cost optimization)

## Data Flow Examples

### Appointment Booking (Patient)

1. Frontend: GET /api/booking/available-slots
2. Backend: Query availability rules + exceptions + appointments
3. Backend: Return available slots
4. Frontend: POST /api/booking/create (authenticated)
5. Backend: Create appointment (BOOKED), create payment record
6. Backend: Return appointment + order_id
7. Frontend: Initiate Razorpay Checkout
8. Razorpay: Payment completed, webhook to /api/payments/webhook
9. Backend: Verify signature, update appointment to CONFIRMED
10. Backend: Send WhatsApp confirmation

### Clinician Session Management

1. Frontend: POST /api/appointments/:id/start-session
2. Backend: Update appointment status to IN_PROGRESS
3. Clinician conducts session
4. Frontend: POST /api/appointments/:id/clinician-notes
5. Backend: Save notes to clinician_notes_history
6. Frontend: POST /api/appointments/:id/end-session
7. Backend: Update appointment status to COMPLETED
8. Optional: POST /api/appointments/:id/schedule-followup

### Staff Creating Appointment

1. Frontend: POST /api/appointments (authenticated)
2. Backend: Validate staff role, create appointment (BOOKED)
3. Frontend: POST /api/appointments/:id/send-payment-link
4. Backend: Create Razorpay payment link, send via WhatsApp
5. Patient clicks link, pays
6. Razorpay: Webhook to /api/payments/admin-webhook
7. Backend: Update appointment to CONFIRMED

## Error Handling

### Backend

- Validation errors: 400 with detailed field errors
- Authentication errors: 401 Unauthorized
- Authorization errors: 403 Forbidden
- Not found errors: 404
- Server errors: 500 with generic message (logs detailed error)

### Frontend

- API errors: Toast notifications
- Network errors: Retry mechanism with exponential backoff
- Payment errors: Razorpay error modal
- Form validation: Inline error messages

## Monitoring & Logging

### Backend Logging

- Winston logger with multiple transports
- Development: Console output with colors
- Production: File output + error logs
- Log levels: error, warn, info, debug

### Application Metrics

- Database connection pool status
- API response times
- Payment success/failure rates
- OTP delivery success rates

## Performance Optimizations

### Backend

- Database connection pooling
- Indexed columns (user phone, appointment date, clinician_id)
- Query optimization with joins
- Rate limiting to prevent abuse

### Frontend

- Code splitting with React.lazy
- Image optimization with lazy loading
- Vite build optimizations
- CDN for static assets

## Scalability Considerations

### Current Operation Size

- Supports 3 centres (Bangalore, Kochi, Mumbai)
- 50+ clinicians
- 1000+ patients
- 100+ appointments/day
