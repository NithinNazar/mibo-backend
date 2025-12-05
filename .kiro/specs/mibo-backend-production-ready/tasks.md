# Implementation Plan

- [x] 1. Fix core infrastructure and configuration

- [ ] 1.1 Create comprehensive environment configuration module

  - Implement src/config/env.ts with validation for all required environment variables
  - Add type-safe environment interface with all configuration values
  - Implement startup validation that exits if required variables are missing
  - Add support for development, staging, and production environments
  - _Requirements: 1.5, 13.1, 13.2, 13.3_

- [ ] 1.2 Fix and enhance database configuration

  - Update src/config/db.ts with proper connection pooling (min 2, max 10)
  - Add connection error handling with proper logging
  - Implement database health check function
  - Add query logging for development environment
  - _Requirements: 12.1, 12.2, 12.3_

- [ ] 1.3 Implement comprehensive logging system

  - Create src/config/logger.ts using Winston
  - Configure separate log files for errors and combined logs
  - Implement log rotation (daily, 14-day retention)
  - Add structured logging with correlation IDs
  - Mask sensitive data (passwords, tokens, OTPs) in logs
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [ ] 1.4 Enhance error handling infrastructure

  - Update src/utils/apiError.ts with comprehensive error types
  - Add error codes for all error scenarios
  - Implement error details support for validation errors
  - Update src/middlewares/error.middleware.ts to use logger
  - Add database error code handling (unique violations, foreign key violations)
  - _Requirements: 1.4, 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 1.5 Update application entry point

  - Update src/app.ts to use helmet for security headers
  - Add express-rate-limit for authentication endpoints
  - Configure request size limits
  - Add compression middleware
  - Update CORS configuration to use environment variable
  - _Requirements: 17.1, 17.2_

- [x] 2. Implement complete authentication system for staff users

- [x] 2.1 Enhance JWT utilities

  - Update src/utils/jwt.ts to support both access and refresh tokens
  - Add separate secrets and expiry times for access and refresh tokens
  - Implement token verification with proper error handling
  - Add token payload interface with userId, userType, and roles
  - _Requirements: 2.6_

- [x] 2.2 Implement password hashing utilities

  - Create src/utils/password.ts with bcrypt
  - Implement hashPassword function with cost factor 10
  - Implement verifyPassword function
  - _Requirements: 7.1_

- [x] 2.3 Create auth session repository

  - Create src/repositories/authSession.repository.ts
  - Implement createSession to store refresh token hash
  - Implement findValidSession to retrieve non-revoked sessions
  - Implement revokeSession to mark session as revoked
  - Implement cleanupExpiredSessions for maintenance
  - _Requirements: 2.7_

- [x] 2.4 Update user repository for staff authentication

  - Update src/repositories/user.repository.ts
  - Add findByPhoneStaffOnly method that filters user_type = 'STAFF'
  - Add findByUsernameStaffOnly method
  - Add findByEmailStaffOnly method
  - Update findByIdWithRoles to include centre assignments
  - Add createStaffUser method with password hashing
  - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [x] 2.5 Implement complete authentication service

  - Update src/services/auth.services.ts
  - Implement sendOtp for staff users only
  - Implement loginWithPhoneOtp with staff user validation
  - Implement loginWithPhonePassword with staff user validation
  - Implement loginWithUsernamePassword with staff user validation
  - Implement refreshAccessToken using refresh token
  - Implement logout to revoke refresh token
  - Implement getCurrentUser to fetch user with roles and centres
  - All methods must reject PATIENT users with appropriate error
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 2.6 Update authentication controller

  - Update src/controllers/auth.controllers.ts
  - Implement sendOtp endpoint handler
  - Implement loginWithPhoneOtp endpoint handler
  - Implement loginWithPhonePassword endpoint handler
  - Implement loginWithUsernamePassword endpoint handler
  - Implement refreshToken endpoint handler
  - Implement logout endpoint handler
  - Implement getCurrentUser endpoint handler
  - Return standardized AuthResponse with user object and tokens
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 2.7_

- [x] 2.7 Create authentication validation schemas

  - Update src/validations/auth.validations.ts
  - Add validation for phone number (Indian format, 10 digits)
  - Add validation for OTP (6 digits)
  - Add validation for password (minimum 8 characters)
  - Add validation for username (alphanumeric, 3-50 characters)
  - Add validation for refresh token
  - _Requirements: 15.1, 15.2, 15.4_

- [x] 2.8 Update authentication routes

  - Update src/routes/auth.routes.ts
  - Add POST /api/auth/send-otp route
  - Add POST /api/auth/login/phone-otp route
  - Add POST /api/auth/login/phone-password route
  - Add POST /api/auth/login/username-password route
  - Add POST /api/auth/refresh route
  - Add POST /api/auth/logout route (protected)
  - Add GET /api/auth/me route (protected)
  - Apply validation middleware to all routes
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 2.7_

- [x] 3. Implement role-based access control

- [x] 3.1 Update authentication middleware

  - Update src/middlewares/auth.middleware.ts
  - Enhance authenticate middleware to extract and verify JWT
  - Attach user payload (userId, userType, roles) to request object
  - Handle token expiration and invalid token errors
  - Return 401 for missing or invalid tokens
  - _Requirements: 3.5_

- [x] 3.2 Create role-based authorization middleware

  - Update src/middlewares/role.middleware.ts
  - Implement requireRole middleware that accepts array of allowed roles
  - Query user_roles table to verify user has required role
  - Return 403 if user lacks required role
  - Support multiple roles (user needs at least one matching role)
  - _Requirements: 3.1, 3.2, 3.5_

- [x] 3.3 Implement centre-scoped authorization middleware

  - Add requireCentreAccess middleware to src/middlewares/role.middleware.ts
  - Extract centreId from request params or query
  - Verify user has access to the specified centre
  - Allow ADMIN and MANAGER roles to access all centres
  - Restrict CENTRE_MANAGER, CARE_COORDINATOR, FRONT_DESK to assigned centres
  - Return 403 if user lacks centre access
  - _Requirements: 3.3_

- [x] 3.4 Implement clinician-scoped authorization middleware

  - Add requireClinicianAccess middleware to src/middlewares/role.middleware.ts
  - Extract clinicianId from request params
  - Verify CLINICIAN role users can only access their own data
  - Allow ADMIN, MANAGER, CENTRE_MANAGER to access all clinicians
  - Return 403 if user lacks access
  - _Requirements: 3.4_

- [x] 4. Implement dashboard analytics

- [x] 4.1 Create analytics repository

  - Create src/repositories/analytics.repository.ts
  - Implement getTotalPatients with current and previous period counts
  - Implement getActiveDoctors with current and previous period counts
  - Implement getFollowUpsBooked with current and previous period counts
  - Implement getTotalRevenue with current and previous period sums
  - Implement getTopDoctors query with completed appointment counts
  - Implement getRevenueByPeriod with daily/weekly/monthly aggregation
  - Implement getAppointmentsBySource with source counts
  - Add centre filtering for all queries
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 4.2 Create analytics service

  - Create src/services/analytics.service.ts
  - Implement getDashboardMetrics with percentage change calculations
  - Implement getTopDoctors with limit parameter
  - Implement getRevenueData with period parameter (week, month, year)
  - Implement getLeadsBySource with formatted response
  - Apply centre filtering based on user role
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 4.3 Create analytics controller

  - Create src/controllers/analytics.controller.ts
  - Implement getDashboardMetrics endpoint handler
  - Implement getTopDoctors endpoint handler
  - Implement getRevenueData endpoint handler
  - Implement getLeadsBySource endpoint handler
  - Extract user context from authenticated request
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 4.4 Create analytics routes

  - Create src/routes/analytics.routes.ts
  - Add GET /api/analytics/dashboard route
  - Add GET /api/analytics/top-doctors route
  - Add GET /api/analytics/revenue route with period query param
  - Add GET /api/analytics/leads-by-source route
  - Apply authentication middleware
  - Apply role middleware (ADMIN, MANAGER, CENTRE_MANAGER only)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 5. Implement appointment management

- [x] 5.1 Create appointment repository

  - Update src/repositories/appointment.repository.ts
  - Implement findAppointments with filters (centreId, clinicianId, patientId, date, status)
  - Implement findAppointmentById with joins for patient, clinician, centre names
  - Implement createAppointment with all required fields
  - Implement updateAppointment for status and schedule changes
  - Implement checkSchedulingConflicts to detect overlapping appointments
  - Implement getClinicianAvailabilityRules for a specific date
  - Implement logStatusChange to appointment_status_history table
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 5.2 Create appointment service

  - Update src/services/appointment.services.ts
  - Implement getAppointments with role-based filtering
  - Implement getAppointmentById with access control
  - Implement createAppointment with availability checking and conflict detection
  - Implement updateAppointment with status change logging
  - Implement cancelAppointment with reason recording
  - Implement checkClinicianAvailability to generate available time slots
  - Record booking source (WEB_PATIENT, ADMIN_FRONT_DESK, etc.)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 5.3 Create appointment validation schemas

  - Update src/validations/appointment.validations.ts
  - Add validation for createAppointment (patientId, clinicianId, centreId, type, scheduledStartAt, duration)
  - Add validation for updateAppointment (status, scheduledStartAt, notes)
  - Add validation for cancelAppointment (reason)
  - Add validation for availability query (clinicianId, centreId, date)
  - _Requirements: 15.1, 15.2_

- [x] 5.4 Update appointment controller

  - Update src/controllers/appointment.controller.ts
  - Implement getAppointments endpoint handler with query filters
  - Implement getAppointmentById endpoint handler
  - Implement createAppointment endpoint handler
  - Implement updateAppointment endpoint handler
  - Implement cancelAppointment endpoint handler
  - Implement getClinicianAvailability endpoint handler
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 5.5 Update appointment routes

  - Update src/routes/appointment.routes.ts
  - Add GET /api/appointments route with authentication and role-based filtering
  - Add GET /api/appointments/:id route
  - Add POST /api/appointments route with role check (ADMIN, MANAGER, CENTRE_MANAGER, CARE_COORDINATOR, FRONT_DESK)
  - Add PUT /api/appointments/:id route with role check (ADMIN, MANAGER, CENTRE_MANAGER, CARE_COORDINATOR)
  - Add DELETE /api/appointments/:id route with role check
  - Add GET /api/appointments/availability route
  - Apply validation middleware
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 6. Implement patient management

- [x] 6.1 Create patient repository

  - Update src/repositories/patient.repository.ts
  - Implement findPatients with search filters (name, phone)
  - Implement findPatientById with user details
  - Implement createPatient with user and patient_profile creation
  - Implement updatePatient for profile updates
  - Implement getPatientAppointments with appointment history
  - Implement getPatientPayments with payment history
  - Implement addMedicalNote to patient_medical_notes table
  - Implement checkPhoneExists to prevent duplicates
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 6.2 Create patient service

  - Update src/services/patient.services.ts
  - Implement getPatients with search functionality
  - Implement getPatientById with complete details (appointments, payments, notes)
  - Implement createPatient with duplicate phone check
  - Implement updatePatient with validation
  - Implement getPatientAppointments
  - Implement addMedicalNote with author tracking
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 6.3 Create patient validation schemas

  - Update src/validations/patient.validation.ts
  - Add validation for createPatient (fullName, phone, email, dateOfBirth, gender)
  - Add validation for updatePatient (partial fields)
  - Add validation for addMedicalNote (note text)
  - Add validation for search query parameters
  - _Requirements: 15.1, 15.2, 15.4, 15.5_

- [x] 6.4 Update patient controller

  - Update src/controllers/patient.controller.ts
  - Implement getPatients endpoint handler with search
  - Implement getPatientById endpoint handler
  - Implement createPatient endpoint handler
  - Implement updatePatient endpoint handler
  - Implement getPatientAppointments endpoint handler
  - Implement addMedicalNote endpoint handler
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 6.5 Update patient routes

  - Update src/routes/patient.routes.ts
  - Add GET /api/patients route with authentication
  - Add GET /api/patients/:id route
  - Add POST /api/patients route with role check (ADMIN, MANAGER, CENTRE_MANAGER, CARE_COORDINATOR, FRONT_DESK)
  - Add PUT /api/patients/:id route with role check
  - Add GET /api/patients/:id/appointments route
  - Add POST /api/patients/:id/notes route with role check (CLINICIAN, ADMIN)
  - Apply validation middleware
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 7. Implement staff and clinician management

- [x] 7.1 Create staff repository

  - Update src/repositories/staff.repository.ts
  - Implement findStaffUsers with role and centre filters
  - Implement findStaffById with roles and centre assignments
  - Implement createStaffUser with user, user_roles, and centre_staff_assignments
  - Implement updateStaffUser for profile updates
  - Implement deleteStaffUser (soft delete by setting is_active = false)
  - Implement findClinicians with centre and specialization filters
  - Implement findClinicianById with availability rules
  - Implement createClinician with clinician_profiles creation
  - Implement updateClinician for profile updates
  - Implement deleteClinician with future appointment check
  - Implement updateClinicianAvailability to manage availability rules
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 7.2 Create staff service

  - Update src/services/staff.service.ts
  - Implement getStaffUsers with filtering
  - Implement getStaffById
  - Implement createStaffUser with password hashing and role assignment
  - Implement updateStaffUser
  - Implement deleteStaffUser
  - Implement getClinicians with filtering
  - Implement getClinicianById with complete details
  - Implement createClinician with user validation
  - Implement updateClinician
  - Implement deleteClinician with appointment validation
  - Implement updateClinicianAvailability
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 7.3 Create staff validation schemas

  - Update src/validations/staff.validation.ts
  - Add validation for createStaffUser (fullName, phone, email, username, password, roleId, centreIds)
  - Add validation for updateStaffUser (partial fields)
  - Add validation for createClinician (userId, primaryCentreId, specialization, registrationNumber, experience, fee)
  - Add validation for updateClinician (partial fields)
  - Add validation for availability rules (dayOfWeek, startTime, endTime, slotDuration, mode)
  - _Requirements: 15.1, 15.2_

- [x] 7.4 Update staff controller

  - Update src/controllers/staff.controller.ts
  - Implement getStaffUsers endpoint handler
  - Implement getStaffById endpoint handler
  - Implement createStaffUser endpoint handler
  - Implement updateStaffUser endpoint handler
  - Implement deleteStaffUser endpoint handler
  - Implement getClinicians endpoint handler
  - Implement getClinicianById endpoint handler
  - Implement createClinician endpoint handler
  - Implement updateClinician endpoint handler
  - Implement deleteClinician endpoint handler
  - Implement updateClinicianAvailability endpoint handler
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 7.5 Update staff routes

  - Update src/routes/staff,routes.ts (fix filename typo to staff.routes.ts)
  - Add GET /api/users route with ADMIN role check
  - Add GET /api/users/:id route with ADMIN role check
  - Add POST /api/users route with ADMIN role check
  - Add PUT /api/users/:id route with ADMIN role check
  - Add DELETE /api/users/:id route with ADMIN role check
  - Add GET /api/clinicians route with authentication
  - Add GET /api/clinicians/:id route with authentication
  - Add POST /api/clinicians route with role check (ADMIN, CENTRE_MANAGER)
  - Add PUT /api/clinicians/:id route with role check (ADMIN, CENTRE_MANAGER)
  - Add DELETE /api/clinicians/:id route with role check (ADMIN, CENTRE_MANAGER)
  - Add PUT /api/clinicians/:id/availability route with role check
  - Apply validation middleware
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 8. Implement centre management

- [ ] 8.1 Create centre repository

  - Create src/repositories/centre.repository.ts
  - Implement findCentres with city filter
  - Implement findCentreById
  - Implement createCentre with city validation
  - Implement updateCentre
  - Implement deleteCentre (soft delete)
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 8.2 Create centre service

  - Create src/services/centre.service.ts
  - Implement getCentres with filtering
  - Implement getCentreById
  - Implement createCentre with city validation (bangalore, kochi, mumbai)
  - Implement updateCentre
  - Implement deleteCentre
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 8.3 Create centre validation schemas

  - Create src/validations/centre.validation.ts
  - Add validation for createCentre (name, city, addressLine1, pincode, contactPhone)
  - Add validation for updateCentre (partial fields)
  - Add city enum validation (bangalore, kochi, mumbai)
  - _Requirements: 15.1, 15.2_

- [ ] 8.4 Create centre controller

  - Create src/controllers/centre.controller.ts
  - Implement getCentres endpoint handler
  - Implement getCentreById endpoint handler
  - Implement createCentre endpoint handler
  - Implement updateCentre endpoint handler
  - Implement deleteCentre endpoint handler
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 8.5 Create centre routes

  - Create src/routes/centre.routes.ts
  - Add GET /api/centres route with authentication
  - Add GET /api/centres/:id route with authentication
  - Add POST /api/centres route with ADMIN role check
  - Add PUT /api/centres/:id route with role check (ADMIN, CENTRE_MANAGER)
  - Add DELETE /api/centres/:id route with ADMIN role check
  - Apply validation middleware
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 9. Implement payment integration with Razorpay

- [ ] 9.1 Create Razorpay utility

  - Update src/utils/razorpay.ts
  - Initialize Razorpay instance with key_id and key_secret from environment
  - Implement createOrder method to create Razorpay order
  - Implement verifyPaymentSignature method using crypto
  - Add error handling for Razorpay API failures
  - _Requirements: 9.1, 9.2, 9.5_

- [ ] 9.2 Create payment repository

  - Update src/repositories/payment.repository.ts
  - Implement createPayment to store payment record with status CREATED
  - Implement updatePaymentStatus to update status and payment_id
  - Implement findPaymentByOrderId
  - Implement findPaymentsByPatient
  - Implement findPaymentByAppointment
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 9.3 Create payment service

  - Update src/services/payment.service.ts
  - Implement createRazorpayOrder with appointment amount lookup
  - Implement verifyPayment with signature verification
  - Implement handlePaymentSuccess to update payment and appointment status
  - Implement handlePaymentFailure to update payment status
  - Implement getPaymentsByPatient
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 9.4 Create payment validation schemas

  - Update src/validations/payment.validation.ts
  - Add validation for createOrder (appointmentId)
  - Add validation for verifyPayment (orderId, paymentId, signature)
  - Add validation for webhook payload
  - _Requirements: 15.1, 15.2_

- [ ] 9.5 Update payment controller

  - Update src/controllers/payment.controller.ts
  - Implement createOrder endpoint handler
  - Implement verifyPayment endpoint handler
  - Implement handleWebhook endpoint handler with signature verification
  - Implement getPaymentsByPatient endpoint handler
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 9.6 Update payment routes

  - Update src/routes/payment.routes.ts
  - Add POST /api/payments/create-order route with authentication
  - Add POST /api/payments/verify route with authentication
  - Add POST /api/payments/webhook route (no authentication, signature verified)
  - Add GET /api/payments/patient/:id route with authentication
  - Apply validation middleware
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 10. Implement WhatsApp notifications via Gallabox
- [ ] 10.1 Create Gallabox utility

  - Update src/utils/gallabox.ts
  - Initialize Gallabox client with API key and secret from environment
  - Implement sendWhatsAppMessage method for plain text messages
  - Implement sendTemplateMessage method for template-based messages
  - Add error handling and retry logic for failed requests
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 10.2 Create notification repository

  - Update src/repositories/notification.repository.ts
  - Implement createNotificationLog to store notification attempts
  - Implement updateNotificationStatus to track delivery status
  - Implement getNotificationHistory with filters
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 10.3 Create notification service

  - Update src/services/notification.services.ts
  - Implement sendAppointmentConfirmation with appointment details
  - Implement sendAppointmentRescheduled with new date/time
  - Implement sendAppointmentCancelled with reason
  - Implement sendAppointmentReminder for upcoming appointments
  - Implement sendOnlineMeetingLink with Google Meet link
  - Log all notification attempts to database
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 10.4 Update notification controller

  - Update src/controllers/notification.controller.ts
  - Implement sendAppointmentConfirmation endpoint handler
  - Implement sendAppointmentReminder endpoint handler
  - Implement getNotificationHistory endpoint handler
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 10.5 Update notification routes

  - Update src/routes/notification.routes.ts
  - Add POST /api/notifications/appointment-confirmation route (system use)
  - Add POST /api/notifications/appointment-reminder route (system use)
  - Add GET /api/notifications/history route with ADMIN role check
  - Apply authentication middleware
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 11. Implement Google Meet integration for online consultations
- [ ] 11.1 Create Google Meet utility

  - Update src/utils/googleMeet.ts
  - Initialize Google Calendar API client with service account credentials
  - Implement createCalendarEvent method with Google Meet enabled
  - Implement getEventMeetLink method to extract Meet link
  - Add error handling for Google API failures
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 11.2 Create video repository

  - Update src/repositories/video.repository.ts
  - Implement storeMeetLink to save Meet link with appointment
  - Implement getMeetLinkByAppointment to retrieve stored link
  - _Requirements: 11.1, 11.2_

- [x] 11.3 Create video service

  - Update src/services/video.services.ts
  - Implement generateGoogleMeetLink for appointment
  - Implement getMeetLinkForAppointment
  - Integrate with appointment service to auto-generate links for ONLINE appointments
  - Handle Google API failures gracefully (log error, continue with appointment)
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 11.4 Update video controller

  - Update src/controllers/video.controllers.ts
  - Implement generateMeetLink endpoint handler
  - Implement getMeetLinkForAppointment endpoint handler
  - _Requirements: 11.1, 11.2_

- [x] 11.5 Update video routes

  - Update src/routes/video.routes.ts
  - Add POST /api/video/generate-meet-link route with authentication
  - Add GET /api/video/appointment/:id/meet-link route with authentication
  - _Requirements: 11.1, 11.2_

- [-] 12. Integrate modules and wire everything together

- [ ] 12.1 Update main routes index

  - Update src/routes/index.ts
  - Import and mount all route modules (auth, analytics, users, centres, clinicians, patients, appointments, payments, notifications, video)
  - Add health check endpoint GET /api/health
  - Ensure proper route ordering (specific routes before generic ones)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 12.2 Integrate notification triggers in appointment service

  - Update src/services/appointment.services.ts
  - Call notification service after successful appointment creation
  - Call notification service after appointment rescheduling
  - Call notification service after appointment cancellation
  - Include Google Meet link in notification for ONLINE appointments
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 11.2_

- [x] 12.3 Integrate Google Meet generation in appointment service

  - Update src/services/appointment.services.ts
  - Call video service to generate Meet link when appointment type is ONLINE
  - Store Meet link with appointment record
  - Handle Meet link generation failures gracefully
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 12.4 Integrate payment confirmation with appointment status

  - Update src/services/payment.service.ts
  - Update appointment status to CONFIRMED after successful payment
  - Trigger appointment confirmation notification after payment success
  - _Requirements: 9.3, 9.4, 10.1_

- [ ] 12.5 Add health check endpoint implementation

  - Create src/controllers/health.controller.ts
  - Implement health check that verifies database connection
  - Return system status, uptime, version, and database status
  - _Requirements: 17.4_

- [x] 13. Add production readiness features

- [ ] 13.1 Implement graceful shutdown

  - Update src/server.ts
  - Add SIGTERM and SIGINT signal handlers
  - Close HTTP server gracefully
  - Close database connections
  - Log shutdown process
  - _Requirements: 17.5_

- [ ] 13.2 Add security headers and rate limiting

  - Update src/app.ts
  - Configure helmet middleware for security headers
  - Add rate limiting to authentication endpoints (5 requests per minute)
  - Add global rate limiting (100 requests per minute per IP)
  - Configure request timeout (30 seconds)
  - _Requirements: 17.1, 17.2_

- [ ] 13.3 Add request/response logging

  - Update src/app.ts
  - Configure morgan for HTTP request logging
  - Log request method, path, status code, and response time
  - Use different log formats for development and production
  - _Requirements: 16.1_

- [ ] 13.4 Add database query logging

  - Update src/config/db.ts
  - Add query logging in development mode
  - Log slow queries (> 1 second) in production
  - Include query text and execution time
  - _Requirements: 16.3_

- [x] 13.5 Implement response standardization utility

  - Update src/utils/response.ts
  - Implement success response helper (ok, created)
  - Ensure consistent response format: { success: true, data: any, message?: string }
  - Update all controllers to use response helpers
  - _Requirements: 14.1_

- [x] 14. Install missing dependencies and update package.json

- [ ] 14.1 Install required production dependencies

  - Install jsonwebtoken and @types/jsonwebtoken for JWT handling
  - Install bcrypt and @types/bcrypt for password hashing
  - Install winston for logging
  - Install helmet for security headers
  - Install express-rate-limit for rate limiting
  - Install joi for validation schemas
  - Install axios for HTTP requests (if not already installed)
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 14.2 Update package.json scripts

  - Ensure dev script uses ts-node-dev with proper flags
  - Ensure build script compiles TypeScript
  - Ensure start script runs compiled JavaScript
  - Add lint script for ESLint
  - Add format script for Prettier (optional)
  - _Requirements: 1.1_

- [ ] 14.3 Create or update .env.example file

  - Create .env.example with all required environment variables
  - Add comments explaining each variable
  - Include example values (non-sensitive)
  - Document required vs optional variables
  - _Requirements: 13.1, 13.2_

- [x] 15. Fix existing code issues and ensure compilation

- [ ] 15.1 Fix TypeScript compilation errors

  - Run tsc to identify all compilation errors
  - Fix missing type definitions
  - Fix incorrect type usage
  - Ensure all imports are correct
  - Fix any syntax errors
  - _Requirements: 1.1, 1.3_

- [ ] 15.2 Fix missing or incorrect type definitions

  - Create or update src/types/user.types.ts with User, UserWithRoles, StaffUser interfaces
  - Create or update src/types/appointment.types.ts with Appointment, CreateAppointmentDTO interfaces
  - Create or update src/types/staff.types.ts with Clinician, StaffUser interfaces
  - Add missing type exports
  - _Requirements: 1.3_

- [ ] 15.3 Update existing controllers to use standardized responses

  - Update all controller methods to use ok() and created() helpers
  - Ensure all errors are thrown as ApiError instances
  - Remove any direct res.json() or res.status() calls
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 15.4 Update existing services to use proper error handling

  - Wrap database queries in try-catch blocks
  - Throw ApiError instances for business logic errors
  - Handle database constraint violations appropriately
  - _Requirements: 1.4_

- [ ] 15.5 Test application startup

  - Run npm run dev to start the application
  - Verify no runtime errors on startup
  - Verify database connection is established
  - Verify all routes are registered
  - Test health check endpoint
  - _Requirements: 1.1, 1.2, 12.1, 12.2, 12.3_

- [ ]\* 16. Create comprehensive documentation
- [ ]\* 16.1 Create API documentation

  - Document all API endpoints with request/response examples
  - Include authentication requirements
  - Include role-based access requirements
  - Add example curl commands or Postman collection
  - _Requirements: All API requirements_

- [ ]\* 16.2 Create deployment documentation

  - Document environment setup steps
  - Document database setup and migrations
  - Document production deployment process
  - Include troubleshooting guide
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ]\* 16.3 Create developer onboarding guide

  - Document project structure
  - Explain architecture and design decisions
  - Include local development setup instructions
  - Add code style guidelines
  - _Requirements: 1.1, 1.2, 1.3_

- [ ]\* 17. Write tests for critical functionality
- [ ]\* 17.1 Write unit tests for utilities

  - Test JWT token generation and verification
  - Test OTP generation and verification
  - Test password hashing and verification
  - Test validation schemas
  - _Requirements: 1.1, 1.3_

- [ ]\* 17.2 Write integration tests for authentication

  - Test phone+OTP login flow
  - Test phone+password login flow
  - Test username+password login flow
  - Test token refresh flow
  - Test logout flow
  - Test staff vs patient user rejection
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [ ]\* 17.3 Write integration tests for appointment management

  - Test appointment creation with availability checking
  - Test appointment conflict detection
  - Test appointment status updates
  - Test appointment cancellation
  - Test role-based access to appointments
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ]\* 17.4 Write integration tests for role-based access control
  - Test ADMIN access to all endpoints
  - Test FRONT_DESK restricted access
  - Test CENTRE_MANAGER centre-scoped access
  - Test CLINICIAN own-data-only access
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
