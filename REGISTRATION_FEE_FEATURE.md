# Registration Fee Feature - Implementation Complete

## Overview

Implemented one-time registration fee (₹100) for new patients. New patients pay consultation fee + ₹100 registration fee on their first appointment. Existing patients (who have already paid) only pay consultation fee.

---

## 🎯 Feature Requirements

### Business Logic

1. **New Patient**: First-time booking → Pay consultation fee + ₹100 registration fee
2. **Existing Patient**: Has paid before → Pay only consultation fee
3. **One-Time Fee**: Registration fee is charged only once, ever
4. **Applies Everywhere**: Both website booking and admin panel booking

### Example

- Clinician consultation fee: ₹2500
- **New patient** pays: ₹2500 + ₹100 = **₹2600**
- **Existing patient** pays: **₹2500** (no registration fee)

---

## 📊 Database Changes

### Migration File

**File**: `migrations/add_registration_fee_tracking.sql`

### Changes Made

#### 1. patient_profiles Table

```sql
-- New columns added
ALTER TABLE patient_profiles
ADD COLUMN registration_fee_paid BOOLEAN DEFAULT FALSE NOT NULL;

ALTER TABLE patient_profiles
ADD COLUMN registration_fee_paid_at TIMESTAMP WITH TIME ZONE;

-- Index for fast lookups
CREATE INDEX idx_patient_profiles_registration_fee_paid
ON patient_profiles(registration_fee_paid);
```

**Fields:**

- `registration_fee_paid` (BOOLEAN): Whether patient has paid the one-time ₹100 fee
- `registration_fee_paid_at` (TIMESTAMP): When the fee was paid

#### 2. payments Table

```sql
-- New columns added
ALTER TABLE payments
ADD COLUMN registration_fee NUMERIC(10,2) DEFAULT 0 NOT NULL;

ALTER TABLE payments
ADD COLUMN consultation_fee NUMERIC(10,2) DEFAULT 0 NOT NULL;
```

**Fields:**

- `registration_fee` (NUMERIC): Amount of registration fee in this payment (₹100 or ₹0)
- `consultation_fee` (NUMERIC): Clinician's consultation fee (separate from registration)

#### 3. Existing Patients Marked as Paid

```sql
-- Automatically mark existing patients who have successful payments
UPDATE patient_profiles pp
SET
  registration_fee_paid = TRUE,
  registration_fee_paid_at = (first successful payment date)
WHERE patient has at least one successful payment
```

**Result**: All 11 existing patients with successful payments are marked as having paid registration fee.

---

## 🔧 Backend Implementation

### 1. Patient Repository

**File**: `src/repositories/patient.repository.ts`

#### New Methods Added

```typescript
/**
 * Check if patient has paid registration fee
 */
async hasPatientPaidRegistrationFee(userId: number): Promise<boolean>

/**
 * Mark patient as having paid registration fee
 */
async markRegistrationFeePaid(userId: number): Promise<void>
```

### 2. Payment Service

**File**: `src/services/payment.service.ts`

#### Updated Methods

##### createPaymentOrder()

```typescript
// Check if patient has paid registration fee
const hasPatientPaidRegistrationFee =
  await patientRepository.hasPatientPaidRegistrationFee(userId);

// Add registration fee for new patients
const registrationFee = hasPatientPaidRegistrationFee ? 0 : 100;
const totalAmount = consultationFee + registrationFee;

// Store in payment record
await paymentRepository.createPayment({
  ...
  consultationFee: consultationFee,
  registrationFee: registrationFee,
});
```

**Returns:**

```typescript
{
  orderId: string,
  amount: number,  // Total in paise (consultation + registration)
  consultationFee: number,  // ₹2500
  registrationFee: number,  // ₹100 or ₹0
  ...
}
```

##### verifyPayment()

```typescript
// After successful payment verification
if (payment.registration_fee && payment.registration_fee > 0) {
  await patientRepository.markRegistrationFeePaid(userId);
  logger.info(`✅ Registration fee marked as paid for user ${userId}`);
}
```

##### sendPaymentLink() (Admin Panel)

```typescript
// Check registration fee status for patient
const hasPatientPaidRegistrationFee =
  await patientRepository.hasPatientPaidRegistrationFee(patientUser.id);

const registrationFee = hasPatientPaidRegistrationFee ? 0 : 100;
const totalAmount = consultationFee + registrationFee;

// Create payment link with total amount
const paymentLink = await razorpayUtil.createPaymentLink(
  totalAmount * 100,  // in paise
  ...
);
```

##### handleWebhook()

```typescript
// Mark registration fee as paid when webhook confirms payment
if (payment.registration_fee && payment.registration_fee > 0) {
  await patientRepository.markRegistrationFeePaid(patientProfile.user_id);
}
```

### 3. Payment Repository

**File**: `src/repositories/payment.repository.ts`

#### Updated Interface

```typescript
export interface Payment {
  ...
  consultation_fee: number;
  registration_fee: number;
}
```

#### Updated createPayment()

```typescript
async createPayment(data: {
  ...
  consultationFee?: number;
  registrationFee?: number;
}): Promise<Payment>
```

---

## 🔄 Payment Flow

### Website Booking Flow

1. **Patient books appointment** → `POST /api/booking/create`
2. **Patient initiates payment** → `POST /api/payment/create-order`
   - Backend checks: `hasPatientPaidRegistrationFee(userId)`
   - If FALSE: Add ₹100 to amount
   - If TRUE: No registration fee
3. **Razorpay order created** with total amount
4. **Patient completes payment** on Razorpay
5. **Payment verified** → `POST /api/payment/verify`
   - If registration fee was included: Mark patient as paid
   - Update appointment status to CONFIRMED
6. **Future bookings**: Patient only pays consultation fee

### Admin Panel Booking Flow

1. **Staff books appointment for patient** → `POST /api/booking/front-desk`
2. **Staff sends payment link** → `POST /api/payment/send-link`
   - Backend checks: `hasPatientPaidRegistrationFee(patientUserId)`
   - If FALSE: Add ₹100 to amount
   - If TRUE: No registration fee
3. **Payment link sent via WhatsApp** with total amount
4. **Patient pays via link**
5. **Webhook received** → `POST /api/payment/webhook`
   - If registration fee was included: Mark patient as paid
   - Update appointment status to CONFIRMED
6. **Future bookings**: Patient only pays consultation fee

---

## 📱 Frontend Impact

### Website (mibo_version-2)

#### Payment Screen

**File**: Likely `src/pages/Payment.tsx` or similar

**Expected Behavior:**

- API response includes `registrationFee` and `consultationFee`
- Display breakdown:
  ```
  Consultation Fee: ₹2500
  Registration Fee: ₹100  (only for new patients)
  ─────────────────────
  Total: ₹2600
  ```

**No Changes Needed If:**

- Frontend already displays `amount` from API response
- Frontend doesn't need to show fee breakdown

**Changes Needed If:**

- You want to show separate line items for consultation and registration fees
- Add fields to display: `consultationFee` and `registrationFee` from API response

#### API Response Example

```json
{
  "orderId": "order_xyz",
  "amount": 260000,  // in paise
  "consultationFee": 2500,
  "registrationFee": 100,
  "appointment": { ... }
}
```

### Admin Panel (mibo-admin)

#### Payment Link Screen

**Expected Behavior:**

- When staff sends payment link, amount automatically includes registration fee for new patients
- Staff sees total amount in response

**No Changes Needed:**

- Admin panel just sends payment link
- Backend handles registration fee calculation
- Patient sees correct amount in payment link

---

## ✅ Backward Compatibility

### Existing Patients

- ✅ All 11 existing patients with successful payments marked as `registration_fee_paid = TRUE`
- ✅ They will NOT be charged registration fee on future bookings
- ✅ No impact on their existing payment history

### Existing Appointments

- ✅ Existing payment records have `registration_fee = 0` and `consultation_fee = 0` (defaults)
- ✅ No data loss or corruption
- ✅ Historical data preserved

### API Responses

- ✅ New fields added to payment responses (`consultationFee`, `registrationFee`)
- ✅ Existing fields unchanged
- ✅ Frontend can ignore new fields if not needed

---

## 🧪 Testing

### Test Scenarios

#### 1. New Patient - Website Booking

```bash
# Create new patient account
POST /api/patient-auth/send-otp
POST /api/patient-auth/verify-otp

# Book appointment
POST /api/booking/create

# Create payment order
POST /api/payment/create-order

# Expected: amount = consultation_fee + 100
# Expected: registrationFee = 100
```

#### 2. Existing Patient - Website Booking

```bash
# Login as existing patient (who has paid before)
POST /api/patient-auth/verify-otp

# Book appointment
POST /api/booking/create

# Create payment order
POST /api/payment/create-order

# Expected: amount = consultation_fee
# Expected: registrationFee = 0
```

#### 3. New Patient - Admin Panel Booking

```bash
# Staff books for new patient
POST /api/booking/front-desk
{
  "patientPhone": "9999999999",  // new number
  "patientName": "New Patient",
  ...
}

# Staff sends payment link
POST /api/payment/send-link

# Expected: amount = consultation_fee + 100
```

#### 4. Existing Patient - Admin Panel Booking

```bash
# Staff books for existing patient
POST /api/booking/front-desk
{
  "patientPhone": "9876543210",  // existing patient
  ...
}

# Staff sends payment link
POST /api/payment/send-link

# Expected: amount = consultation_fee (no registration fee)
```

#### 5. Payment Verification

```bash
# After patient pays
POST /api/payment/verify

# Check patient profile
SELECT registration_fee_paid, registration_fee_paid_at
FROM patient_profiles
WHERE user_id = X;

# Expected: registration_fee_paid = TRUE
# Expected: registration_fee_paid_at = NOW()
```

### Database Queries for Testing

```sql
-- Check registration fee status for all patients
SELECT
  pp.user_id,
  u.full_name,
  u.phone,
  pp.registration_fee_paid,
  pp.registration_fee_paid_at,
  COUNT(a.id) as total_appointments,
  COUNT(CASE WHEN p.status = 'SUCCESS' THEN 1 END) as successful_payments
FROM patient_profiles pp
JOIN users u ON pp.user_id = u.id
LEFT JOIN appointments a ON a.patient_id = pp.id
LEFT JOIN payments p ON p.appointment_id = a.id
GROUP BY pp.user_id, u.full_name, u.phone, pp.registration_fee_paid, pp.registration_fee_paid_at
ORDER BY pp.user_id;

-- Check payment breakdown
SELECT
  p.id,
  p.appointment_id,
  p.amount as total_amount,
  p.consultation_fee,
  p.registration_fee,
  p.status,
  p.paid_at
FROM payments p
ORDER BY p.created_at DESC
LIMIT 10;

-- Verify registration fee logic
SELECT
  u.full_name,
  u.phone,
  pp.registration_fee_paid,
  p.amount,
  p.consultation_fee,
  p.registration_fee,
  p.status
FROM payments p
JOIN appointments a ON p.appointment_id = a.id
JOIN patient_profiles pp ON a.patient_id = pp.id
JOIN users u ON pp.user_id = u.id
WHERE p.created_at > NOW() - INTERVAL '1 day'
ORDER BY p.created_at DESC;
```

---

## 🚀 Deployment

### Production Deployment Steps

#### 1. Backup Database

```bash
pg_dump -h your-rds-endpoint -U username -d database > backup_before_registration_fee.sql
```

#### 2. Run Migration

```sql
-- In pgAdmin4 or psql
\i migrations/add_registration_fee_tracking.sql
```

#### 3. Verify Migration

```sql
-- Check columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'patient_profiles'
AND column_name IN ('registration_fee_paid', 'registration_fee_paid_at');

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'payments'
AND column_name IN ('registration_fee', 'consultation_fee');

-- Check existing patients marked as paid
SELECT
  COUNT(*) as total_patients,
  COUNT(CASE WHEN registration_fee_paid = TRUE THEN 1 END) as patients_paid,
  COUNT(CASE WHEN registration_fee_paid = FALSE THEN 1 END) as patients_not_paid
FROM patient_profiles;
```

#### 4. Deploy Backend

```bash
cd backend
npm run build
# Deploy to AWS
# Restart backend server
```

#### 5. Test

- Create test booking as new patient
- Verify amount includes ₹100 registration fee
- Complete payment
- Verify patient marked as paid
- Create second booking
- Verify amount does NOT include registration fee

---

## 📝 Configuration

### Registration Fee Amount

Currently hardcoded as ₹100 in:

- `src/services/payment.service.ts` (line ~50, ~250)

**To Change:**

1. Update both occurrences of `100` to new amount
2. Or create environment variable: `REGISTRATION_FEE=100`

### Disable Registration Fee

Set registration fee to `0`:

```typescript
const registrationFee = 0; // Disable registration fee
```

---

## 🔍 Monitoring

### Logs to Watch

```
💰 Payment calculation for appointment X: Consultation Fee: ₹2500, Registration Fee: ₹100, Total: ₹2600
✅ Registration fee marked as paid for user X
```

### Metrics to Track

- Number of new patients paying registration fee
- Total registration fee collected
- Average time between registration and second booking

### Queries for Analytics

```sql
-- Registration fee revenue
SELECT
  DATE(paid_at) as date,
  COUNT(*) as new_patients,
  SUM(registration_fee) as registration_revenue,
  SUM(consultation_fee) as consultation_revenue,
  SUM(amount) as total_revenue
FROM payments
WHERE status = 'SUCCESS'
AND registration_fee > 0
GROUP BY DATE(paid_at)
ORDER BY date DESC;

-- New vs returning patients
SELECT
  DATE(p.paid_at) as date,
  COUNT(CASE WHEN p.registration_fee > 0 THEN 1 END) as new_patients,
  COUNT(CASE WHEN p.registration_fee = 0 THEN 1 END) as returning_patients
FROM payments p
WHERE p.status = 'SUCCESS'
GROUP BY DATE(p.paid_at)
ORDER BY date DESC;
```

---

## ⚠️ Important Notes

### 1. Registration Fee is Per Patient, Not Per Appointment

- Patient pays once, ever
- Even if they book multiple appointments on same day
- Even if they cancel and rebook

### 2. Registration Fee Applies to Both Booking Methods

- Website booking (patient self-service)
- Admin panel booking (staff-assisted)

### 3. Existing Patients Protected

- Migration automatically marks existing patients as paid
- They will never be charged registration fee

### 4. Payment Link Expiry

- Payment links expire after configured time (default: 24 hours)
- If patient doesn't pay, they can request new link
- New link will still include registration fee if not paid

### 5. Refunds

- If appointment is cancelled and refunded
- Registration fee status remains (patient still marked as paid)
- Patient won't be charged registration fee again on next booking

---

## 🐛 Troubleshooting

### Issue: Patient charged registration fee twice

**Cause**: `registration_fee_paid` not updated after first payment
**Solution**: Check webhook processing and `markRegistrationFeePaid()` calls

### Issue: Existing patient charged registration fee

**Cause**: Migration didn't mark them as paid
**Solution**: Manually update:

```sql
UPDATE patient_profiles
SET registration_fee_paid = TRUE,
    registration_fee_paid_at = NOW()
WHERE user_id = X;
```

### Issue: Amount mismatch in Razorpay

**Cause**: Frontend sending wrong amount
**Solution**: Frontend should use `amount` from `createPaymentOrder` response

---

## ✨ Future Enhancements

1. **Configurable Registration Fee**
   - Add to admin panel settings
   - Allow changing amount without code changes

2. **Registration Fee Waivers**
   - Add ability to waive fee for specific patients
   - Corporate/insurance patients

3. **Promotional Offers**
   - Waive registration fee during promotions
   - First 100 patients free, etc.

4. **Registration Fee Breakdown in Receipts**
   - Show separate line items in email receipts
   - Show in appointment history

5. **Analytics Dashboard**
   - Track registration fee revenue
   - New patient acquisition metrics

---

## 📞 Support

### If Issues Arise

1. Check backend logs for payment calculation
2. Verify database migration completed
3. Check patient's `registration_fee_paid` status
4. Verify payment record has correct `registration_fee` and `consultation_fee`

### Rollback Plan

```sql
-- Remove registration fee tracking
ALTER TABLE patient_profiles DROP COLUMN registration_fee_paid;
ALTER TABLE patient_profiles DROP COLUMN registration_fee_paid_at;
ALTER TABLE payments DROP COLUMN registration_fee;
ALTER TABLE payments DROP COLUMN consultation_fee;

-- Revert backend code
git revert <commit-hash>
```

---

**Implementation Date**: 2024-05-09
**Status**: ✅ Complete and Ready for Testing
**Backend**: Running with changes
**Migration**: Applied to local database
**Production**: Ready for deployment
