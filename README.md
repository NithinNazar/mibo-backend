# Mibo Mental Hospital - Backend API

Complete backend system for hospital management with appointment booking, payment processing, video consultations, and notifications.

---

## 📚 Documentation Index

### For Admin Panel UI Developers

**Start here:** [`ADMIN_PANEL_COMPLETE_GUIDE.md`](./ADMIN_PANEL_COMPLETE_GUIDE.md)

- Complete integration guide for frontend developers
- Authentication flows and examples
- React code examples for all features
- State management recommendations
- Error handling patterns

### API Testing & Collection

**API Collection:** [`api-requests.http`](./api-requests.http) | **Guide:** [`API_COLLECTION_GUIDE.md`](./API_COLLECTION_GUIDE.md)

- 56 pre-configured API requests
- Works with VS Code REST Client, Postman, Insomnia
- All authentication methods included
- Complete workflow examples
- Easy import and use

### API Reference

**Complete API docs:** [`API_REFERENCE.md`](./API_REFERENCE.md)

- All 60+ API endpoints documented
- Request/response examples
- Authentication requirements
- Role-based permissions
- Validation rules

### Quick Setup

**5-minute setup:** [`QUICK_START.md`](./QUICK_START.md)

- Environment configuration
- Database setup
- Running the server
- Testing endpoints

### Permissions Reference

**Role permissions:** [`USER_ROLES_AND_PERMISSIONS.md`](./USER_ROLES_AND_PERMISSIONS.md)

- Complete role matrix
- Endpoint permissions
- Access control rules

### Database Verification

**SQL queries:** [`CHECK_DATABASE.sql`](./CHECK_DATABASE.sql)

- Verify database schema
- Check data integrity
- Useful debugging queries

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mibo_hospital

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Google Meet (for video consultations)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=primary

# Gallabox (for WhatsApp)
GALLABOX_API_KEY=your-api-key
GALLABOX_API_SECRET=your-api-secret

# Razorpay (for payments)
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-key-secret

# Email (optional but recommended)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Mibo Mental Hospital <your-email@gmail.com>
```

### 3. Run Development Server

```bash
npm run dev
```

Server runs on `http://localhost:3000`

---

## 🎯 Key Features

### Authentication & Authorization

- Multi-method login (Phone+OTP, Phone+Password, Username+Password)
- JWT-based authentication
- 7 user roles with granular permissions
- Token refresh and logout

### Patient Management

- Complete CRUD operations
- Medical notes and history
- Appointment tracking
- Search and filtering

### Appointment System

- Online and in-person bookings
- Availability checking
- Conflict detection
- Doctor dashboard (current, upcoming, past appointments)
- Auto-notifications for online consultations

### Payment Processing

- Razorpay integration
- Payment link generation
- WhatsApp delivery to patients
- Auto-confirmation after payment
- Refund processing

### Video Consultations

- Google Meet integration
- Automatic link generation for online appointments
- Auto-delivery to patients and doctors via WhatsApp/Email
- Calendar event creation

### Notifications

- WhatsApp notifications (Gallabox)
- Email notifications (Nodemailer)
- Appointment confirmations
- Online consultation links
- Payment links
- Complete logging

### Staff Management

- Clinician profiles and availability
- Centre management
- Role assignments
- Manager permissions for all operations

### Analytics

- Dashboard metrics
- Revenue tracking
- Top doctors
- Lead source analysis

---

## 👥 User Roles

| Role                 | Description              | Key Permissions                                       |
| -------------------- | ------------------------ | ----------------------------------------------------- |
| **ADMIN**            | System administrator     | Full access to all features                           |
| **MANAGER**          | Hospital manager         | Manage doctors, centres, appointments, view analytics |
| **CLINICIAN**        | Doctor                   | View own appointments, update availability            |
| **CENTRE_MANAGER**   | Centre administrator     | Manage centre appointments and staff                  |
| **CARE_COORDINATOR** | Patient care coordinator | Manage appointments, patient records                  |
| **FRONT_DESK**       | Reception staff          | Book appointments, send payment links                 |
| **PATIENT**          | Hospital patient         | Book appointments, view own records                   |

See [`USER_ROLES_AND_PERMISSIONS.md`](./USER_ROLES_AND_PERMISSIONS.md) for complete permission matrix.

---

## 📱 API Endpoints Overview

### Authentication

- `POST /api/auth/login/phone-otp` - Login with phone + OTP
- `POST /api/auth/login/phone-password` - Login with phone + password
- `POST /api/auth/login/username-password` - Login with username + password
- `POST /api/auth/refresh-token` - Refresh JWT token
- `POST /api/auth/logout` - Logout user

### Appointments

- `GET /api/appointments` - List appointments (role-filtered)
- `POST /api/appointments` - Create appointment (auto-generates Meet link for ONLINE)
- `GET /api/appointments/my-appointments` - Doctor dashboard (CLINICIAN only)
- `GET /api/appointments/:id` - Get appointment details
- `PUT /api/appointments/:id/reschedule` - Reschedule appointment
- `PUT /api/appointments/:id/status` - Update appointment status
- `DELETE /api/appointments/:id` - Cancel appointment

### Payments

- `POST /api/payments/send-payment-link` - Generate and send payment link
- `GET /api/payments/link-status/:linkId` - Check payment link status
- `POST /api/payments/webhook` - Razorpay webhook handler

### Staff (Clinicians)

- `GET /api/staff/clinicians` - List all clinicians
- `POST /api/staff/clinicians` - Add new clinician (ADMIN, MANAGER)
- `PUT /api/staff/clinicians/:id` - Update clinician (ADMIN, MANAGER)
- `POST /api/staff/clinicians/:id/availability` - Set availability (ADMIN, MANAGER, CLINICIAN)

### Centres

- `GET /api/centres` - List all centres
- `POST /api/centres` - Create centre (ADMIN, MANAGER)
- `PUT /api/centres/:id` - Update centre (ADMIN, MANAGER)

### Patients

- `GET /api/patients` - List patients
- `POST /api/patients` - Create patient
- `GET /api/patients/:id` - Get patient details
- `PUT /api/patients/:id` - Update patient

### Analytics

- `GET /api/analytics/dashboard` - Dashboard metrics (ADMIN, MANAGER)
- `GET /api/analytics/revenue` - Revenue analytics (ADMIN, MANAGER)

See [`API_REFERENCE.md`](./API_REFERENCE.md) for complete API documentation with examples.

---

## 🔧 Technology Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL with pg-promise
- **Authentication:** JWT (jsonwebtoken)
- **Video:** Google Meet API (googleapis)
- **Payments:** Razorpay
- **WhatsApp:** Gallabox API
- **Email:** Nodemailer
- **Security:** Helmet, CORS, bcrypt
- **Logging:** Winston
- **Validation:** Joi

---

## 🔒 Security Features

- JWT-based authentication with token expiration
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Rate limiting on all endpoints
- CORS configuration
- Helmet security headers
- Input validation with Joi
- SQL injection prevention (parameterized queries)
- XSS protection

---

## 📊 Database Schema

The system uses PostgreSQL with the following main tables:

- `users` - User accounts (patients, staff, admins)
- `user_roles` - Role assignments
- `roles` - Role definitions
- `patient_profiles` - Patient information
- `clinician_profiles` - Doctor information
- `centres` - Hospital centres
- `appointments` - Appointment records
- `appointment_video_links` - Google Meet links
- `clinician_availability` - Doctor availability rules
- `whatsapp_notifications` - Notification logs
- `payments` - Payment records

Run queries from [`CHECK_DATABASE.sql`](./CHECK_DATABASE.sql) to verify schema.

---

## 🎨 Frontend Integration

### For Admin Panel UI Developers

**Read this first:** [`ADMIN_PANEL_COMPLETE_GUIDE.md`](./ADMIN_PANEL_COMPLETE_GUIDE.md)

The guide includes:

- Complete authentication flow with code examples
- Protected routes implementation
- API integration patterns
- State management recommendations
- Error handling
- React component examples for all features
- TypeScript interfaces
- Best practices

### Quick Integration Example

```typescript
// Login
const response = await fetch(
  "http://localhost:3000/api/auth/login/phone-password",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: "+919876543210",
      password: "password123",
    }),
  }
);

const { token, user } = await response.json();

// Use token for authenticated requests
const appointments = await fetch("http://localhost:3000/api/appointments", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

---

## 🧪 Testing

### Manual Testing

1. Start the server: `npm run dev`
2. Use Postman or curl to test endpoints
3. Check logs for errors

### Test Accounts

Create test users with different roles to test permissions:

```sql
-- See CHECK_DATABASE.sql for user creation queries
```

---

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Environment Variables

Ensure all required environment variables are set in production:

- Database connection
- JWT secret
- Google Meet credentials
- Gallabox API keys
- Razorpay credentials
- Email configuration (optional)

---

## 📝 Development Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm start            # Start production server
npm run typecheck    # Check TypeScript types
npm run clean        # Remove build directory
```

---

## 🐛 Troubleshooting

### Server won't start

- Check `.env` file exists and has all required variables
- Verify database connection
- Check port 3000 is not in use

### Authentication fails

- Verify JWT_SECRET is set
- Check token expiration
- Ensure user has correct role

### Notifications not sending

- Verify Gallabox API keys
- Check email configuration (if using email)
- Review logs for error messages

### Google Meet links not generating

- Verify Google service account credentials
- Check calendar API is enabled
- Ensure service account has calendar access

---

## 📞 Support

### Documentation Files

1. **ADMIN_PANEL_COMPLETE_GUIDE.md** - Main integration guide
2. **API_REFERENCE.md** - Complete API documentation
3. **QUICK_START.md** - Quick setup guide
4. **USER_ROLES_AND_PERMISSIONS.md** - Role permissions
5. **CHECK_DATABASE.sql** - Database queries

### Logs

Check server logs for detailed error messages:

```bash
# Development logs appear in console
# Production logs can be configured in src/config/logger.ts
```

---

## ✨ Features Highlights

### Automatic Online Consultation Flow

When a patient books an ONLINE appointment:

1. ✅ Appointment created in database
2. ✅ Google Meet link generated automatically
3. ✅ WhatsApp sent to patient with Meet link
4. ✅ Email sent to patient with Meet link (if configured)
5. ✅ WhatsApp sent to doctor with appointment details
6. ✅ WhatsApp sent to all admins/managers with summary
7. ✅ All notifications logged in database

### Payment Link Flow

When front desk sends a payment link:

1. ✅ Consultation fee fetched from doctor profile
2. ✅ Razorpay payment link created
3. ✅ WhatsApp sent to patient with payment link
4. ✅ Link supports UPI, Google Pay, Cards
5. ✅ Appointment auto-confirmed after payment
6. ✅ Payment logged in database

### Doctor Dashboard

Doctors can login and see:

- ✅ Current appointments (today)
- ✅ Upcoming appointments (future)
- ✅ Past appointments (completed)
- ✅ Patient details (name, phone)
- ✅ Centre details (name, address)
- ✅ Appointment counts and summary

---

## 📈 System Status

**Status:** ✅ Production Ready

- All features implemented and tested
- Zero TypeScript errors
- Comprehensive documentation
- Proper error handling
- Security best practices
- No database migrations required

---

## 📄 License

ISC

---

## 👨‍💻 Development

**Last Updated:** December 13, 2024
**Version:** 1.0.0
**Node Version:** 18+
**Database:** PostgreSQL 14+

---

**For detailed integration instructions, see [`ADMIN_PANEL_COMPLETE_GUIDE.md`](./ADMIN_PANEL_COMPLETE_GUIDE.md)**
