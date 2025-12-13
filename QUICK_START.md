# 🚀 Quick Start - Front Desk Payment Link Feature

## ⚡ 5-Minute Setup

### Step 1: Verify Configuration (1 min)

```bash
# Check .env file has these:
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret_key
GALLABOX_API_KEY=your_api_key
GALLABOX_API_SECRET=your_api_secret
```

### Step 2: Set Doctor Fees (1 min)

```sql
-- Set consultation fees for all doctors
UPDATE clinician_profiles
SET consultation_fee = 1500
WHERE id = 5;
```

### Step 3: Test the Feature (3 min)

```bash
# 1. Login as front desk
POST http://localhost:5000/api/auth/login/phone-password
{
  "phone": "9876543210",
  "password": "YourPassword"
}

# 2. Book appointment (use existing patient and doctor IDs)
POST http://localhost:5000/api/appointments
Authorization: Bearer <token>
{
  "patient_id": 1,
  "clinician_id": 5,
  "centre_id": 1,
  "appointment_type": "IN_PERSON",
  "scheduled_start_at": "2024-01-30T10:00:00.000Z",
  "duration_minutes": 30
}

# 3. Send payment link
POST http://localhost:5000/api/payments/send-payment-link
Authorization: Bearer <token>
{
  "appointment_id": 1
}
```

**Done!** Patient receives WhatsApp with payment link.

---

## 📱 Front Desk Workflow (30 seconds)

1. Book appointment → Get appointment ID
2. Click "Send Payment Link" → Enter appointment ID
3. Done! Patient receives WhatsApp

---

## 📚 Full Documentation

- **User Guide:** `FRONT_DESK_USER_GUIDE.md`
- **Testing:** `TESTING_CHECKLIST.md`
- **Technical:** `PAYMENT_LINK_FEATURE_SUMMARY.md`
- **Complete:** `IMPLEMENTATION_COMPLETE.md`

---

## ✅ Ready to Use!

The feature is **fully implemented** and ready for testing/production.

**Questions?** Check the documentation files above.
