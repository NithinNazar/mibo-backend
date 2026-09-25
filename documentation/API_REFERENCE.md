# MIBO API Reference

Base URL: `https://api.mibo.care/api`

## Authentication

Most endpoints require JWT authentication via Bearer token in the Authorization header.

### Staff Authentication (`/auth`)

| Endpoint                        | Method | Auth | Description                                       |
| ------------------------------- | ------ | ---- | ------------------------------------------------- |
| `/auth/send-otp`                | POST   | No   | Send OTP to staff phone number for authentication |
| `/auth/login/phone-otp`         | POST   | No   | Login staff user with phone and OTP               |
| `/auth/login/phone-password`    | POST   | No   | Login staff user with phone and password          |
| `/auth/login/username-password` | POST   | No   | Login staff user with username and password       |
| `/auth/refresh`                 | POST   | No   | Refresh access token using refresh token          |
| `/auth/logout`                  | POST   | Yes  | Logout staff user and invalidate tokens           |
| `/auth/me`                      | GET    | Yes  | Get current authenticated staff user profile      |

### Patient Authentication (`/patient-auth`)

| Endpoint                            | Method | Auth | Description                                                        |
| ----------------------------------- | ------ | ---- | ------------------------------------------------------------------ |
| `/patient-auth/send-otp`            | POST   | No   | Send OTP to patient phone via WhatsApp                             |
| `/patient-auth/verify-otp`          | POST   | No   | Verify OTP and login/signup patient                                |
| `/patient-auth/login-with-password` | POST   | No   | Login patient with username and password for Razorpay verification |
| `/patient-auth/refresh-token`       | POST   | No   | Refresh patient access token                                       |
| `/patient-auth/logout`              | POST   | No   | Logout patient and invalidate refresh token                        |
| `/patient-auth/me`                  | GET    | Yes  | Get current authenticated patient profile                          |

## Appointments (`/appointments`)

Used by admin panel for comprehensive appointment management.

| Endpoint                                   | Method | Auth | Roles                                                        | Description                                                                    |
| ------------------------------------------ | ------ | ---- | ------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `/appointments`                            | GET    | Yes  | All                                                          | Get appointments with filters (centreId, clinicianId, patientId, date, status) |
| `/appointments`                            | POST   | Yes  | Admin, Manager, Centre Manager, Care Coordinator, Front Desk | Create new appointment                                                         |
| `/appointments/:id`                        | GET    | Yes  | All                                                          | Get appointment by ID with full details                                        |
| `/appointments/:id`                        | PUT    | Yes  | Admin, Manager, Centre Manager, Care Coordinator, Clinician  | Update appointment (reschedule or status change)                               |
| `/appointments/:id`                        | DELETE | Yes  | Admin, Manager, Centre Manager, Care Coordinator, Front Desk | Cancel appointment with reason                                                 |
| `/appointments/:id/notes`                  | PATCH  | Yes  | Clinician, Admin, Manager                                    | Update appointment notes                                                       |
| `/appointments/availability`               | GET    | Yes  | All                                                          | Get clinician availability for specific date                                   |
| `/appointments/my-appointments`            | GET    | Yes  | Clinician                                                    | Get current clinician's appointments (current, upcoming, past)                 |
| `/appointments/dashboard/stats`            | GET    | Yes  | Clinician                                                    | Get clinician dashboard statistics                                             |
| `/appointments/dashboard/appointments`     | GET    | Yes  | Clinician                                                    | Get clinician dashboard appointments with filters                              |
| `/appointments/:id/start-session`          | POST   | Yes  | Clinician                                                    | Mark appointment as IN_PROGRESS                                                |
| `/appointments/:id/end-session`            | POST   | Yes  | Clinician                                                    | Mark appointment as COMPLETED                                                  |
| `/appointments/:id/clinician-notes`        | POST   | Yes  | Clinician                                                    | Save clinician notes for session                                               |
| `/appointments/:id/previous-notes`         | GET    | Yes  | Clinician                                                    | Get previous session notes for patient                                         |
| `/appointments/:id/schedule-followup`      | POST   | Yes  | Clinician                                                    | Schedule follow-up appointment                                                 |
| `/appointments/:id/send-payment-link`      | POST   | Yes  | Admin, Manager, Front Desk, Care Coordinator                 | Send Razorpay payment link via WhatsApp                                        |
| `/appointments/:id/confirm-direct-payment` | POST   | Yes  | Admin, Manager, Front Desk, Care Coordinator                 | Confirm direct payment (CASH/CARD/UPI)                                         |

## Booking (`/booking`)

Used by patient frontend for appointment booking flow.

| Endpoint                       | Method | Auth | Description                                             |
| ------------------------------ | ------ | ---- | ------------------------------------------------------- |
| `/booking/available-slots`     | GET    | No   | Get available time slots for clinician on specific date |
| `/booking/dates-with-slots`    | GET    | No   | Get dates with available slots within date range        |
| `/booking/next-available-slot` | GET    | No   | Get next immediate available slot for clinician         |
| `/booking/clinician-slots`     | GET    | No   | Get clinician slots within date range (for admin panel) |
| `/booking/create`              | POST   | Yes  | Create new appointment for logged-in patient            |
| `/booking/my-appointments`     | GET    | Yes  | Get all appointments for logged-in patient              |
| `/booking/:id`                 | GET    | Yes  | Get appointment details by ID                           |
| `/booking/:id/cancel`          | POST   | Yes  | Cancel appointment with reason                          |
| `/booking/front-desk`          | POST   | Yes  | Book appointment for patient (front desk staff only)    |

## Payments (`/payments`)

| Endpoint                            | Method | Auth | Description                                                                 |
| ----------------------------------- | ------ | ---- | --------------------------------------------------------------------------- |
| `/payments/create-order`            | POST   | Yes  | Create Razorpay order for appointment                                       |
| `/payments/verify`                  | POST   | Yes  | Verify payment signature and update appointment status                      |
| `/payments/webhook`                 | POST   | No   | Handle Razorpay webhooks for patient payment flow                           |
| `/payments/admin-webhook`           | POST   | No   | Handle Razorpay webhooks for admin booking flow (payment_link.paid/expired) |
| `/payments/history`                 | GET    | Yes  | Get payment history for logged-in patient                                   |
| `/payments/registration-fee-status` | GET    | Yes  | Check if user has paid registration fee                                     |
| `/payments/send-link`               | POST   | Yes  | Send payment link to patient via WhatsApp                                   |
| `/payments/failure`                 | POST   | Yes  | Record payment failure and cancel appointment                               |
| `/payments/:appointmentId`          | GET    | Yes  | Get payment details for appointment                                         |
| `/payments/create-link`             | POST   | Yes  | Create Razorpay payment link and send via WhatsApp (front desk)             |
| `/payments/verify/:paymentLinkId`   | GET    | Yes  | Verify payment link status                                                  |

## Centres (`/centres`)

| Endpoint                     | Method | Auth | Roles                          | Description                               |
| ---------------------------- | ------ | ---- | ------------------------------ | ----------------------------------------- |
| `/centres`                   | GET    | No   | Public                         | Get all centres with optional city filter |
| `/centres/:id`               | GET    | No   | Public                         | Get centre by ID                          |
| `/centres`                   | POST   | Yes  | Admin, Manager                 | Create new centre                         |
| `/centres/:id`               | PUT    | Yes  | Admin, Manager, Centre Manager | Update centre details                     |
| `/centres/:id`               | DELETE | Yes  | Admin                          | Delete centre (soft delete)               |
| `/centres/:id/toggle-active` | PATCH  | Yes  | Admin, Manager                 | Toggle centre active status               |

## Clinicians (`/clinicians` via `/users`)

| Endpoint                                                | Method | Auth | Roles                          | Description                                            |
| ------------------------------------------------------- | ------ | ---- | ------------------------------ | ------------------------------------------------------ |
| `/clinicians`                                           | GET    | No   | Public                         | Get clinicians with filters (centreId, specialization) |
| `/clinicians/:id`                                       | GET    | No   | Public                         | Get clinician by ID                                    |
| `/clinicians`                                           | POST   | Yes  | Admin, Manager, Centre Manager | Create new clinician                                   |
| `/clinicians/:id`                                       | PUT    | Yes  | Admin, Manager, Centre Manager | Update clinician details                               |
| `/clinicians/:id`                                       | DELETE | Yes  | Admin, Manager, Centre Manager | Delete clinician (soft delete)                         |
| `/clinicians/:id/toggle-active`                         | PATCH  | Yes  | Admin, Manager, Centre Manager | Toggle clinician active status                         |
| `/clinicians/:id/credentials`                           | PATCH  | Yes  | Admin, Manager                 | Update clinician username and password                 |
| `/clinicians/:id/availability`                          | GET    | No   | Public                         | Get clinician availability rules                       |
| `/clinicians/:id/availability`                          | PUT    | Yes  | Admin, Manager, Centre Manager | Update clinician availability rules                    |
| `/clinicians/:clinicianId/availability/:ruleId`         | DELETE | Yes  | Admin, Manager, Centre Manager | Delete specific availability rule                      |
| `/clinicians/:clinicianId/availability/delete-by-day`   | POST   | Yes  | Admin, Manager, Centre Manager | Delete all availability rules for specific day         |
| `/clinicians/:clinicianId/availability/by-day`          | GET    | Yes  | Admin, Manager, Centre Manager | Get availability rules grouped by day                  |
| `/clinicians/:clinicianId/slot-exceptions`              | POST   | Yes  | Admin, Manager, Centre Manager | Create slot exception (block specific slot)            |
| `/clinicians/:clinicianId/slot-exceptions`              | GET    | Yes  | Admin, Manager, Centre Manager | Get slot exceptions with date range filter             |
| `/clinicians/:clinicianId/slot-exceptions/:exceptionId` | DELETE | Yes  | Admin, Manager, Centre Manager | Delete slot exception (unblock slot)                   |
| `/clinicians/:id/slots`                                 | GET    | No   | Public                         | Get clinician time slots for specific date             |

## Staff Management (`/users`)

| Endpoint                   | Method | Auth | Roles          | Description                                      |
| -------------------------- | ------ | ---- | -------------- | ------------------------------------------------ |
| `/users`                   | GET    | Yes  | Admin          | Get all staff users with role and centre filters |
| `/users`                   | POST   | Yes  | Admin          | Create staff user                                |
| `/users/:id`               | GET    | Yes  | Admin          | Get staff user by ID                             |
| `/users/:id`               | PUT    | Yes  | Admin          | Update staff user                                |
| `/users/:id`               | DELETE | Yes  | Admin          | Delete staff user (soft delete)                  |
| `/users/:id/toggle-active` | PATCH  | Yes  | Admin, Manager | Toggle staff active status                       |
| `/users/managers`          | POST   | Yes  | Admin          | Create manager staff                             |
| `/users/centre-managers`   | POST   | Yes  | Admin          | Create centre manager staff                      |
| `/users/care-coordinators` | POST   | Yes  | Admin          | Create care coordinator staff                    |
| `/users/front-desk`        | POST   | Yes  | Admin, Manager | Create front desk staff                          |

## Patients (`/patients`)

Used by staff to manage patient records.

| Endpoint                     | Method | Auth | Roles                                                                   | Description                                    |
| ---------------------------- | ------ | ---- | ----------------------------------------------------------------------- | ---------------------------------------------- |
| `/patients`                  | GET    | Yes  | Admin, Manager, Centre Manager, Care Coordinator, Front Desk            | Get patients with search filters (name, phone) |
| `/patients/:id`              | GET    | Yes  | Admin, Manager, Centre Manager, Care Coordinator, Front Desk, Clinician | Get patient by ID with full details            |
| `/patients`                  | POST   | Yes  | Admin, Manager, Centre Manager, Care Coordinator, Front Desk            | Create new patient record                      |
| `/patients/:id`              | PUT    | Yes  | Admin, Manager, Centre Manager, Care Coordinator, Front Desk            | Update patient profile                         |
| `/patients/:id/appointments` | GET    | Yes  | Admin, Manager, Centre Manager, Care Coordinator, Front Desk, Clinician | Get patient appointment history                |
| `/patients/:id/notes`        | POST   | Yes  | Clinician, Admin                                                        | Add medical note to patient                    |

## Patient Dashboard (`/patient`)

Used by patient frontend for self-service dashboard.

| Endpoint                           | Method | Auth | Description                                                   |
| ---------------------------------- | ------ | ---- | ------------------------------------------------------------- |
| `/patient/dashboard`               | GET    | Yes  | Get patient dashboard overview (upcoming appointments, stats) |
| `/patient/appointments`            | GET    | Yes  | Get all patient appointments                                  |
| `/patient/payments`                | GET    | Yes  | Get all patient payments                                      |
| `/patient/profile`                 | GET    | Yes  | Get patient profile                                           |
| `/patient/profile`                 | PUT    | Yes  | Update patient profile                                        |
| `/patient/appointments/:id/cancel` | POST   | Yes  | Request appointment cancellation with reason                  |

## Patient Notifications (`/patient/notifications`)

| Endpoint                                      | Method | Auth | Description                            |
| --------------------------------------------- | ------ | ---- | -------------------------------------- |
| `/patient/notifications`                      | GET    | Yes  | Get patient notifications with filters |
| `/patient/notifications/unread-count`         | GET    | Yes  | Get unread notification count          |
| `/patient/notifications/:notificationId/read` | PUT    | Yes  | Mark notification as read              |

## Staff Notifications (`/notifications`)

| Endpoint                                  | Method | Auth | Roles                                                        | Description                                |
| ----------------------------------------- | ------ | ---- | ------------------------------------------------------------ | ------------------------------------------ |
| `/notifications/appointment-confirmation` | POST   | Yes  | Admin, Manager, Centre Manager, Care Coordinator, Front Desk | Send appointment confirmation notification |
| `/notifications/appointment-reminder`     | POST   | Yes  | Admin, Manager                                               | Send appointment reminder notification     |
| `/notifications/history`                  | GET    | Yes  | Admin, Manager                                               | Get notification history with filters      |
| `/notifications/stats`                    | GET    | Yes  | Admin, Manager                                               | Get notification statistics                |
| `/notifications/:id`                      | GET    | Yes  | Admin, Manager, Centre Manager                               | Get notification by ID                     |

## Analytics (`/analytics`)

| Endpoint                     | Method | Auth | Roles                          | Description                                                          |
| ---------------------------- | ------ | ---- | ------------------------------ | -------------------------------------------------------------------- |
| `/analytics/dashboard`       | GET    | Yes  | Admin, Manager, Centre Manager | Get dashboard metrics (total patients, doctors, follow-ups, revenue) |
| `/analytics/top-doctors`     | GET    | Yes  | Admin, Manager, Centre Manager | Get top performing doctors with optional centre filter               |
| `/analytics/revenue`         | GET    | Yes  | Admin, Manager, Centre Manager | Get revenue data by period with optional centre filter               |
| `/analytics/leads-by-source` | GET    | Yes  | Admin, Manager, Centre Manager | Get appointment sources distribution                                 |

## Slot Blocking (`/admin/slots`)

| Endpoint                         | Method | Auth | Description                                     |
| -------------------------------- | ------ | ---- | ----------------------------------------------- |
| `/admin/slots/block`             | POST   | Yes  | Block single slot for clinician                 |
| `/admin/slots/block-multiple`    | POST   | Yes  | Block multiple slots at once                    |
| `/admin/slots/block-day`         | POST   | Yes  | Block all slots for clinician on specific day   |
| `/admin/slots/unblock/:slotId`   | POST   | Yes  | Unblock previously blocked slot                 |
| `/admin/slots/blocked`           | GET    | Yes  | Get blocked slots with filters                  |
| `/admin/slots/affected-patients` | POST   | Yes  | Get affected patients (preview before blocking) |

## Video Conferencing (`/video`)

| Endpoint                           | Method | Auth | Roles                                                        | Description                               |
| ---------------------------------- | ------ | ---- | ------------------------------------------------------------ | ----------------------------------------- |
| `/video/generate-meet-link`        | POST   | Yes  | Admin, Manager, Centre Manager, Care Coordinator, Front Desk | Generate Google Meet link for appointment |
| `/video/appointment/:id/meet-link` | GET    | Yes  | All                                                          | Get Meet link for appointment             |
| `/video/appointment/:id/meet-link` | PUT    | Yes  | Admin, Manager, Centre Manager                               | Update Meet link for appointment          |
| `/video/appointment/:id/meet-link` | DELETE | Yes  | Admin, Manager, Centre Manager                               | Delete Meet link for appointment          |
| `/video/links`                     | GET    | Yes  | Admin, Manager                                               | Get all video links with filters          |

## File Upload (`/upload`)

| Endpoint                    | Method | Auth | Description                                                    |
| --------------------------- | ------ | ---- | -------------------------------------------------------------- |
| `/upload/clinician-profile` | POST   | No   | Upload clinician profile picture to S3 (max 10MB, images only) |
| `/upload/image`             | DELETE | No   | Delete image from S3                                           |

## Health Check

| Endpoint  | Method | Auth | Description                                                           |
| --------- | ------ | ---- | --------------------------------------------------------------------- |
| `/health` | GET    | No   | Health check endpoint for load balancers (returns 200 OK with uptime) |

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
    "message": "Error description"
  }
}
```

## Rate Limits

- Global: 100 requests/minute/IP
- Authentication endpoints: 5 requests/minute/IP
- Request timeout: 30 seconds

## Status Codes

- 200: Success
- 201: Created
- 400: Bad Request (validation error)
- 401: Unauthorized (missing or invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 408: Request Timeout
- 429: Too Many Requests (rate limit exceeded)
- 500: Internal Server Error
