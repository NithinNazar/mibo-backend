# MIBO API Documentation Index

## Document Overview

| Document                         | Purpose                         | Audience                    | Page Count  |
| -------------------------------- | ------------------------------- | --------------------------- | ----------- |
| QUICK_START.md                   | Get started in 5 minutes        | New developers              | 2 pages     |
| API_REFERENCE.md                 | Complete endpoint reference     | All developers              | 8 pages     |
| WORKFLOWS.md                     | Step-by-step integration guides | Integration developers      | 6 pages     |
| ARCHITECTURE.md                  | System design and technology    | Technical leads, architects | 7 pages     |
| DEPLOYMENT.md                    | AWS deployment architecture     | DevOps, deployment          | 5 pages     |
| MIBO_API_Postman_Collection.json | Ready-to-use API collection     | All developers              | Import file |
| README.md                        | Documentation overview          | All users                   | 1 page      |

## Reading Path by Role

### Frontend Developer

1. QUICK_START.md - Setup and test
2. API_REFERENCE.md - Endpoint reference
3. WORKFLOWS.md - Patient booking and dashboard flows
4. Postman Collection - Testing

### Backend Developer

1. ARCHITECTURE.md - System design
2. API_REFERENCE.md - All endpoints
3. WORKFLOWS.md - Business logic flows
4. Postman Collection - Testing

### Integration Partner

1. QUICK_START.md - Initial setup
2. WORKFLOWS.md - Integration patterns
3. API_REFERENCE.md - Specific endpoints needed
4. Postman Collection - Testing integration

### Technical Lead / Architect

1. ARCHITECTURE.md - Complete system overview
2. API_REFERENCE.md - API capabilities
3. WORKFLOWS.md - Business processes

### QA / Tester

1. QUICK_START.md - Environment setup
2. Postman Collection - Test cases
3. WORKFLOWS.md - Test scenarios
4. API_REFERENCE.md - Expected responses

## API Modules Summary

### Authentication (2 modules)

- Staff Authentication: Username/password and phone/OTP
- Patient Authentication: Phone/OTP only

### Core Modules (6 modules)

- Appointments: Comprehensive appointment management
- Booking: Patient-facing appointment booking
- Payments: Razorpay integration, payment tracking
- Centres: Clinic location management
- Clinicians: Doctor profiles and scheduling
- Patients: Patient records and history

### Support Modules (7 modules)

- Patient Dashboard: Patient self-service portal
- Staff Management: User and role management
- Analytics: Reports and metrics
- Slot Blocking: Admin slot management
- Video Conferencing: Google Meet integration
- Notifications: WhatsApp and in-app notifications
- File Upload: S3 image storage

### Utility

- Health Check: System status monitoring

## Quick Reference

### Authentication Endpoints

- Staff: `/api/auth/*`
- Patient: `/api/patient-auth/*`

### Public Endpoints (No Auth Required)

- `/api/centres` - Get centres
- `/api/clinicians` - Get clinicians
- `/api/booking/available-slots` - Get available slots
- `/api/health` - Health check

### Patient Endpoints

- `/api/booking/*` - Booking flow
- `/api/patient/*` - Dashboard and profile
- `/api/patient/notifications/*` - Notifications

### Staff Endpoints

- `/api/appointments/*` - Appointment management
- `/api/patients/*` - Patient management
- `/api/users/*` - Staff management
- `/api/analytics/*` - Analytics and reports
- `/api/admin/slots/*` - Slot blocking

### Payment Endpoints

- `/api/payments/*` - Payment processing
- Webhooks: `/api/payments/webhook`, `/api/payments/admin-webhook`

## Technology Reference

### Backend Stack

- Node.js 18+ with Express and TypeScript
- PostgreSQL 14 database
- JWT authentication
- Razorpay payments
- Gallabox WhatsApp API
- AWS S3 + CloudFront storage
- Deployed on AWS Elastic Beanstalk

### Frontend Stack

- React 18 with TypeScript and Vite
- Patient site: mibo.care
- Admin panel: admin.mibo.care
- Deployed on AWS S3 + CloudFront

## Database Tables

### Core Tables (8 tables)

- users, roles, user_roles
- patient_profiles, clinician_profiles, staff_profiles
- centres, centre_staff_assignments

### Business Tables (5 tables)

- appointments, payments
- clinician_availability_rules, clinician_slot_exceptions
- blocked_slots

### Audit & History (4 tables)

- auth_sessions, appointment_status_history
- clinician_notes_history, follow_up_appointments
- slot_blocking_audit

### Notifications (2 tables)

- notifications (staff), patient_notifications

## Support Information

### Production URLs

- API: https://api.mibo.care/api
- Patient Frontend: https://mibo.care
- Admin Panel: https://admin.mibo.care

### Development URLs

- API: http://localhost:5000/api
- Patient Frontend: http://localhost:5173
- Admin Panel: http://localhost:5174

### Contact

- Technical Support: tech@mibo.care
- Documentation Issues: Submit issue in repository

## Version History

### Version 1.0.0 (Current)

- Complete API documentation
- Postman collection
- Architecture overview
- Workflow guides
- Quick start guide

## Document Standards

All documentation follows these standards:

- No emojis
- Precise and concise
- Facts over opinions
- Code examples in correct format
- Markdown formatting
- Regular updates with API changes

## Contributing

When updating documentation:

1. Maintain consistent format
2. Update INDEX.md if adding new documents
3. Keep examples current
4. Test all code samples
5. Update version history
