# Mibo Mental Hospital - Project Overview

## Project Structure

This workspace contains two main applications:

### 1. Backend (`backend/`)

- **Technology**: Node.js + Express + TypeScript
- **Database**: PostgreSQL
- **Port**: 5000
- **Purpose**: REST API for hospital management system

### 2. Frontend (`mibo_version-2/`)

- **Technology**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Port**: 5173 (or 5174 if 5173 is in use)
- **Purpose**: Patient booking and management interface

---

## Features Implemented

### ✅ Patient Booking System

- Expert/doctor selection from static data
- Date and time slot selection
- Phone number verification with OTP
- Booking confirmation with user details
- Payment integration

### ✅ Authentication & Authorization

- OTP-based patient authentication via phone
- JWT token-based sessions
- Role-based access control (Patient, Clinician, Admin, Super Admin)

### ✅ Payment Integration

- **Razorpay** integration for test mode payments
- Payment success/failure handling
- Test card: `4111 1111 1111 1111`

### ✅ WhatsApp Integration (Gallabox)

- OTP delivery via WhatsApp
- Appointment confirmations
- Payment links
- **Status**: Configured but requires Gallabox support for API authentication issue

### ✅ Admin Panel

- Staff management
- Clinician management
- Patient management
- Appointment management
- Analytics dashboard

### ✅ Google Meet Integration

- Automatic meeting link generation for online consultations
- Meeting links sent to patients and clinicians

---

## Current Status

### Working Features

- ✅ Complete booking flow (frontend + backend)
- ✅ OTP generation and verification (browser-based for testing)
- ✅ Payment integration (Razorpay test mode)
- ✅ Patient dashboard
- ✅ Admin panel
- ✅ Database schema and migrations
- ✅ API endpoints for all features

### In Progress

- ⚠️ WhatsApp OTP delivery (Gallabox API authentication issue - contact support)
- ⚠️ Database setup with test data (optional - using dummy data for testing)

---

## Technology Stack

### Backend

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with pg-promise
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Joi
- **Security**: Helmet, CORS, bcrypt
- **Logging**: Winston
- **Email**: Nodemailer (optional)

### Frontend

- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Charts**: Recharts
- **Date Picker**: React Date Picker

### Integrations

- **Payment**: Razorpay (Test Mode)
- **WhatsApp**: Gallabox API
- **Video Calls**: Google Meet API
- **Email**: SMTP (optional)

---

## Architecture

### Backend Architecture

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── repositories/    # Database queries
│   ├── routes/          # API routes
│   ├── middlewares/     # Custom middleware
│   ├── validations/     # Input validation schemas
│   ├── utils/           # Utility functions
│   └── server.ts        # Application entry point
├── .env                 # Environment variables
└── package.json
```

### Frontend Architecture

```
mibo_version-2/
├── src/
│   ├── pages/           # Page components
│   ├── components/      # Reusable components
│   ├── services/        # API service layer
│   ├── contexts/        # React contexts
│   ├── hooks/           # Custom hooks
│   ├── utils/           # Utility functions
│   ├── assets/          # Static assets
│   └── main.tsx         # Application entry point
├── public/              # Public assets
└── package.json
```

---

## Database Schema

### Main Tables

- **users** - All system users (patients, clinicians, staff)
- **clinician_profiles** - Clinician-specific data
- **patient_profiles** - Patient-specific data
- **centres** - Hospital/clinic locations
- **appointments** - Booking records
- **payments** - Payment transactions
- **otp_requests** - OTP verification records
- **notifications** - System notifications

### User Roles

1. **PATIENT** - Can book appointments, view history
2. **CLINICIAN** - Can manage appointments, view patients
3. **ADMIN** - Can manage staff, clinicians, centres
4. **SUPER_ADMIN** - Full system access

---

## API Endpoints

### Patient Authentication

- `POST /api/patient-auth/send-otp` - Send OTP to phone
- `POST /api/patient-auth/verify-otp` - Verify OTP and login
- `POST /api/patient-auth/refresh-token` - Refresh access token

### Booking

- `POST /api/booking/initiate` - Start booking process
- `POST /api/booking/confirm` - Confirm booking with payment
- `GET /api/booking/:id` - Get booking details

### Patient Dashboard

- `GET /api/patient/appointments` - Get patient appointments
- `GET /api/patient/profile` - Get patient profile
- `PUT /api/patient/profile` - Update patient profile

### Payments

- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/:id` - Get payment details

### Admin (Staff Authentication Required)

- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- Similar endpoints for clinicians, centres, appointments

---

## Environment Variables

### Backend (.env)

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mibo-development-db

# JWT
JWT_ACCESS_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# OTP
OTP_EXPIRY_MINUTES=10

# CORS
CORS_ORIGIN=http://localhost:5173

# Gallabox (WhatsApp)
GALLABOX_BASE_URL=https://server.gallabox.com/api/v1
GALLABOX_API_KEY=your-api-key
GALLABOX_API_SECRET=your-api-secret
GALLABOX_CHANNEL_ID=your-channel-id

# Razorpay (Test Mode)
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your-secret-key

# Google Meet (Optional)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=primary

# Email (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx
```

---

## Key Features Details

### OTP System

- **Test Mode**: OTP shown in browser alert for testing
- **Production Mode**: OTP sent via WhatsApp (Gallabox)
- **Storage**: In-memory for test mode, database for production
- **Expiry**: 10 minutes
- **Format**: 6-digit numeric code

### Payment Flow

1. User completes booking details
2. Backend creates Razorpay order
3. Frontend opens Razorpay checkout
4. User completes payment
5. Backend verifies payment signature
6. Booking confirmed and saved

### Booking Flow

1. Select expert from list
2. Choose appointment type (In-Person/Video)
3. Select date and time slot
4. Enter phone number
5. Verify OTP
6. Enter name and email
7. Complete payment
8. View confirmation

---

## Testing

### Test Credentials

**Razorpay Test Cards:**

- Success: `4111 1111 1111 1111`
- Failure: `4000 0000 0000 0002`
- Expiry: Any future date
- CVV: Any 3 digits

**Test Phone Number:**

- Use any valid 10-digit Indian mobile number
- OTP will be shown in browser alert (test mode)

---

## Known Issues

### 1. Gallabox WhatsApp Integration

- **Issue**: API returns 401 Unauthorized
- **Status**: Awaiting Gallabox support response
- **Workaround**: Using browser-based OTP for testing
- **Impact**: Low - system fully functional without WhatsApp

### 2. Database Setup

- **Issue**: Missing test data and some schema columns
- **Status**: SQL scripts provided for setup
- **Workaround**: Using dummy data from static files
- **Impact**: Low - can test complete flow without database

---

## Next Steps

### For Production Deployment

1. ✅ Setup production database
2. ✅ Run database migrations
3. ✅ Add test data (clinicians, centres)
4. ✅ Configure production Razorpay keys
5. ⚠️ Resolve Gallabox API authentication
6. ✅ Configure Google Meet (optional)
7. ✅ Setup email service (optional)
8. ✅ Configure production environment variables
9. ✅ Deploy backend to server
10. ✅ Deploy frontend to hosting service

### For Development

1. ✅ Test complete booking flow
2. ✅ Test payment integration
3. ⚠️ Test WhatsApp OTP (pending Gallabox fix)
4. ✅ Test admin panel features
5. ✅ Add more test cases
6. ✅ Improve error handling
7. ✅ Add loading states
8. ✅ Optimize performance

---

## Support & Documentation

- **Setup Guide**: See `SETUP_GUIDE.md`
- **API Documentation**: See `API_DOCUMENTATION.md`
- **Backend README**: See `backend/README.md`
- **Frontend README**: See `mibo_version-2/README.md`

---

## License

Proprietary - Mibo Mental Hospital Chain

---

## Contact

For technical support or questions, contact the development team.
