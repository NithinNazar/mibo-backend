# Mibo Mental Hospital Chain - Backend API

> Production-ready Express + TypeScript + PostgreSQL backend for managing multi-centre hospital operations

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [External Services](#external-services)
- [Security](#security)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The Mibo Backend API serves both patient-facing and admin panel applications, managing hospital operations across multiple centres in Bangalore, Kochi, and Mumbai. It provides comprehensive features for appointment scheduling, patient management, staff coordination, payments, and notifications.

### Key Capabilities

- **Multi-Centre Management**: Support for 3 cities with centre-specific operations
- **Role-Based Access Control**: 6 staff roles with granular permissions
- **Complete Appointment Workflow**: From booking to payment to consultation
- **Real-Time Analytics**: Dashboard metrics and business intelligence
- **External Integrations**: Payments (Razorpay), WhatsApp (Gallabox), Video (Google Meet)
- **Production-Ready**: Comprehensive logging, error handling, and security

---

## ✨ Features

### Core Features

✅ **Authentication & Authorization**

- Staff-only authentication (Phone+OTP, Phone+Password, Username+Password)
- JWT access & refresh tokens
- Session management with revocation
- 6 role-based access levels

✅ **Dashboard Analytics**

- Patient, doctor, and revenue metrics with % changes
- Top performing doctors
- Revenue time series
- Appointment source distribution

✅ **Appointment Management**

- CRUD operations with availability checking
- Scheduling conflict detection
- Multiple appointment types (IN_PERSON, ONLINE, INPATIENT, FOLLOW_UP)
- Status tracking with history

✅ **Patient Management**

- Complete patient records
- Medical notes with author tracking
- Appointment and payment history
- Duplicate prevention

✅ **Staff & Clinician Management**

- Staff user management with role assignment
- Clinician profiles with specializations
- Availability rules (day, time, consultation mode)
- Centre assignments

✅ **Centre Management**

- Multi-centre support (Bangalore, Kochi, Mumbai)
- Complete CRUD operations
- Soft delete functionality

### External Integrations

✅ **Payment Processing (Razorpay)**

- Order creation and verification
- Webhook support
- Automatic appointment confirmation
- Refund processing

✅ **WhatsApp Notifications (Gallabox)**

- Appointment confirmations and reminders
- Cancellation notifications
- Meeting link delivery
- Payment confirmations

✅ **Video Consultations (Google Meet)**

- Auto-generate Meet links for online appointments
- Calendar event management
- Link storage and retrieval

---

## 🛠 Tech Stack

### Core Technologies

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.0
- **Framework**: Express.js
- **Database**: PostgreSQL 14+
- **ORM**: pg-promise

### Key Libraries

- **Authentication**: jsonwebtoken, bcrypt
- **Validation**: Custom validation schemas
- **Logging**: Winston
- **Security**: Helmet, express-rate-limit
- **HTTP Client**: Axios
- **External APIs**: Razorpay, Google APIs

### Development Tools

- **Build**: TypeScript Compiler
- **Dev Server**: ts-node-dev
- **Code Quality**: ESLint, Prettier (optional)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher
- npm or yarn
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:

   ```env
   # Required
   PORT=5000
   NODE_ENV=development
   DATABASE_URL=postgresql://user:password@localhost:5432/mibo_db
   JWT_ACCESS_SECRET=your_secret_min_32_characters
   JWT_REFRESH_SECRET=your_secret_min_32_characters
   CORS_ORIGIN=http://localhost:3000

   # Optional (for external services)
   RAZORPAY_KEY_ID=rzp_test_xxxxx
   RAZORPAY_KEY_SECRET=xxxxx
   GALLABOX_API_KEY=xxxxx
   GALLABOX_API_SECRET=xxxxx
   GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

4. **Set up database**

   ```bash
   # Create database
   createdb mibo_db

   # Run migrations (if you have migration files)
   # Or import the schema directly
   psql mibo_db < database/schema.sql
   ```

5. **Build the project**

   ```bash
   npm run build
   ```

6. **Start the server**

   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

The server will start on `http://localhost:5000`

### Verify Installation

Test the health endpoint:

```bash
curl http://localhost:5000/api/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2024-12-05T10:00:00.000Z",
  "database": "connected",
  "version": "1.0.0",
  "environment": "development",
  "uptime": 123.45
}
```

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── env.ts          # Environment variables
│   │   ├── db.ts           # Database connection
│   │   └── logger.ts       # Winston logger
│   │
│   ├── controllers/         # Request handlers
│   │   ├── auth.controllers.ts
│   │   ├── analytics.controller.ts
│   │   ├── appointment.controller.ts
│   │   ├── patient.controller.ts
│   │   ├── staff.controller.ts
│   │   ├── centre.controller.ts
│   │   ├── payment.controller.ts
│   │   ├── notification.controller.ts
│   │   ├── video.controller.ts
│   │   └── health.controller.ts
│   │
│   ├── services/            # Business logic
│   │   ├── auth.services.ts
│   │   ├── analytics.service.ts
│   │   ├── appointment.services.ts
│   │   ├── patient.services.ts
│   │   ├── staff.service.ts
│   │   ├── centre.service.ts
│   │   ├── payment.service.ts
│   │   ├── notification.service.ts
│   │   └── video.service.ts
│   │
│   ├── repositories/        # Database access
│   │   ├── user.repository.ts
│   │   ├── authSession.repository.ts
│   │   ├── analytics.repository.ts
│   │   ├── appointment.repository.ts
│   │   ├── patient.repository.ts
│   │   ├── staff.repository.ts
│   │   ├── centre.repository.ts
│   │   ├── payment.repository.ts
│   │   ├── notification.repository.ts
│   │   └── video.repository.ts
│   │
│   ├── routes/              # API routes
│   │   ├── index.ts        # Main router
│   │   ├── auth.routes.ts
│   │   ├── analytics.routes.ts
│   │   ├── appointment.routes.ts
│   │   ├── patient.routes.ts
│   │   ├── staff.routes.ts
│   │   ├── centre.routes.ts
│   │   ├── payment.routes.ts
│   │   ├── notification.routes.ts
│   │   └── video.routes.ts
│   │
│   ├── middlewares/         # Express middlewares
│   │   ├── auth.middleware.ts
│   │   ├── role.middleware.ts
│   │   └── error.middleware.ts
│   │
│   ├── validations/         # Input validation
│   │   ├── auth.validations.ts
│   │   ├── appointment.validations.ts
│   │   ├── patient.validation.ts
│   │   ├── staff.validation.ts
│   │   ├── centre.validation.ts
│   │   └── payment.validation.ts
│   │
│   ├── utils/               # Utility functions
│   │   ├── apiError.ts     # Error classes
│   │   ├── response.ts     # Response helpers
│   │   ├── jwt.ts          # JWT utilities
│   │   ├── password.ts     # Password hashing
│   │   ├── razorpay.ts     # Razorpay integration
│   │   ├── gallabox.ts     # WhatsApp integration
│   │   └── googleMeet.ts   # Google Meet integration
│   │
│   ├── types/               # TypeScript types
│   │   ├── user.types.ts
│   │   └── appointment.types.ts
│   │
│   ├── app.ts               # Express app setup
│   └── server.ts            # Server entry point
│
├── dist/                    # Compiled JavaScript (generated)
├── logs/                    # Application logs (generated)
├── .env.example             # Environment template
├── .gitignore
├── package.json
├── tsconfig.json
├── README.md                # This file
└── API_DOCUMENTATION.md     # Detailed API reference
```

### Architecture Pattern

The project follows a **layered architecture**:

1. **Routes Layer**: HTTP routing and endpoint definition
2. **Middleware Layer**: Authentication, validation, error handling
3. **Controllers Layer**: Request/response handling
4. **Services Layer**: Business logic
5. **Repositories Layer**: Database access
6. **Utilities Layer**: Helper functions and external APIs

---

## 📖 API Documentation

For complete API documentation with request/response examples, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### Quick Reference

#### Base URL

```
http://localhost:5000/api
```

#### Authentication

All protected endpoints require a Bearer token:

```
Authorization: Bearer <access_token>
```

#### API Endpoints Summary

| Module            | Endpoints | Description                      |
| ----------------- | --------- | -------------------------------- |
| **Auth**          | 7         | Login, logout, token refresh     |
| **Analytics**     | 4         | Dashboard metrics, reports       |
| **Appointments**  | 6         | CRUD, availability checking      |
| **Patients**      | 6         | CRUD, medical notes              |
| **Staff/Users**   | 5         | Staff management                 |
| **Clinicians**    | 6         | Clinician profiles, availability |
| **Centres**       | 5         | Centre management                |
| **Payments**      | 7         | Orders, verification, refunds    |
| **Notifications** | 5         | WhatsApp notifications           |
| **Video**         | 5         | Google Meet links                |
| **Health**        | 1         | System health check              |

**Total: 57 API Endpoints**

### Example API Calls

#### 1. Login

```bash
POST /api/auth/login/phone-password
Content-Type: application/json

{
  "phone": "9876543210",
  "password": "password123"
}
```

#### 2. Get Dashboard Metrics

```bash
GET /api/analytics/dashboard
Authorization: Bearer <token>
```

#### 3. Create Appointment

```bash
POST /api/appointments
Authorization: Bearer <token>
Content-Type: application/json

{
  "patient_id": 123,
  "clinician_id": 45,
  "centre_id": 1,
  "appointment_type": "IN_PERSON",
  "scheduled_start_at": "2024-12-10T10:00:00Z",
  "duration_minutes": 30
}
```

---

## 🔌 External Services

### Razorpay (Payment Processing)

**Setup:**

1. Sign up at [razorpay.com](https://razorpay.com/)
2. Get API keys from Dashboard > Settings > API Keys
3. Add to `.env`:
   ```env
   RAZORPAY_KEY_ID=rzp_test_xxxxx
   RAZORPAY_KEY_SECRET=xxxxx
   ```

**Features:**

- Order creation
- Payment verification
- Webhook support
- Refund processing

### Gallabox (WhatsApp Notifications)

**Setup:**

1. Sign up at [gallabox.com](https://gallabox.com/)
2. Get API credentials from Dashboard > Settings > API
3. Connect WhatsApp Business Account
4. Add to `.env`:
   ```env
   GALLABOX_API_KEY=xxxxx
   GALLABOX_API_SECRET=xxxxx
   ```

**Features:**

- Appointment confirmations
- Reminders
- Cancellation notifications
- Meeting links

### Google Meet (Video Consultations)

**Setup:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project and enable Google Calendar API
3. Create Service Account with Editor role
4. Download JSON key file
5. Share your calendar with service account email
6. Add to `.env`:
   ```env
   GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   GOOGLE_CALENDAR_ID=primary
   ```

**Features:**

- Auto-generate Meet links
- Calendar event management
- Link storage

**Note:** The system works without these services configured. They can be added later without code changes.

---

## 🔒 Security

### Authentication & Authorization

- JWT-based authentication with access & refresh tokens
- Staff-only access (PATIENT users rejected)
- Role-based access control (6 roles)
- Centre-scoped permissions
- Session management with token revocation

### Data Protection

- Password hashing with bcrypt (cost factor 10)
- Sensitive data masking in logs
- SQL injection prevention (parameterized queries)
- Input validation on all endpoints
- Request size limits (10MB)

### Network Security

- Helmet security headers
- CORS configuration
- Rate limiting:
  - Global: 100 requests/minute per IP
  - Auth endpoints: 5 requests/minute per IP
- Request timeout: 30 seconds

### Payment Security

- Razorpay signature verification
- Webhook signature verification
- Secure key storage in environment variables

---

## 🚢 Deployment

### Environment Setup

1. **Production Environment Variables**

   ```env
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=postgresql://user:password@prod-host:5432/mibo_prod
   JWT_ACCESS_SECRET=<strong-random-secret-32+chars>
   JWT_REFRESH_SECRET=<strong-random-secret-32+chars>
   CORS_ORIGIN=https://yourdomain.com
   ```

2. **Database Migration**

   - Run schema on production database
   - Seed initial data (roles, centres, admin user)

3. **Build for Production**

   ```bash
   npm run build
   ```

4. **Start Production Server**
   ```bash
   npm start
   ```

### Deployment Platforms

#### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

#### PM2 (Process Manager)

```bash
npm install -g pm2
pm2 start dist/server.js --name mibo-backend
pm2 save
pm2 startup
```

#### Cloud Platforms

- **AWS**: EC2, ECS, or Elastic Beanstalk
- **Google Cloud**: App Engine or Cloud Run
- **Azure**: App Service
- **Heroku**: Direct deployment with Procfile

### Health Monitoring

Monitor the health endpoint:

```bash
GET /api/health
```

Returns system status, database connection, uptime, and version.

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Failed

```
Error: Failed to connect to database
```

**Solution:**

- Verify DATABASE_URL in `.env`
- Check PostgreSQL is running: `pg_isready`
- Verify database exists: `psql -l`
- Check network connectivity

#### 2. JWT Token Invalid

```
Error: Invalid token
```

**Solution:**

- Verify JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are set
- Check token hasn't expired
- Ensure token format: `Bearer <token>`

#### 3. Port Already in Use

```
Error: Port 5000 is already in use
```

**Solution:**

- Change PORT in `.env`
- Or kill process using port: `lsof -ti:5000 | xargs kill`

#### 4. External Service Not Working

```
Warning: Razorpay/Gallabox/Google Meet not configured
```

**Solution:**

- This is expected if API keys not provided
- System continues to work without external services
- Add API keys to `.env` when ready

### Logging

Logs are stored in `logs/` directory:

- `error.log`: Error-level logs
- `combined.log`: All logs

View logs:

```bash
tail -f logs/combined.log
```

### Debug Mode

Enable detailed logging:

```env
NODE_ENV=development
```

---

## 👥 Team Roles & Permissions

| Role                 | Access Level    | Permissions                                    |
| -------------------- | --------------- | ---------------------------------------------- |
| **ADMIN**            | Full access     | All operations across all centres              |
| **MANAGER**          | Multi-centre    | View all bookings, analytics for all centres   |
| **CENTRE_MANAGER**   | Single centre   | Manage assigned centre, clinicians, bookings   |
| **CLINICIAN**        | Own data        | View own appointments only                     |
| **CARE_COORDINATOR** | Centre bookings | Manage appointments for assigned centre        |
| **FRONT_DESK**       | Centre bookings | Book and view appointments for assigned centre |

---

## 📊 Database Schema

Key tables:

- `users` - All users (staff and patients)
- `staff_profiles` - Staff-specific data
- `patient_profiles` - Patient-specific data
- `clinician_profiles` - Clinician details
- `centres` - Hospital centres
- `appointments` - Appointment records
- `payments` - Payment transactions
- `notification_logs` - Notification history
- `user_roles` - Role assignments
- `centre_staff_assignments` - Centre access

For complete schema, see `database/schema.sql`

---

## 🤝 Contributing

### Development Workflow

1. Create feature branch
2. Make changes
3. Test locally
4. Build and verify: `npm run build`
5. Submit pull request

### Code Style

- Use TypeScript strict mode
- Follow existing patterns
- Add JSDoc comments for functions
- Use meaningful variable names
- Keep functions small and focused

---

## 📝 License

MIT License - see LICENSE file for details

---

## 📞 Support

For issues or questions:

1. Check [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
2. Review this README
3. Check logs in `logs/` directory
4. Contact development team

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Status**: Production Ready ✅
