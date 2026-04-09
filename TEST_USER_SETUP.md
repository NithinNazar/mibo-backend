# Test User Setup for Razorpay Verification

## Overview

A hardcoded test user has been added to allow Razorpay to verify the payment flow without needing SMS/WhatsApp OTP.

## Test Credentials

**Phone Number:** `919999999999`  
**OTP:** `123456`

## How It Works

1. When you enter phone `919999999999` on the login page, the system:
   - Skips rate limiting
   - Skips sending SMS/WhatsApp
   - Uses the hardcoded OTP `123456` from environment variables
   - Logs test user info to console

2. Enter OTP `123456` to login

3. If the user doesn't exist, you'll need to provide a name (e.g., "Test User")

## Configuration

The test credentials are stored in `.env`:

```env
# Test User for Razorpay Verification (REMOVE AFTER VERIFICATION)
TEST_PHONE_NUMBER=919999999999
TEST_OTP=123456
```

## Files Modified

1. `backend/.env` - Added test credentials
2. `backend/src/services/patient-auth.service.ts` - Added test user logic in `sendOTP()` method

## How to Remove After Razorpay Verification

### Step 1: Remove from .env

Delete these lines from `backend/.env`:

```env
# Test User for Razorpay Verification (REMOVE AFTER VERIFICATION)
TEST_PHONE_NUMBER=919999999999
TEST_OTP=123456
```

### Step 2: Remove from service

In `backend/src/services/patient-auth.service.ts`, find the `sendOTP()` method and remove this block:

```typescript
// TEST USER: Skip rate limiting and SMS for test phone number
const TEST_PHONE = process.env.TEST_PHONE_NUMBER;
const TEST_OTP = process.env.TEST_OTP;

if (TEST_PHONE && TEST_OTP && phone === TEST_PHONE) {
  logger.info(`🧪 TEST USER: Using hardcoded OTP for ${phone}`);

  // Check if user exists
  const existingUser = await patientRepository.findUserByPhone(phone);
  const isNewUser = !existingUser;

  // Store test OTP in database
  await patientRepository.storeOTP(phone, TEST_OTP, "LOGIN");

  console.log(
    `\n🧪 TEST USER LOGIN\n📱 Phone: ${phone}\n🔐 OTP: ${TEST_OTP}\n`,
  );

  return { isNewUser };
}

// REGULAR FLOW: Rate limiting and SMS
```

Keep only the "REGULAR FLOW" code.

### Step 3: Restart backend

```bash
npm run dev
```

## Important Notes

- This test user bypasses SMS/WhatsApp sending
- It still creates a real user in the database
- It follows the same authentication flow as regular users
- No changes needed to frontend
- Safe to use in production temporarily (only works if env vars are set)
- Easy to remove - just delete env vars and the if block

## Testing the Flow

1. Start backend: `npm run dev`
2. Go to frontend login page
3. Enter phone: `919999999999`
4. Click "Send OTP"
5. Console will show: `🧪 TEST USER LOGIN` with credentials
6. Enter OTP: `123456`
7. If new user, enter name: "Test User"
8. You'll be logged in successfully

## For Razorpay Verification Team

You can use these credentials to test the complete booking and payment flow:

- **Username/Phone:** 919999999999
- **Password/OTP:** 123456

The system uses phone + OTP authentication, not traditional username/password.
