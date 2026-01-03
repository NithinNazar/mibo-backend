# Setup Guide - Mibo Mental Hospital Backend

Complete setup instructions for the backend API server.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

## Quick Start

### 1. Clone and Install

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/mibo-development-db

# JWT Secrets (change in production!)
JWT_ACCESS_SECRET=mibo_access_secret_change_in_production_min_32_chars
JWT_REFRESH_SECRET=mibo_refresh_secret_change_in_production_min_32_chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# OTP
OTP_EXPIRY_MINUTES=10

# Gallabox (WhatsApp) - Optional for testing
GALLABOX_BASE_URL=https://server.gallabox.com/api/v1/messages/whatsapp
GALLABOX_API_KEY=your_api_key
GALLABOX_API_SECRET=your_api_secret
GALLABOX_CHANNEL_ID=your_channel_id

# Razorpay (Test Mode)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# CORS
CORS_ORIGIN=http://localhost:5173

# Google Meet - Optional
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=primary
```

### 3. Database Setup

**Option A: Quick Setup (Recommended for Testing)**

Run the setup script to create tables and test data:

```bash
psql -U postgres -d mibo-development-db -f SETUP_TEST_DATA.sql
```

**Option B: Manual Setup**

1. Create database:

```bash
createdb mibo-development-db
```

2. Run schema migrations (if available) or use the SQL files provided

### 4. Start Development Server

```bash
npm run dev
```

Server runs on `http://localhost:5000`

### 5. Test the Connection

```bash
node test-db-connection.js
```

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration (env, logger, database)
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── repositories/    # Database queries
│   ├── routes/          # API routes
│   ├── middlewares/     # Auth, validation, error handling
│   ├── validations/     # Input validation schemas
│   ├── utils/           # Utilities (Gallabox, Razorpay, email)
│   └── server.ts        # Entry point
├── .env                 # Environment variables
└── package.json
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run typecheck` - Check TypeScript types

## Testing Mode

For quick testing without database setup, use the test OTP endpoints:

**Send OTP (Test Mode)**

```bash
POST http://localhost:5000/api/test/send-otp
Content-Type: application/json

{
  "phone": "919876543210"
}
```

**Verify OTP (Test Mode)**

```bash
POST http://localhost:5000/api/test/verify-otp
Content-Type: application/json

{
  "phone": "919876543210",
  "otp": "123456"
}
```

The OTP will be shown in:

1. Server console logs
2. Browser alert (in development mode)
3. WhatsApp (if Gallabox is configured)

## Third-Party Integrations

### Gallabox (WhatsApp)

1. Sign up at https://gallabox.com/
2. Get API credentials from Dashboard > Settings > API
3. Create and approve WhatsApp message templates
4. Add credentials to `.env`

**Status**: ✅ Working! OTP messages delivered to WhatsApp

**Correct Format** (as per Gallabox support):

```javascript
{
  channelId: "your_channel_id",
  channelType: "whatsapp",
  recipient: {
    name: "User",
    phone: "919876543210"
  },
  whatsapp: {
    type: "template",
    template: {
      templateName: "otp_verification",
      bodyValues: {
        otp: "123456"  // Named parameter
      }
    }
  }
}
```

**Headers**:

- `apiKey`: Your API key
- `apiSecret`: Your API secret
- `Content-Type`: application/json

### Razorpay (Payments)

1. Sign up at https://razorpay.com/
2. Get test API keys from Dashboard > Settings > API Keys
3. Add credentials to `.env`
4. Use test mode for development

**Test Cards**:

- Success: 4111 1111 1111 1111
- Failure: 4000 0000 0000 0002

### Google Meet (Optional)

1. Create Google Cloud Project
2. Enable Google Calendar API
3. Create Service Account
4. Download credentials JSON
5. Add to `.env`

## Common Issues

### CORS Errors

If frontend runs on different port (5173 or 5174), update `.env`:

```env
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
```

### Database Connection Failed

1. Check PostgreSQL is running: `pg_isready`
2. Verify DATABASE_URL in `.env`
3. Test connection: `node test-db-connection.js`

### Port Already in Use

Change PORT in `.env` or kill existing process:

```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

## Next Steps

1. Review [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for available endpoints
2. Check [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) for system architecture
3. See [README.md](./README.md) for backend-specific details
4. Test booking flow with frontend integration

## Support

For issues or questions:

1. Check existing documentation files
2. Review server logs in console
3. Test with provided test scripts
4. Contact development team
