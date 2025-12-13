# Admin Panel - Complete Integration Guide

> **Everything you need to connect your admin panel UI to the backend**  
> Copy this file to your admin panel project folder

---

## 🎯 Quick Start

### 1. Backend is Ready

- ✅ 60+ API endpoints
- ✅ JWT authentication
- ✅ Role-based access control
- ✅ Automatic notifications
- ✅ Payment processing
- ✅ Video consultations

### 2. Backend URL

```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

### 3. What You Need to Build

**Core Pages:**

1. Login Page (3 methods: Phone+OTP, Phone+Password, Username+Password)
2. Dashboard (role-specific)
3. Patient Management
4. Appointment Management
5. Doctor Management
6. Centre Management
7. Payment Management
8. Analytics Dashboard

**Role-Specific Pages:**

- **Doctor Dashboard**: View appointments (current, upcoming, past)
- **Front Desk**: Book appointments, send payment links
- **Admin**: Full system management

---

## 📚 Documentation Files

I've created comprehensive documentation for you:

### Integration Guides

1. **BACKEND_API_INTEGRATION_GUIDE.md** - Complete API reference
2. **FRONTEND_INTEGRATION_EXAMPLES.md** - Code examples
3. **API_REFERENCE.md** - Detailed API documentation (60+ endpoints)

### Feature Guides

1. **DOCTOR_LOGIN_GUIDE.md** - Doctor features
2. **FRONT_DESK_USER_GUIDE.md** - Front desk workflow
3. **ONLINE_CONSULTATION_FEATURE.md** - Online consultation details
4. **PAYMENT_LINK_FEATURE_SUMMARY.md** - Payment link feature

### Reference

1. **USER_ROLES_AND_PERMISSIONS.md** - Complete permission matrix
2. **COMPLETE_SYSTEM_STATUS.md** - System overview

---

## 🔐 Authentication Implementation

### Login Flow

```javascript
// 1. User enters credentials
// 2. Call login API
// 3. Store tokens in localStorage
// 4. Redirect based on role

const login = async (credentials) => {
  const response = await fetch(
    "http://localhost:5000/api/auth/login/phone-password",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    }
  );

  const data = await response.json();

  if (data.success) {
    localStorage.setItem("accessToken", data.data.accessToken);
    localStorage.setItem("refreshToken", data.data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.data.user));

    // Redirect based on role
    if (data.data.user.role === "CLINICIAN") {
      navigate("/doctor-dashboard");
    } else if (data.data.user.role === "FRONT_DESK") {
      navigate("/front-desk");
    } else {
      navigate("/dashboard");
    }
  }
};
```

### Protected Routes

```javascript
// ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRoles }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("accessToken");

  if (!token || !user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}

// Usage
<Route
  path="/admin"
  element={
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <AdminPanel />
    </ProtectedRoute>
  }
/>;
```

---

## 🎨 UI Components Needed

### 1. Login Page

- Phone/Username input
- Password input
- OTP input (conditional)
- Login method selector
- Remember me checkbox
- Forgot password link

### 2. Dashboard (Role-Based)

**ADMIN Dashboard:**

- Total patients, appointments, revenue
- Recent appointments
- Top doctors
- Analytics charts
- Quick actions

**MANAGER Dashboard:**

- Centre-wise statistics
- Appointment overview
- Revenue tracking
- Staff management

**CLINICIAN Dashboard:**

- Today's appointments
- Upcoming appointments
- Past appointments
- Patient details
- Quick notes

**FRONT_DESK Dashboard:**

- Book appointment
- Check availability
- Send payment link
- View today's schedule

### 3. Patient Management

- Patient list (searchable, filterable)
- Add patient form
- Edit patient form
- Patient details view
- Appointment history
- Medical notes

### 4. Appointment Management

- Appointment calendar view
- Appointment list view
- Create appointment form
- Check doctor availability
- Appointment details
- Cancel/reschedule options

### 5. Doctor Management

- Doctor list
- Add doctor form
- Edit doctor profile
- Manage availability
- View doctor schedule
- Performance metrics

### 6. Centre Management

- Centre list
- Add centre form
- Edit centre details
- Centre staff assignments
- Centre statistics

### 7. Payment Management

- Payment list
- Payment details
- Send payment link
- Process refund
- Payment history
- Revenue reports

### 8. Analytics Dashboard

- Revenue charts
- Appointment trends
- Top doctors
- Patient demographics
- Centre performance

---

## 📱 Key Features to Implement

### 1. Doctor Dashboard (NEW!)

```javascript
// Fetch doctor's appointments
const fetchDoctorAppointments = async () => {
  const response = await fetch(
    "http://localhost:5000/api/appointments/my-appointments",
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    }
  );

  const data = await response.json();

  // data.data contains:
  // - current: Today's appointments
  // - upcoming: Future appointments
  // - past: Previous appointments
  // - summary: Counts
};
```

### 2. Online Consultation Booking (NEW!)

```javascript
// When booking ONLINE appointment, system automatically:
// 1. Generates Google Meet link
// 2. Sends WhatsApp to patient
// 3. Sends email to patient
// 4. Sends WhatsApp to doctor
// 5. Notifies all admins/managers

const bookOnlineConsultation = async (appointmentData) => {
  const response = await fetch("http://localhost:5000/api/appointments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...appointmentData,
      appointment_type: "ONLINE", // This triggers auto-notifications
    }),
  });

  // No additional steps needed!
  // Meet link is auto-generated and sent
};
```

### 3. Payment Link Feature (NEW!)

```javascript
// Send payment link to patient
const sendPaymentLink = async (appointmentId) => {
  const response = await fetch(
    "http://localhost:5000/api/payments/send-payment-link",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ appointment_id: appointmentId }),
    }
  );

  // System automatically:
  // 1. Fetches consultation fee from doctor profile
  // 2. Creates Razorpay payment link
  // 3. Sends WhatsApp to patient with link
  // 4. Link expires in 24 hours
};
```

---

## 🔄 State Management Recommendations

### Using Context API

```javascript
// AuthContext.js
import React, { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData, tokens) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("accessToken", tokens.accessToken);
    localStorage.setItem("refreshToken", tokens.refreshToken);
  };

  const logout = () => {
    setUser(null);
    localStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### Using Redux Toolkit

```javascript
// authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../services/api";

export const loginUser = createAsyncThunk("auth/login", async (credentials) => {
  const response = await apiClient.post(
    "/auth/login/phone-password",
    credentials
  );
  return response.data.data;
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: null,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.clear();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        localStorage.setItem("accessToken", action.payload.accessToken);
        localStorage.setItem("refreshToken", action.payload.refreshToken);
        localStorage.setItem("user", JSON.stringify(action.payload.user));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
```

---

## 🎯 Role-Based UI Rendering

```javascript
// RoleBasedComponent.jsx
import { useAuth } from "../context/AuthContext";

function RoleBasedComponent() {
  const { user } = useAuth();

  return (
    <div>
      {/* Show to all authenticated users */}
      <Dashboard />

      {/* Show only to ADMIN */}
      {user.role === "ADMIN" && <AdminPanel />}

      {/* Show to ADMIN and MANAGER */}
      {["ADMIN", "MANAGER"].includes(user.role) && <AnalyticsDashboard />}

      {/* Show only to CLINICIAN */}
      {user.role === "CLINICIAN" && <DoctorDashboard />}

      {/* Show only to FRONT_DESK */}
      {user.role === "FRONT_DESK" && <FrontDeskPanel />}
    </div>
  );
}
```

---

## ⚠️ Error Handling

```javascript
// errorHandler.js
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    const { status, data } = error.response;

    switch (status) {
      case 400:
        return data.message || "Invalid request";
      case 401:
        localStorage.clear();
        window.location.href = "/login";
        return "Session expired. Please login again.";
      case 403:
        return "You do not have permission to perform this action";
      case 404:
        return "Resource not found";
      case 500:
        return "Server error. Please try again later.";
      default:
        return data.message || "An error occurred";
    }
  } else if (error.request) {
    // Request made but no response
    return "Network error. Please check your connection.";
  } else {
    // Something else happened
    return error.message || "An unexpected error occurred";
  }
};

// Usage
try {
  await apiClient.post("/appointments", data);
} catch (error) {
  const errorMessage = handleApiError(error);
  alert(errorMessage);
}
```

---

## 📊 Data Fetching Patterns

### Using React Query

```javascript
// usePatients.js
import { useQuery, useMutation, useQueryClient } from "react-query";
import apiClient from "../services/api";

export const usePatients = (search = "") => {
  return useQuery(["patients", search], async () => {
    const response = await apiClient.get("/patients", {
      params: { search },
    });
    return response.data.data;
  });
};

export const useCreatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (patientData) => apiClient.post("/patients", patientData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("patients");
      },
    }
  );
};

// Usage in component
function PatientList() {
  const { data: patients, isLoading } = usePatients();
  const createPatient = useCreatePatient();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {patients.map((patient) => (
        <div key={patient.id}>{patient.full_name}</div>
      ))}
    </div>
  );
}
```

---

## ✅ Integration Checklist

### Phase 1: Setup

- [ ] Install axios or fetch wrapper
- [ ] Set up API client with interceptors
- [ ] Configure environment variables
- [ ] Set up routing (React Router)
- [ ] Set up state management (Context/Redux)

### Phase 2: Authentication

- [ ] Create login page (3 methods)
- [ ] Implement token storage
- [ ] Implement token refresh
- [ ] Create protected routes
- [ ] Implement logout

### Phase 3: Core Features

- [ ] Dashboard (role-based)
- [ ] Patient management
- [ ] Appointment management
- [ ] Doctor management
- [ ] Centre management

### Phase 4: Advanced Features

- [ ] Payment integration
- [ ] Online consultation booking
- [ ] Doctor dashboard
- [ ] Analytics dashboard
- [ ] Notification system

### Phase 5: Polish

- [ ] Error handling
- [ ] Loading states
- [ ] Form validation
- [ ] Responsive design
- [ ] Accessibility

---

## 🚀 Next Steps

1. **Read the documentation files** in this folder
2. **Set up your project** with the API client
3. **Implement authentication** first
4. **Build role-based dashboards**
5. **Integrate core features** one by one
6. **Test with backend** running on localhost:5000

---

## 📞 Backend Features Summary

### ✅ What's Already Working

1. **Authentication** - 3 login methods, JWT tokens
2. **Patient Management** - CRUD operations
3. **Appointment Management** - Booking, availability, cancellation
4. **Doctor Dashboard** - View appointments (current, upcoming, past)
5. **Online Consultations** - Auto-generate Meet link, send notifications
6. **Payment Links** - Auto-send via WhatsApp
7. **Notifications** - WhatsApp and Email
8. **Analytics** - Dashboard metrics, reports
9. **Role-Based Access** - 7 roles with proper permissions

### 🎯 Key Features

- **Automatic Google Meet links** for online appointments
- **Automatic WhatsApp notifications** to patients, doctors, admins
- **Automatic email notifications** (if configured)
- **Payment link generation** with auto-fee fetching
- **Doctor appointment dashboard** with categorization
- **Complete audit trail** with notification logs

---

## 📚 Documentation Reference

All documentation files are in this backend project folder:

1. `BACKEND_API_INTEGRATION_GUIDE.md` - API reference
2. `FRONTEND_INTEGRATION_EXAMPLES.md` - Code examples
3. `API_REFERENCE.md` - Complete API docs
4. `USER_ROLES_AND_PERMISSIONS.md` - Permission matrix
5. `DOCTOR_LOGIN_GUIDE.md` - Doctor features
6. `ONLINE_CONSULTATION_FEATURE.md` - Online consultation
7. `PAYMENT_LINK_FEATURE_SUMMARY.md` - Payment links
8. `FRONT_DESK_USER_GUIDE.md` - Front desk workflow

---

**Ready to integrate!** 🎉

Start with authentication, then build role-based dashboards, and integrate features one by one.
