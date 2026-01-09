# 🎯 Frontend Booking Flow Integration Guide

## Complete Implementation for Gallabox OTP + Razorpay Payment

This guide provides the exact code you need to update in your frontend to integrate with the backend booking flow.

---

## 📁 File 1: Create `src/services/bookingService.ts`

```typescript
/**
 * Booking Service
 * 
 * Handles the complete booking flow with Gallabox OTP and Razorpay payment
 */

import apiClient from "./api";

export interface InitiateBookingRequest {
  phone: string;
  clinician_id: number;
  centre_id: number;
  appointment_type: "IN_PERSON" | "ONLINE";
  scheduled_start_at: string; // ISO 8601 format
  duration_minutes?: number;
}

export interface ConfirmBookingRequest {
  phone: string;
  otp: string;
  full_name: string;
  email?: string;
  clinician_id: number;
  centre_id: number;
  appointment_type: "IN_PERSON" | "ONLINE";
  scheduled_start_at: string;
  duration_minutes?: number;
}

class BookingService {
  /**
   * Step 1: Initiate booking and send OTP via WhatsApp
   */
  async initiateBooking(data: InitiateBookingRequest) {
    const response = await apiClient.post("/booking/initiate", data);
    return response.data;
  }

  /**
   * Step 2: Verify OTP and confirm booking
   */
  async confirmBooking(data: ConfirmBookingRequest) {
    const response = await apiClient.post("/booking/confirm", data);
    
    // Store authentication tokens
    const { accessToken, refreshToken } = response.data.data.auth;
    localStorage.setItem("mibo_access_token", accessToken);
    localStorage.setItem("mibo_refresh_token", refreshToken);
    localStorage.setItem("mibo_user", JSON.stringify(response.data.data.patient));
    
    return response.data;
  }

  /**
   * Step 3: Handle payment success
   */
  async handlePaymentSuccess(data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) {
    const response = await apiClient.post("/booking/payment-success", data);
    return response.data;
  }

  /**
   * Handle payment failure
   */
  async handlePaymentFailure(orderId: string, reason?: string) {
    const response = await apiClient.post("/booking/payment-failure", {
      razorpay_order_id: orderId,
      reason,
    });
    return response.data;
  }
}

export default new BookingService();
```

---

## 📁 File 2: Update `src/services/authService.ts`

Update the endpoints to use the new patient-auth endpoints:

```typescript
// Change these lines:
// OLD:
async sendOTP(phone: string) {
  const response = await apiClient.post("/auth/send-otp", { phone });
  return response.data;
}

async verifyOTP(phone: string, otp: string) {
  const response = await apiClient.post("/auth/login/phone-otp", { phone, otp });
  // ... rest of code
}

// NEW:
async sendOTP(phone: string) {
  const response = await apiClient.post("/patient-auth/send-otp", { phone });
  return response.data;
}

async verifyOTP(phone: string, otp: string, full_name?: string, email?: string) {
  const response = await apiClient.post("/patient-auth/verify-otp", {
    phone,
    otp,
    full_name,
    email
  });
  
  const { accessToken, refreshToken, user } = response.data.data;
  localStorage.setItem("mibo_access_token", accessToken);
  localStorage.setItem("mibo_refresh_token", refreshToken);
  localStorage.setItem("mibo_user", JSON.stringify(user));
  
  return response.data;
}
```

---

## 📁 File 3: Update `src/pages/BookAppointment/Step1SessionDetails.tsx`

Add dummy calendar slots and update to use booking service:

```typescript
import { useState } from "react";
import bookingService from "../../services/bookingService";

// Add dummy time slots
const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30"
];

export default function Step1SessionDetails({ doctor, bookingData, setBookingData, onContinue, onBack }) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedMode, setSelectedMode] = useState("IN_PERSON");
  const [loading, setLoading] = useState(false);

  const handleContinue = () => {
    if (!selectedDate || !selectedTime) {
      alert("Please select date and time");
      return;
    }

    // Combine date and time into ISO format
    const scheduledDateTime = `${selectedDate}T${selectedTime}:00Z`;

    setBookingData({
      ...bookingData,
      mode: selectedMode,
      date: se