# isNewUser Flag Implementation

## Problem

The `sendOTP` API endpoint was not returning an `isNewUser` flag, which the frontend needs to conditionally display the Full Name and Email fields during authentication.

**Frontend Behavior:**

- New users should see: Phone → OTP → **Full Name (required)** → Email (optional)
- Existing users should see: Phone → OTP → Login directly

Without the `isNewUser` flag, the frontend couldn't determine whether to show the name/email fields.

## Solution

Added `isNewUser` flag to the `sendOTP` endpoint response by checking if a user with the given phone number already exists in the database.

## Changes Made

### 1. Backend Service (`backend/src/services/patient-auth.service.ts`)

**Modified:** `sendOTP()` method

**Before:**

```typescript
async sendOTP(phone: string): Promise<void> {
  // Generate and send OTP
  // No user existence check
}
```

**After:**

```typescript
async sendOTP(phone: string): Promise<{ isNewUser: boolean }> {
  // Check if user exists
  const existingUser = await patientRepository.findUserByPhone(phone);
  const isNewUser = !existingUser;

  // Generate and send OTP

  return { isNewUser };
}
```

### 2. Backend Controller (`backend/src/controllers/patient-auth.controller.ts`)

**Modified:** `sendOtp()` method response

**Before:**

```typescript
res.json({
  success: true,
  message: "OTP sent successfully to your WhatsApp",
  data: {
    phone,
    expiresIn: "10 minutes",
  },
});
```

**After:**

```typescript
const result = await patientAuthService.sendOTP(phone);

res.json({
  success: true,
  message: "OTP sent successfully to your WhatsApp",
  data: {
    phone,
    expiresIn: "10 minutes",
    isNewUser: result.isNewUser,
  },
});
```

## API Response Structure

### POST `/api/patient-auth/send-otp`

**Request:**

```json
{
  "phone": "919876543210"
}
```

**Response:**

```json
{
  "success": true,
  "message": "OTP sent successfully to your WhatsApp",
  "data": {
    "phone": "919876543210",
    "expiresIn": "10 minutes",
    "isNewUser": true
  }
}
```

## Frontend Integration

The frontend (`mibo_version-2/src/pages/auth/PatientAuth.tsx`) already has the logic to handle this flag:

```typescript
const response = await authService.sendOTP(phoneWithCountryCode);
setIsNewUser(response.data.isNewUser);

// Conditionally render name/email fields
{isNewUser && (
  <motion.div>
    <input type="text" placeholder="Full Name" required />
    <input type="email" placeholder="Email" optional />
  </motion.div>
)}
```

## Testing

✅ Backend builds successfully with TypeScript
✅ No breaking changes to existing functionality
✅ Frontend already expects this flag in the response

## Deployment Notes

1. Deploy backend first (contains the fix)
2. Frontend already supports this - no changes needed
3. Test with both new and existing users:
   - New user: Should see name/email fields after OTP is sent
   - Existing user: Should only see OTP field

## Files Modified

- `backend/src/services/patient-auth.service.ts`
- `backend/src/controllers/patient-auth.controller.ts`
