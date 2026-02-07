# Backend Overview

## Project Information

**Project Name**: Mibo Mental Health Clinic Booking System - Backend  
**Architecture**: Monolithic REST API  
**Language**: TypeScript  
**Runtime**: Node.js (v18+)  
**Framework**: Express.js  
**Database**: PostgreSQL  
**ORM**: pg-promise

---

## Architecture

### Monolithic Layered Architecture

```
┌─────────────────────────────────────────┐
│         Client Applications             │
│  (Patient App, Admin Panel, Frontend)  │
└─────────────────┬───────────────────────┘
                  │ HTTP/REST
┌─────────────────▼───────────────────────┐
│           Routes Layer                  │
│  (HTTP request routing & validation)    │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│        Controllers Layer                │
│  (Request/Response handling)            │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Services Layer                  │
│  (Business logic & orchestration)       │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│       Repositories Layer                │
│  (Database operations & queries)        │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│        PostgreSQL Database              │
└─────────────────────────────────────────┘
```

---

## Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── db.ts           # Database connection
│   │   ├── env.ts          # Environment variables
│   │   ├── logger.ts       # Winston logger
│   │   └── gallabox.ts     # Gallabox config
│   │
│   ├── controllers/         # Request handlers
│   │   ├── auth.controllers.ts
│   │   ├── patient-auth.controller.ts
│   │   ├── appointment.controller.ts
│   │   ├── booking.controller.ts
│   │   ├── staff.controller.ts
│   │   ├── patient.controller.ts
│   │   ├── centre.controller.ts
│   │   ├── payment.controller.ts
│   │   ├── video.controller.ts
│   │   ├── analytics.controller.ts
│   │   └── notification.controller.ts
│   │
│   ├── services/            # Business logic
│   │   ├── auth.services.ts
│   │   ├── patient-auth.service.ts
│   │   ├── appointment.services.ts
│   │   ├── booking.service.ts
│   │   ├── staff.service.ts
│   │   ├── patient.services.ts
│   │   ├── centre.service.ts
│   │   ├── payment.service.ts
│   │   ├── payment-link.service.ts
│   │   ├── video.service.ts
│   │   ├── analytics.service.ts
│   │   └── notification.service.ts
│   │
│   ├── repositories/        # Database operations
│   │   ├── user.repository.ts
│   │   ├── patient.repository.ts
│   │   ├── appointment.repository.ts
│   │   ├── booking.repository.ts
│   │   ├── staff.repository.ts
│   │   ├── centre.repository.ts
│   │   ├── payment.repository.ts
│   │   ├── video.repository.ts
│   │   ├── analytics.repository.ts
│   │   └── notification.repository.ts
│   │
│   ├── routes/              # API routes
│   │   ├── index.ts        # Main router
│   │   ├── auth.routes.ts
│   │   ├── patient-auth.routes.ts
│   │   ├── appointment.routes.ts
│   │   ├── booking.routes.ts
│   │   ├── staff.routes.ts
│   │   ├── patient.routes.ts
│   │   ├── centre.routes.ts
│   │   ├── payment.routes.ts
│   │   ├── video.routes.ts
│   │   ├── analytics.routes.ts
│   │   └── notification.routes.ts
│   │
│   ├── middlewares/         # Express middlewares
│   │   ├── auth.middleware.ts      # JWT authentication
│   │   ├── role.middleware.ts      # Role-based access
│   │   ├── error.middleware.ts     # Error handling
│   │   └── validation.middleware.ts # Request validation
│   │
│   ├── validations/         # Input validation schemas
│   │   ├── auth.validations.ts
│   │   ├── appointment.validations.ts
│   │   ├── staff.validation.ts
│   │   ├── patient.validation.ts
│   │   ├── centre.validation.ts
│   │   └── payment.validation.ts
│   │
│   ├── utils/               # Utility functions
│   │   ├── jwt.ts          # JWT token generation
│   │   ├── password.ts     # Password hashing
│   │   ├── otp.ts          # OTP generation
│   │   ├── email.ts        # Email sending
│   │   ├── razorpay.ts     # Razorpay integration
│   │   ├── gallabox.ts     # WhatsApp notifications
│   │   ├── google-meet.ts  # Google Meet integration
│   │   ├── apiError.ts     # Custom error class
│   │   ├── response.ts     # Response formatter
│   │   └── caseTransform.ts # Case conversion
│   │
│   ├── types/               # TypeScript types
│   │   ├── user.types.ts
│   │   ├── staff.types.ts
│   │   └── appointment.types.ts
│   │
│   ├── app.ts              # Express app setup
│   └── server.ts           # Server entry point
│
├── migrations/              # Database migrations
│   ├── update_clinician_profiles_for_dynamic_management.sql
│   └── fix_clinician_array_data.sql
│
├── dist/                    # Compiled JavaScript (build output)
├── node_modules/            # Dependencies
├── package.json             # Project dependencies
├── tsconfig.json            # TypeScript configuration
├── jest.config.js           # Jest test configuration
├── .env                     # Environment variables
├── .env.example             # Environment template
└── README.md                # Project documentation
```

---

## Core Features

### 1. Authentication & Authorization

- **Staff Authentication**: Phone + OTP, Phone + Password, Username + Password
- **Patient Authentication**: Phone + OTP via WhatsApp (Gallabox)
- **JWT Tokens**: Access tokens (15 min) + Refresh tokens (7 days)
- **Role-Based Access Control (RBAC)**: 7 roles with granular permissions

### 2. Appointment Management

- Create, update, reschedule, cancel appointments
- Role-based appointment access
- Clinician availability checking
- Automatic slot management
- Appointment status tracking (PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW)

### 3. Payment Integration

- **Razorpay Integration**: Payment orders, verification, webhooks
- **Automatic Payment Links**: Generated and sent via WhatsApp after appointment creation
- Payment status tracking (PENDING, PAID, FAILED, REFUNDED)
- Payment history and receipts

### 4. WhatsApp Notifications (Gallabox)

- OTP delivery for patient authentication
- Appointment confirmations
- Appointment reminders
- Payment link delivery
- Notification history and analytics

### 5. Video Conferencing

- **Google Meet Integration**: Automatic meet link generation
- Meet link management for online consultations
- Calendar event creation

### 6. Dynamic Clinician Management

- JSONB arrays for specializations and qualifications
- Profile picture upload (URL or file)
- Availability schedule builder (day-wise time slots)
- Public clinician directory (no auth required)
- Filterable by specialization and centre

### 7. Patient Management

- Patient registration and profile management
- Medical history tracking
- Appointment history
- Emergency contact information
- Patient dashboard

### 8. Centre Management

- Multi-location support
- Centre-specific staff and clinicians
- Centre-based filtering

### 9. Analytics Dashboard

- Dashboard metrics (patients, doctors, revenue, appointments)
- Top performing doctors
- Revenue analytics by period
- Lead source distribution
- Centre-specific analytics

### 10. Staff Management

- Create and manage staff users
- Role assignment (ADMIN, MANAGER, CLINICIAN, etc.)
- Centre assignment
- Active/inactive status management

---

## Technology Stack

### Core Technologies

- **Runtime**: Node.js v18+
- **Language**: TypeScript
- **Framework**: Express.js v5
- **Database**: PostgreSQL
- **Database Client**: pg-promise

### Authentication & Security

- **JWT**: jsonwebtoken
- **Password Hashing**: bcrypt
- **Security Headers**: helmet
- **CORS**: cors
- **Rate Limiting**: express-rate-limit

### Validation

- **Input Validation**: express-validator, Joi
- **Schema Validation**: Custom validation middleware

### External Integrations

- **Payment Gateway**: Razorpay SDK
- **WhatsApp**: Gallabox API
- **Video**: Google Meet API (googleapis)
- **Email**: Nodemailer

### Logging & Monitoring

- **Logger**: Winston
- **HTTP Logging**: Morgan

### Testing

- **Test Framework**: Jest
- **Property-Based Testing**: fast-check
- **Test Coverage**: Jest coverage

### Development Tools

- **TypeScript Compiler**: tsc
- **Dev Server**: ts-node-dev
- **Code Quality**: ESLint, Prettier

---

## Database Schema

### Core Tables

#### 1. users

- Staff user accounts
- Columns: id, full_name, phone, email, password_hash, role_id, is_active, created_at, updated_at

#### 2. patients

- Patient records
- Columns: id, full_name, phone, email, date_of_birth, gender, blood_group, emergency_contact_name, emergency_contact_phone, created_at, updated_at

#### 3. roles

- User roles
- Columns: id, role_name, description

#### 4. centres

- Clinic locations
- Columns: id, name, city, address, phone, email, is_active, created_at, updated_at

#### 5. clinician_profiles

- Clinician details
- Columns: id, user_id, primary_centre_id, specialization (JSONB), qualification (JSONB), years_of_experience, consultation_fee, languages (JSONB), profile_picture_url, default_consultation_duration_minutes, is_active

#### 6. clinician_availability_rules

- Clinician availability schedule
- Columns: id, clinician_id, day_of_week, start_time, end_time, is_available

#### 7. appointments

- Appointment bookings
- Columns: id, patient_id, clinician_id, centre_id, appointment_date, appointment_time, session_type, status, consultation_fee, payment_status, meet_link, notes, created_at, updated_at

#### 8. payments

- Payment transactions
- Columns: id, appointment_id, amount, razorpay_order_id, razorpay_payment_id, payment_status, payment_method, paid_at, created_at

#### 9. auth_sessions

- JWT refresh token sessions
- Columns: id, user_id, user_type, refresh_token, expires_at, created_at

#### 10. notifications

- Notification history
- Columns: id, patient_id, appointment_id, notification_type, status, sent_at, created_at

---

## API Endpoints Summary

### Authentication

- `POST /api/auth/send-otp` - Send OTP to staff
- `POST /api/auth/login/phone-otp` - Staff login with OTP
- `POST /api/auth/login/phone-password` - Staff login with password
- `POST /api/auth/login/username-password` - Staff login with username
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout staff
- `GET /api/auth/me` - Get current staff user

### Patient Authentication

- `POST /api/patient-auth/send-otp` - Send OTP to patient
- `POST /api/patient-auth/verify-otp` - Verify OTP and login
- `POST /api/patient-auth/refresh-token` - Refresh patient token
- `POST /api/patient-auth/logout` - Logout patient
- `GET /api/patient-auth/me` - Get current patient

### Appointments

- `GET /api/appointments` - Get appointments (filtered)
- `GET /api/appointments/my-appointments` - Get clinician's appointments
- `GET /api/appointments/:id` - Get appointment by ID
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment
- `GET /api/appointments/availability` - Get clinician availability

### Booking (Patient)

- `POST /api/booking/create` - Create appointment (patient)
- `GET /api/booking/my-appointments` - Get patient appointments
- `GET /api/booking/:id` - Get appointment details
- `POST /api/booking/:id/cancel` - Cancel appointment
- `GET /api/booking/available-slots` - Get available slots (public)
- `POST /api/booking/front-desk` - Book for patient (front desk)

### Staff Management

- `GET /api/users` - Get staff users
- `GET /api/users/:id` - Get staff by ID
- `POST /api/users` - Create staff user
- `PUT /api/users/:id` - Update staff user
- `DELETE /api/users/:id` - Delete staff user
- `PATCH /api/users/:id/toggle-active` - Toggle staff active status
- `POST /api/users/managers` - Create manager
- `POST /api/users/centre-managers` - Create centre manager
- `POST /api/users/care-coordinators` - Create care coordinator
- `POST /api/users/front-desk` - Create front desk staff

### Clinicians

- `GET /api/clinicians` - Get clinicians (public)
- `GET /api/clinicians/:id` - Get clinician by ID (public)
- `POST /api/clinicians` - Create clinician
- `PUT /api/clinicians/:id` - Update clinician
- `DELETE /api/clinicians/:id` - Delete clinician
- `PATCH /api/clinicians/:id/toggle-active` - Toggle clinician active
- `PUT /api/clinicians/:id/availability` - Update availability
- `GET /api/clinicians/:id/availability` - Get availability (public)

### Patients

- `GET /api/patients` - Get patients
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/patients` - Create patient
- `PUT /api/patients/:id` - Update patient
- `GET /api/patients/:id/appointments` - Get patient appointments
- `POST /api/patients/:id/notes` - Add medical note

### Centres

- `GET /api/centres` - Get centres
- `GET /api/centres/:id` - Get centre by ID
- `POST /api/centres` - Create centre
- `PUT /api/centres/:id` - Update centre
- `DELETE /api/centres/:id` - Delete centre
- `PATCH /api/centres/:id/toggle-active` - Toggle centre active

### Payments

- `POST /api/payments/create-order` - Create payment order
- `POST /api/payments/verify` - Verify payment
- `POST /api/payments/webhook` - Razorpay webhook
- `GET /api/payments/:appointmentId` - Get payment details
- `GET /api/payments/history` - Get payment history
- `POST /api/payments/create-link` - Create payment link
- `GET /api/payments/verify/:paymentLinkId` - Verify payment link

### Video

- `POST /api/video/generate-meet-link` - Generate Google Meet link
- `GET /api/video/appointment/:id/meet-link` - Get meet link
- `PUT /api/video/appointment/:id/meet-link` - Update meet link
- `DELETE /api/video/appointment/:id/meet-link` - Delete meet link
- `GET /api/video/links` - Get all video links

### Analytics

- `GET /api/analytics/dashboard` - Get dashboard metrics
- `GET /api/analytics/top-doctors` - Get top doctors
- `GET /api/analytics/revenue` - Get revenue data
- `GET /api/analytics/leads-by-source` - Get leads by source

### Notifications

- `POST /api/notifications/appointment-confirmation` - Send confirmation
- `POST /api/notifications/appointment-reminder` - Send reminder
- `GET /api/notifications/history` - Get notification history
- `GET /api/notifications/stats` - Get notification stats
- `GET /api/notifications/:id` - Get notification by ID

### Patient Dashboard

- `GET /api/patient/dashboard` - Get dashboard overview
- `GET /api/patient/appointments` - Get appointments
- `GET /api/patient/payments` - Get payments
- `GET /api/patient/profile` - Get profile
- `PUT /api/patient/profile` - Update profile
- `POST /api/patient/appointments/:id/cancel` - Cancel appointment

---

## Security Features

### 1. Authentication

- JWT-based authentication with access and refresh tokens
- Secure password hashing with bcrypt
- OTP-based authentication for patients
- Session management with refresh token rotation

### 2. Authorization

- Role-based access control (RBAC)
- Middleware-based permission checking
- Resource-level access control

### 3. Input Validation

- Request validation using express-validator and Joi
- SQL injection prevention via parameterized queries
- XSS protection via input sanitization

### 4. Security Headers

- Helmet.js for security headers
- CORS configuration
- Rate limiting to prevent abuse

### 5. Data Protection

- Password hashing (bcrypt)
- Sensitive data encryption
- Secure token storage

---

## Environment Configuration

### Development

```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mibo_db
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

### Production

```env
NODE_ENV=production
PORT=5000
DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=5432
DB_NAME=mibo_production
CORS_ORIGIN=https://yourdomain.com
```

---

## Deployment

### AWS Elastic Beanstalk

- Platform: Node.js 18
- Instance Type: t2.micro (or higher)
- Database: AWS RDS PostgreSQL
- Environment Variables: Set via EB console

### Build Process

```bash
npm run build      # Compile TypeScript to JavaScript
npm start          # Start production server
```

### Health Check

- Endpoint: `/api/health`
- Expected Response: 200 OK

---

## Testing

### Unit Tests

```bash
npm test           # Run all tests
npm run test:watch # Watch mode
npm run test:coverage # Coverage report
```

### Property-Based Tests

- Framework: fast-check
- Location: `src/**/__tests__/*.property.test.ts`

### Test Coverage

- Target: 80%+ coverage
- Current: 56/56 tests passing

---

## Logging

### Winston Logger

- Levels: error, warn, info, debug
- Transports: Console, File
- Format: JSON (production), Pretty (development)

### Log Files

- `logs/error.log` - Error logs
- `logs/combined.log` - All logs

---

## Performance Optimization

### Database

- Connection pooling (pg-promise)
- Indexed columns (id, phone, email, appointment_date)
- Query optimization

### Caching

- In-memory caching for frequently accessed data
- Redis (future enhancement)

### Rate Limiting

- 100 requests per 15 minutes (general)
- 5 requests per 15 minutes (auth)
- 3 requests per 15 minutes (OTP)

---

## Monitoring & Maintenance

### Health Checks

- Database connectivity
- External service availability
- System uptime

### Error Tracking

- Winston error logging
- Sentry (future enhancement)

### Backup Strategy

- Daily database backups
- Automated backup retention (30 days)

---

## Future Enhancements

1. **Redis Caching**: Improve performance with Redis
2. **WebSocket Support**: Real-time notifications
3. **Email Notifications**: Nodemailer integration
4. **SMS Notifications**: Twilio integration
5. **File Upload**: S3 integration for profile pictures
6. **Advanced Analytics**: More detailed reports
7. **Audit Logs**: Track all system changes
8. **Two-Factor Authentication**: Enhanced security
9. **API Versioning**: Support multiple API versions
10. **GraphQL API**: Alternative to REST

---

## Support & Documentation

- **API Documentation**: `API_DOCUMENTATION.md`
- **Migration Guide**: `AWS_MIGRATION_GUIDE.md`
- **Deployment Guide**: `AWS_DEPLOYMENT_GUIDE.md`
- **Environment Guide**: `ENVIRONMENT_VARIABLES_GUIDE.md`

---

**Last Updated**: March 15, 2024  
**Version**: 1.0.0
