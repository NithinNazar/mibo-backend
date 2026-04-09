# Username/Password Login Feature

## Overview

Added username/password login alongside existing phone/OTP authentication for Razorpay verification purposes.

## Test Credentials

**Username:** `testuser123`  
**Password:** `test@789`  
**Email:** `testuser123@mibocare.com`

## API Endpoint

### Login with Username/Password

```
POST /api/patient-auth/login-with-password
Content-Type: application/json

{
  "username": "testuser123",
  "password": "test@789"
}
```

### Response

```json
{
  "success": true,
  "message": "Login successful! Welcome back.",
  "data": {
    "user": {
      "id": "104",
      "phone": "919111111111",
      "email": "testuser123@mibocare.com",
      "fullName": "Test User for Razorpay",
      "userType": "PATIENT"
    },
    "patient": {
      "id": "43",
      "dateOfBirth": null,
      "gender": null,
      "bloodGroup": null
    },
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}
```

## Files Modified (Backend)

1. **backend/src/repositories/patient.repository.ts**
   - Added `findUserByUsername()` method
   - Added `verifyPassword()` method

2. **backend/src/services/patient-auth.service.ts**
   - Added `loginWithPassword()` method

3. **backend/src/controllers/patient-auth.controller.ts**
   - Added `loginWithPassword()` controller method

4. **backend/src/routes/patient-auth.routes.ts**
   - Added `POST /login-with-password` route

## Frontend Implementation Needed

You need to add a login form in the frontend that:

1. Shows two options: "Login with Phone" and "Login with Username"
2. For username login, shows username and password fields
3. Calls the new API endpoint: `POST /api/patient-auth/login-with-password`
4. Stores the returned tokens (same as phone/OTP flow)

### Example Frontend Code

```typescript
// Login with username/password
const loginWithPassword = async (username: string, password: string) => {
  try {
    const response = await fetch(
      "http://localhost:5000/api/patient-auth/login-with-password",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      },
    );

    const data = await response.json();

    if (data.success) {
      // Store tokens
      localStorage.setItem("accessToken", data.data.accessToken);
      localStorage.setItem("refreshToken", data.data.refreshToken);

      // Redirect to dashboard
      navigate("/dashboard");
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error("Login error:", error);
    alert("Login failed");
  }
};
```

## How It Works

1. User enters username and password
2. Backend finds user by username
3. Backend verifies password using bcrypt
4. Backend generates JWT tokens (same as phone/OTP)
5. User is logged in and can access all features

## Important Notes

- **Does NOT break existing phone/OTP flow** - both methods work independently
- Uses the same JWT token system
- User can book appointments, make payments, etc. after login
- Password is hashed with bcrypt (secure)
- Test user is a real PATIENT in the database

## Testing

### Test the API directly:

```bash
node test-password-login.js
```

### Test with curl:

```bash
curl -X POST http://localhost:5000/api/patient-auth/login-with-password \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser123","password":"test@789"}'
```

## How to Remove After Razorpay Verification

### Step 1: Remove test user from database

```sql
DELETE FROM patient_profiles WHERE user_id = 104;
DELETE FROM users WHERE username = 'testuser123';
```

### Step 2: Remove backend code

Delete or comment out:

- `findUserByUsername()` in `patient.repository.ts`
- `verifyPassword()` in `patient.repository.ts`
- `loginWithPassword()` in `patient-auth.service.ts`
- `loginWithPassword()` in `patient-auth.controller.ts`
- Route in `patient-auth.routes.ts`

### Step 3: Remove frontend code

- Remove username/password login form
- Keep only phone/OTP login

## Security

- Password is hashed with bcrypt (10 rounds)
- Uses same JWT authentication as phone/OTP
- Tokens expire after configured time
- No plaintext passwords stored in database

## For Razorpay Verification Team

You can use these credentials to test the complete booking and payment flow:

- **Username:** testuser123
- **Password:** test@789

This is a real patient account that can:

- Browse clinicians
- Book appointments
- Make payments
- Access patient dashboard
