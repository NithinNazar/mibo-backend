# Mibo Backend API

Node.js + Express + TypeScript backend for Mibo Mental Hospital booking system.

## Quick Start

```bash
npm install
npm run dev
```

Server runs on `http://localhost:5000`

## Key Features

- **Test Mode OTP**: No database required for testing (`/api/test/send-otp`, `/api/test/verify-otp`)
- **Patient Authentication**: OTP-based login/registration
- **Booking System**: Complete appointment booking flow
- **Payment Integration**: Razorpay test mode ready
- **WhatsApp Notifications**: Gallabox integration (pending API fix)
- **Google Meet**: Online consultation links (optional)

## Tech Stack

- Node.js 18+ with Express
- TypeScript
- PostgreSQL 14+
- JWT authentication
- Razorpay payments
- Gallabox WhatsApp API
- Google Calendar API

## Project Structure

```
src/
├── config/          # Env, logger, database
├── controllers/     # Request handlers
├── services/        # Business logic
├── repositories/    # Database queries
├── routes/          # API endpoints
├── middlewares/     # Auth, validation, errors
├── validations/     # Input schemas
├── utils/           # Gallabox, Razorpay, email
└── server.ts        # Entry point
```

## Scripts

- `npm run dev` - Development with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run typecheck` - Check TypeScript types

## Documentation

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup instructions
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - All API endpoints
- **[PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)** - System architecture

## Testing

Use test endpoints for quick testing without database:

```bash
# Send OTP
curl -X POST http://localhost:5000/api/test/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"919876543210"}'

# Verify OTP (check console for OTP)
curl -X POST http://localhost:5000/api/test/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"919876543210","otp":"123456"}'
```

## Environment Setup

Copy `.env.example` to `.env` and configure:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/mibo-development-db
RAZORPAY_KEY_ID=rzp_test_your_key
RAZORPAY_KEY_SECRET=your_secret
GALLABOX_API_KEY=your_key
CORS_ORIGIN=http://localhost:5173
```

## Current Status

✅ **Working**:

- Test OTP endpoints (no database needed)
- Patient authentication flow
- Booking system structure
- Razorpay integration (test mode)
- **WhatsApp OTP delivery via Gallabox ✅**
- CORS configured for frontend

⚠️ **In Progress**:

- Database schema setup
- Google Meet integration (optional)

- Gallabox WhatsApp API (401 error - awaiting support)
- Database schema setup
- Google Meet integration

## Integration with Frontend

Frontend runs on `http://localhost:5173` or `5174`. CORS is configured for both ports.

See documentation files for integration details.

## Support

Check documentation files for detailed information:

- Setup issues → SETUP_GUIDE.md
- API usage → API_DOCUMENTATION.md
- Architecture → PROJECT_OVERVIEW.md
