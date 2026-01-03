# Mibo Mental Hospital - Project Summary

Complete overview of the booking system implementation and current status.

## Project Structure

```
workspace/
├── backend/                    # Node.js + Express API
│   ├── src/                   # TypeScript source code
│   ├── .env                   # Environment configuration
│   ├── README.md              # Backend quick reference
│   ├── PROJECT_OVERVIEW.md    # System architecture
│   ├── SETUP_GUIDE.md         # Setup instructions
│   ├── API_DOCUMENTATION.md   # API endpoints reference
│   └── GALLABOX_CURL_REQUEST.txt  # WhatsApp API debug info
│
└── mibo_version-2/            # React + Vite frontend
    ├── src/                   # React components
    ├── .env                   # Frontend configuration
    └── README.md              # Frontend quick reference
```

## Documentation Guide

### Start Here

1. **[backend/README.md](./README.md)** - Quick overview of backend
2. **[backend/SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup instructions
3. **[backend/API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - All API endpoints
4. **[backend/PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)** - System architecture

### Frontend

- **[mibo_version-2/README.md](../mibo_version-2/README.md)** - Frontend overview

## Current Implementation Status

### ✅ Completed Features

**Backend**:

- Test OTP endpoints (no database required)
- Patient authentication structure
- Booking system routes and controllers
- Razorpay payment integration (test mode)
- **Gallabox WhatsApp integration (WORKING! ✅)**
- CORS setup for frontend ports 5173/5174
- JWT authentication
- Input validation
- Error handling
- Logging system

**Frontend**:

- Complete 3-step booking flow UI
- Doctor selection from static data
- Phone verification with OTP
- Booking confirmation screen
- Responsive mobile-first design
- API service integration
- Patient dashboard structure

### 🔄 In Progress

**Database Setup**:

- Schema defined but not required for testing
- Test mode works without database
- SQL files available: `CHECK_DATABASE.sql`, `SETUP_TEST_DATA.sql`

### 🔄 Pending

- Google Meet integration (optional)
- Payment flow completion in frontend
- Patient dashboard features
- Admin panel

## Quick Start

### Backend

```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:5000
```

### Frontend

```bash
cd mibo_version-2
npm install
npm run dev
# Runs on http://localhost:5173
```

### Test Booking Flow

1. Start backend server
2. Start frontend server
3. Navigate to booking page
4. Select doctor and time
5. Enter phone number (e.g., 9876543210)
6. Click "Send OTP"
7. Check browser alert for OTP
8. Enter OTP and verify
9. Complete booking

## Key Technologies

**Backend**:

- Node.js 18+ with Express
- TypeScript
- PostgreSQL (optional for testing)
- JWT authentication
- Razorpay SDK
- Axios for HTTP requests
- Winston for logging

**Frontend**:

- React 19 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls
- Lucide React for icons

## Environment Configuration

### Backend (.env)

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/mibo-development-db

# JWT
JWT_ACCESS_SECRET=mibo_access_secret_change_in_production_min_32_chars
JWT_REFRESH_SECRET=mibo_refresh_secret_change_in_production_min_32_chars

# Gallabox (WhatsApp)
GALLABOX_BASE_URL=https://server.gallabox.com/api/v1/messages/whatsapp
GALLABOX_API_KEY=695652f2540814a19bebf8b5
GALLABOX_API_SECRET=edd9fb89a68548d6a7fb080ea8255b1e
GALLABOX_CHANNEL_ID=693a63bfeba0dac02ac3d624

# Razorpay (Test Mode)
RAZORPAY_KEY_ID=rzp_test_Rv16VKPj91R00I
RAZORPAY_KEY_SECRET=lVTIWgJw36ydSFnDeGmaKIBx

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## API Endpoints Summary

### Test Endpoints (No Database)

- `POST /api/test/send-otp` - Send OTP without database
- `POST /api/test/verify-otp` - Verify OTP without database
- `GET /api/test/otp-status` - Check stored OTPs

### Patient Authentication

- `POST /api/patient-auth/send-otp` - Send OTP for login
- `POST /api/patient-auth/verify-otp` - Verify OTP and get tokens
- `POST /api/patient-auth/refresh-token` - Refresh access token

### Booking

- `POST /api/booking/initiate` - Start booking process
- `POST /api/booking/confirm` - Confirm booking after OTP

### Payment

- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/verify` - Verify payment signature
- `POST /api/payment/create-link` - Create payment link

### Patient Dashboard

- `GET /api/patient-dashboard/profile` - Get patient profile
- `PUT /api/patient-dashboard/profile` - Update profile
- `GET /api/patient-dashboard/appointments` - Get appointments
- `POST /api/patient-dashboard/appointments/:id/cancel` - Cancel appointment

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete details.

## Testing

### Test OTP Flow (No Database)

```bash
# Send OTP
curl -X POST http://localhost:5000/api/test/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"919876543210"}'

# Check console for OTP, then verify
curl -X POST http://localhost:5000/api/test/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"919876543210","otp":"123456"}'
```

### Test Scripts

- `backend/test-db-connection.js` - Test database connection
- `backend/test-gallabox-fixed.js` - Test Gallabox API with correct format ✅
- `backend/test-gallabox.js` - Old test (deprecated)
- `backend/test-new-api-key.js` - Old test (deprecated)
- `backend/test-x-api-key.js` - Old test (deprecated)

## Known Issues

### 1. CORS Port Switching

**Issue**: Frontend auto-switches between ports 5173 and 5174

**Solution**: Backend configured for both ports in CORS_ORIGIN

### 2. Database Not Required

**Note**: Test endpoints work without database for quick testing

**When needed**: Only for production deployment with real patient data

## Development Workflow

1. **Start Backend**: `cd backend && npm run dev`
2. **Start Frontend**: `cd mibo_version-2 && npm run dev`
3. **Test Booking**: Use frontend UI to test complete flow
4. **Check Logs**: Monitor backend console for OTP and errors
5. **Debug**: Use test scripts in backend folder

## Deployment Checklist

- [ ] Set up PostgreSQL database
- [ ] Run database migrations
- [ ] Configure production environment variables
- [ ] Change JWT secrets
- [ ] Switch Razorpay to live mode
- [ ] Fix Gallabox authentication
- [ ] Set up Google Meet (optional)
- [ ] Configure email service (optional)
- [ ] Build frontend: `npm run build`
- [ ] Build backend: `npm run build`
- [ ] Deploy to hosting service
- [ ] Set up SSL certificates
- [ ] Configure domain and DNS

## Support and Troubleshooting

### Backend Issues

- Check `.env` file exists and is configured
- Verify port 5000 is available
- Review console logs for errors
- Test database connection: `node test-db-connection.js`

### Frontend Issues

- Check backend is running on port 5000
- Verify `.env` has correct API URL
- Check browser console for errors
- Clear browser cache if needed

### API Issues

- Use test endpoints for debugging
- Check CORS configuration
- Verify authentication tokens
- Review API documentation

## Next Steps

1. **Immediate**: Test WhatsApp OTP delivery end-to-end ✅ DONE!
2. **Short-term**: Complete payment flow in frontend
3. **Medium-term**: Set up database and migrate from test mode
4. **Long-term**: Add admin panel and patient dashboard features

## Contact

For questions or issues:

1. Review documentation files
2. Check test scripts
3. Review console logs
4. Contact development team

---

**Last Updated**: January 2, 2026
**Version**: 1.0.0
**Status**: Test Mode Ready ✅
