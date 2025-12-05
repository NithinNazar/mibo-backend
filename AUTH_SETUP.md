# Authentication Setup Documentation

## Overview

The admin panel has a complete JWT-based authentication system ready to connect to your Express + TypeScript + PostgreSQL backend. Currently, authentication is **disabled** and the dashboard loads directly.

## File Structure

```
src/
├── services/
│   ├── api.ts                 # Axios instance with JWT interceptors
│   └── authService.ts         # Authentication API calls
├── contexts/
│   └── AuthContext.tsx        # React context for auth state
├── modules/auth/pages/
│   └── LoginPage.tsx          # Login UI with 3 auth methods
└── types/
    └── index.ts               # TypeScript types
```

## Authentication Methods Supported

### 1. Phone + OTP

- User enters phone number
- System sends OTP
- User enters OTP to login

### 2. Phone + Password

- User enters phone number and password
- Direct login

### 3. Username + Password

- User enters username and password
- Direct login

## Backend API Endpoints Expected

Your Express backend should implement these endpoints:

### POST `/api/auth/send-otp`

```typescript
Request: {
  phone: string;
}
Response: {
  message: string;
}
```

### POST `/api/auth/login/phone-otp`

```typescript
Request: { phone: string, otp: string }
Response: {
  user: User,
  accessToken: string,
  refreshToken: string
}
```

### POST `/api/auth/login/phone-password`

```typescript
Request: { phone: string, password: string }
Response: {
  user: User,
  accessToken: string,
  refreshToken: string
}
```

### POST `/api/auth/login/username-password`

```typescript
Request: { username: string, password: string }
Response: {
  user: User,
  accessToken: string,
  refreshToken: string
}
```

### POST `/api/auth/refresh`

```typescript
Request: {
  refreshToken: string;
}
Response: {
  accessToken: string;
}
```

### POST `/api/auth/logout`

```typescript
Request: authenticated;
Response: {
  message: string;
}
```

### GET `/api/auth/me`

```typescript
Request: (authenticated with Bearer token)
Response: User
```

## JWT Token Flow

1. **Login**: User logs in → Backend returns `accessToken` and `refreshToken`
2. **Storage**: Tokens stored in `localStorage`
3. **Requests**: `accessToken` automatically added to all API requests via interceptor
4. **Refresh**: When `accessToken` expires (401), automatically refresh using `refreshToken`
5. **Logout**: Clear tokens and redirect to login

## How to Enable Authentication

### Step 1: Update Environment Variables

Create `.env` file:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### Step 2: Enable Auth in Router

In `src/router/index.tsx`:

```typescript
// Uncomment these lines:
import { useAuth } from "../contexts/AuthContext";

function AppRouter() {
  const { isAuthenticated, isLoading } = useAuth();
  // Remove: const isAuthenticated = true;
  // Remove: const isLoading = false;

  // Rest of the code...
}
```

### Step 3: Enable Auth Provider

In `src/App.tsx`:

```typescript
// Uncomment these lines:
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>  {/* Uncomment this */}
        <AppRouter />
        <Toaster ... />
      </AuthProvider>  {/* Uncomment this */}
    </BrowserRouter>
  );
}
```

### Step 4: Enable Logout in Topbar

In `src/layouts/AdminLayout/Topbar.tsx`:

```typescript
// Uncomment these lines:
import { useAuth } from "../../contexts/AuthContext";

const Topbar: React.FC = () => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout(); // Uncomment this
    navigate("/login");
  };

  // Rest of the code...
};
```

## User Type Definition

```typescript
export interface User {
  id: string;
  name: string;
  email?: string;
  phone: string;
  username?: string;
  role: UserRole;
  avatar?: string;
  centreIds: string[];
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

export type UserRole =
  | "admin"
  | "manager"
  | "centre_manager"
  | "clinician"
  | "care_coordinator"
  | "front_desk";
```

## Security Features

✅ JWT tokens with automatic refresh
✅ Secure token storage in localStorage
✅ Automatic token injection in API requests
✅ 401 handling with token refresh
✅ Protected routes
✅ Role-based access control ready
✅ Logout clears all auth data

## Testing the Login UI

To see the login page:

1. In `src/router/index.tsx`, change `const isAuthenticated = true;` to `false`
2. Navigate to `http://localhost:5173/login`
3. You'll see the full login UI with all 3 authentication methods

## Current State

🟢 **Dashboard loads directly** (authentication disabled)
🟢 **All auth files are ready** and waiting for backend connection
🟢 **Login UI is complete** with all 3 methods
🟢 **JWT flow is implemented** and ready to use

## Next Steps

1. Implement the backend API endpoints listed above
2. Test each authentication method
3. Enable authentication by following the steps in "How to Enable Authentication"
4. Implement role-based access control for different user types
