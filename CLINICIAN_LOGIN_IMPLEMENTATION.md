# Clinician Login Implementation - Task 1.1

## Summary

Successfully implemented clinician authentication enhancement to query clinician profile during login and include clinician ID in JWT payload.

## Changes Made

### 1. JWT Payload Enhancement (`backend/src/utils/jwt.ts`)

**Added:**

- `clinicianId?: number` field to `JwtPayload` interface

**Purpose:** Enable JWT tokens to carry clinician ID for role-based access control.

### 2. Auth Service Enhancement (`backend/src/services/auth.services.ts`)

#### 2.1 AuthResponse Interface Update

**Added:**

- `clinicianId?: number` field to the user object in `AuthResponse` interface

#### 2.2 Database Import

**Added:**

- `import { db } from "../config/db"` to enable direct database queries

#### 2.3 loginWithUsernamePassword() Method Enhancement

**Implementation:**

```typescript
// Query clinician profile
const clinicianProfile = await db.oneOrNone<{ id: number }>(
  "SELECT id FROM clinician_profiles WHERE user_id = $1 AND is_active = TRUE",
  [user.id],
);

// Check if user has CLINICIAN role
const userWithRoles = await userRepository.findByIdWithRolesAndCentres(user.id);
const isClinician = userWithRoles?.roles?.includes("CLINICIAN");

// If user has CLINICIAN role but no clinician profile, deny access
if (isClinician && !clinicianProfile) {
  throw ApiError.forbidden("Access denied");
}

// Generate tokens and return response
return this.generateAuthResponse(user.id, clinicianProfile?.id);
```

**Key Features:**

- Queries `clinician_profiles` table after user validation
- Checks if user has CLINICIAN role
- Returns 403 error if CLINICIAN user has no clinician profile
- Passes clinician ID to token generation

#### 2.4 generateAuthResponse() Method Update

**Changes:**

- Added optional `clinicianId?: number` parameter
- Includes clinicianId in JWT payload when present
- Passes clinicianId to formatUserResponse()

**Implementation:**

```typescript
const payload = {
  userId: userWithRoles.id,
  phone: userWithRoles.phone || "",
  userType: userWithRoles.user_type,
  roles: userWithRoles.roles,
  ...(clinicianId && { clinicianId }),
};
```

#### 2.5 formatUserResponse() Method Update

**Changes:**

- Added optional `clinicianId?: number` parameter
- Includes clinicianId in user response object when present

**Implementation:**

```typescript
return {
  id: user.id.toString(),
  name: user.full_name,
  // ... other fields
  ...(clinicianId && { clinicianId }),
};
```

## Requirements Satisfied

✅ **Requirement 1.2:** Modify `loginWithUsernamePassword()` to query clinician profile  
✅ **Requirement 1.3:** Add clinician ID to JWT payload when clinician profile exists  
✅ **Requirement 1.6:** Return 403 error if STAFF user has no clinician profile

## Backward Compatibility

✅ All changes are backward compatible:

- Non-clinician users continue to work without clinicianId
- Existing authentication methods (phone + OTP, phone + password) are unaffected
- Optional clinicianId field doesn't break existing API consumers

## Testing

### Manual Testing Script

Created `backend/test-clinician-login.js` for manual verification:

**Test Cases:**

1. Login with valid clinician credentials → Should include clinicianId
2. Login with non-clinician staff → Should NOT include clinicianId
3. Login with CLINICIAN role but no profile → Should return 403 Forbidden

**To Run:**

```bash
# Update test credentials in the script first
node backend/test-clinician-login.js
```

### Expected Behavior

**Clinician Login Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "123",
      "name": "Dr. John Doe",
      "role": "CLINICIAN",
      "clinicianId": 45,
      ...
    },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

**JWT Token Payload:**

```json
{
  "userId": 123,
  "phone": "9876543210",
  "userType": "STAFF",
  "roles": ["CLINICIAN"],
  "clinicianId": 45,
  "iat": 1234567890,
  "exp": 1234571490
}
```

## Next Steps

This implementation completes Task 1.1. The following tasks will build upon this:

- **Task 1.2:** Implement appointment filtering by clinician ID
- **Task 1.3:** Add role-based middleware for access control
- **Task 1.4:** Update admin panel UI to adapt for clinician role

## Files Modified

1. `backend/src/utils/jwt.ts` - Added clinicianId to JwtPayload
2. `backend/src/services/auth.services.ts` - Enhanced login and token generation

## Files Created

1. `backend/test-clinician-login.js` - Manual test script
2. `backend/CLINICIAN_LOGIN_IMPLEMENTATION.md` - This documentation
