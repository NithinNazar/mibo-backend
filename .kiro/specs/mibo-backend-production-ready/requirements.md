# Requirements Document

## Introduction

This document outlines the requirements for completing and productionizing the Mibo Mental Hospital Chain backend system. The system is an Express + TypeScript + PostgreSQL backend that serves both a patient-facing website and an admin panel for managing hospital operations across multiple centres (Bangalore, Kochi, Mumbai). The backend must support role-based access control for various staff roles, appointment management, payment processing, and WhatsApp notifications.

## Glossary

- **Backend System**: The Express + TypeScript + PostgreSQL server application
- **Admin Panel**: Web interface for staff to manage hospital operations
- **Patient Website**: Public-facing website where patients book appointments
- **Staff User**: Any user with role ADMIN, MANAGER, CENTRE_MANAGER, CLINICIAN, CARE_COORDINATOR, or FRONT_DESK
- **Patient User**: End users who book appointments through the website
- **Centre**: Physical hospital location (Bangalore, Kochi, or Mumbai)
- **Clinician**: Doctor or therapist who provides consultations
- **OTP**: One-Time Password for phone-based authentication
- **JWT**: JSON Web Token for session management
- **Gallabox**: Third-party service for WhatsApp messaging
- **Razorpay**: Payment gateway for processing payments
- **Google Meet**: Video conferencing platform for online consultations

## Requirements

### Requirement 1: Code Quality and Error Resolution

**User Story:** As a developer, I want all existing code errors fixed and the codebase to follow TypeScript best practices, so that the application runs without compilation or runtime errors.

#### Acceptance Criteria

1. WHEN the Backend System is compiled, THE Backend System SHALL complete compilation without TypeScript errors
2. WHEN the Backend System starts, THE Backend System SHALL initialize all services without runtime errors
3. THE Backend System SHALL use consistent TypeScript types across all modules
4. THE Backend System SHALL implement proper error handling in all controller methods
5. THE Backend System SHALL validate all environment variables at startup

### Requirement 2: Authentication System for Staff Users

**User Story:** As a staff member, I want to authenticate using phone+OTP, phone+password, or username+password, so that I can securely access the admin panel.

#### Acceptance Criteria

1. WHEN a Staff User requests OTP with valid phone number, THE Backend System SHALL generate a six-digit OTP and send it via SMS within five seconds
2. WHEN a Staff User submits valid phone number and OTP, THE Backend System SHALL authenticate the user and return JWT access token and refresh token
3. WHEN a Staff User submits valid phone number and password, THE Backend System SHALL authenticate the user and return JWT tokens
4. WHEN a Staff User submits valid username and password, THE Backend System SHALL authenticate the user and return JWT tokens
5. WHEN a Patient User attempts to authenticate, THE Backend System SHALL reject the authentication request with error message "Access denied"
6. WHEN an authenticated user's access token expires, THE Backend System SHALL accept refresh token and issue new access token
7. WHEN a Staff User logs out, THE Backend System SHALL revoke the refresh token in the database

### Requirement 3: Role-Based Access Control

**User Story:** As a system administrator, I want different staff roles to have appropriate permissions, so that users can only access features relevant to their responsibilities.

#### Acceptance Criteria

1. WHEN an ADMIN user makes a request, THE Backend System SHALL grant access to all endpoints
2. WHEN a FRONT_DESK user attempts to access analytics endpoints, THE Backend System SHALL deny access with HTTP status 403
3. WHEN a CENTRE_MANAGER user requests appointments, THE Backend System SHALL return only appointments for their assigned centre
4. WHEN a CLINICIAN user requests appointments, THE Backend System SHALL return only appointments assigned to that clinician
5. THE Backend System SHALL validate user roles on every protected endpoint request

### Requirement 4: Dashboard Analytics

**User Story:** As a manager, I want to view key metrics and analytics on the dashboard, so that I can monitor hospital performance at a glance.

#### Acceptance Criteria

1. WHEN an authorized user requests dashboard metrics, THE Backend System SHALL return total patient count with percentage change from previous period
2. WHEN an authorized user requests dashboard metrics, THE Backend System SHALL return active doctor count with percentage change
3. WHEN an authorized user requests dashboard metrics, THE Backend System SHALL return follow-up appointment count with percentage change
4. WHEN an authorized user requests dashboard metrics, THE Backend System SHALL return total revenue with percentage change
5. WHEN an authorized user requests top doctors, THE Backend System SHALL return list of ten doctors sorted by completed appointment count
6. WHEN an authorized user requests revenue data with time period parameter, THE Backend System SHALL return daily revenue aggregated for the specified period

### Requirement 5: Appointment Management

**User Story:** As a front desk staff member, I want to book, view, reschedule, and cancel appointments, so that I can manage patient scheduling efficiently.

#### Acceptance Criteria

1. WHEN authorized staff creates an appointment, THE Backend System SHALL verify clinician availability before creating the appointment
2. WHEN authorized staff creates an appointment, THE Backend System SHALL check for scheduling conflicts and reject overlapping appointments
3. WHEN authorized staff creates an appointment, THE Backend System SHALL record the booking source and staff member who created it
4. WHEN authorized staff updates appointment status, THE Backend System SHALL log the status change in appointment history table
5. WHEN authorized staff cancels an appointment, THE Backend System SHALL update status to CANCELLED and record cancellation reason
6. WHEN a CARE_COORDINATOR marks patient as no-show, THE Backend System SHALL update appointment status to NO_SHOW

### Requirement 6: Patient Management

**User Story:** As a front desk staff member, I want to create and manage patient records, so that I can register walk-in patients and phone bookings.

#### Acceptance Criteria

1. WHEN authorized staff creates a patient with phone number, THE Backend System SHALL create user record with user_type PATIENT
2. WHEN authorized staff creates a patient, THE Backend System SHALL create corresponding patient_profile record
3. WHEN authorized staff searches for patients by name or phone, THE Backend System SHALL return matching patient records within two seconds
4. WHEN authorized staff views patient details, THE Backend System SHALL include appointment history and payment records
5. THE Backend System SHALL prevent creation of duplicate patient records with same phone number

### Requirement 7: Staff and Clinician Management

**User Story:** As an administrator, I want to create and manage staff accounts and clinician profiles, so that I can control who has access to the system.

#### Acceptance Criteria

1. WHEN an ADMIN creates a staff user, THE Backend System SHALL hash the password using bcrypt before storing
2. WHEN an ADMIN creates a staff user, THE Backend System SHALL assign specified role and centre associations
3. WHEN an ADMIN or CENTRE_MANAGER creates a clinician profile, THE Backend System SHALL link it to an existing staff user
4. WHEN an ADMIN updates clinician availability, THE Backend System SHALL store the schedule in clinician_availability_rules table
5. THE Backend System SHALL prevent deletion of clinicians who have future appointments

### Requirement 8: Centre Management

**User Story:** As an administrator, I want to manage hospital centres, so that I can add new locations or update existing ones.

#### Acceptance Criteria

1. WHEN an ADMIN creates a centre, THE Backend System SHALL validate that city is one of bangalore, kochi, or mumbai
2. WHEN an ADMIN updates a centre, THE Backend System SHALL update the record and return updated centre data
3. WHEN an ADMIN deactivates a centre, THE Backend System SHALL set is_active to false without deleting the record
4. THE Backend System SHALL return all active centres when requested by any authenticated staff user

### Requirement 9: Payment Integration

**User Story:** As a patient, I want my payments to be processed securely through Razorpay, so that I can complete my appointment booking.

#### Acceptance Criteria

1. WHEN a payment is initiated, THE Backend System SHALL create Razorpay order and store order_id in payments table
2. WHEN Razorpay webhook receives payment success, THE Backend System SHALL update payment status to SUCCESS
3. WHEN Razorpay webhook receives payment failure, THE Backend System SHALL update payment status to FAILED
4. WHEN payment is successful, THE Backend System SHALL update appointment status to CONFIRMED
5. THE Backend System SHALL verify Razorpay webhook signature before processing payment updates

### Requirement 10: WhatsApp Notifications via Gallabox

**User Story:** As a patient, I want to receive appointment confirmations and Google Meet links on WhatsApp, so that I have all necessary information for my appointment.

#### Acceptance Criteria

1. WHEN an appointment is confirmed, THE Backend System SHALL send WhatsApp confirmation message to patient within thirty seconds
2. WHEN an appointment type is ONLINE, THE Backend System SHALL include Google Meet link in WhatsApp message
3. WHEN an appointment is rescheduled, THE Backend System SHALL send WhatsApp notification with new date and time
4. WHEN an appointment is cancelled, THE Backend System SHALL send WhatsApp cancellation notification
5. THE Backend System SHALL log all notification attempts with success or failure status

### Requirement 11: Google Meet Integration

**User Story:** As a patient with online consultation, I want a Google Meet link generated for my appointment, so that I can join the video session.

#### Acceptance Criteria

1. WHEN an online appointment is created, THE Backend System SHALL generate unique Google Meet link using Google Calendar API
2. WHEN Google Meet link is generated, THE Backend System SHALL store the link with the appointment record
3. THE Backend System SHALL set Google Meet event duration to match appointment duration
4. THE Backend System SHALL include patient name and clinician name in Google Meet event title
5. IF Google Meet generation fails, THE Backend System SHALL log error and continue with appointment creation

### Requirement 12: Database Connection and Configuration

**User Story:** As a developer, I want the database connection to be properly configured and managed, so that the application can reliably interact with PostgreSQL.

#### Acceptance Criteria

1. WHEN the Backend System starts, THE Backend System SHALL establish connection to PostgreSQL database within ten seconds
2. WHEN database connection fails, THE Backend System SHALL log error details and exit with non-zero status code
3. THE Backend System SHALL use connection pooling with minimum two and maximum ten connections
4. THE Backend System SHALL validate database schema version at startup
5. THE Backend System SHALL handle database connection errors gracefully and return appropriate HTTP status codes

### Requirement 13: Environment Configuration

**User Story:** As a developer, I want all configuration to be managed through environment variables, so that the application can be deployed to different environments securely.

#### Acceptance Criteria

1. THE Backend System SHALL load environment variables from .env file during development
2. THE Backend System SHALL validate presence of required environment variables at startup
3. IF required environment variable is missing, THE Backend System SHALL log error message and exit with non-zero status code
4. THE Backend System SHALL not expose sensitive configuration values in error messages or logs
5. THE Backend System SHALL support separate configurations for development, staging, and production environments

### Requirement 14: API Response Standardization

**User Story:** As a frontend developer, I want all API responses to follow a consistent format, so that I can handle responses predictably.

#### Acceptance Criteria

1. WHEN an API request succeeds, THE Backend System SHALL return response with success status and data object
2. WHEN an API request fails due to validation, THE Backend System SHALL return HTTP status 400 with error details
3. WHEN an API request fails due to authentication, THE Backend System SHALL return HTTP status 401 with error message
4. WHEN an API request fails due to authorization, THE Backend System SHALL return HTTP status 403 with error message
5. WHEN an API request fails due to server error, THE Backend System SHALL return HTTP status 500 with generic error message

### Requirement 15: Input Validation

**User Story:** As a developer, I want all user inputs to be validated, so that the system is protected from invalid or malicious data.

#### Acceptance Criteria

1. THE Backend System SHALL validate all request body parameters against defined schemas before processing
2. WHEN validation fails, THE Backend System SHALL return HTTP status 400 with specific validation error messages
3. THE Backend System SHALL sanitize string inputs to prevent SQL injection attacks
4. THE Backend System SHALL validate phone numbers match Indian format with ten digits
5. THE Backend System SHALL validate email addresses match standard email format

### Requirement 16: Logging and Monitoring

**User Story:** As a system administrator, I want comprehensive logging, so that I can troubleshoot issues and monitor system health.

#### Acceptance Criteria

1. THE Backend System SHALL log all incoming HTTP requests with method, path, and response time
2. THE Backend System SHALL log all authentication attempts with success or failure status
3. THE Backend System SHALL log all database errors with query details and error messages
4. THE Backend System SHALL log all external API calls to Gallabox, Razorpay, and Google with response status
5. THE Backend System SHALL use different log levels for development and production environments

### Requirement 17: Production Readiness

**User Story:** As a DevOps engineer, I want the application to be production-ready, so that it can be deployed reliably and securely.

#### Acceptance Criteria

1. THE Backend System SHALL implement rate limiting on authentication endpoints to prevent brute force attacks
2. THE Backend System SHALL implement request timeout of thirty seconds for all endpoints
3. THE Backend System SHALL use HTTPS in production environment
4. THE Backend System SHALL implement health check endpoint that returns system status
5. THE Backend System SHALL gracefully handle shutdown signals and close database connections
