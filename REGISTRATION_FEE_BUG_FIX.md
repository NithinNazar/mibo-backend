# Registration Fee Bug Fix

## Issue Summary

**Problem**: All users (both new and existing patients) are being charged the one-time registration fee of ₹100, even if they have already paid it in previous bookings.

**Expected Behavior**:

- New patients (first booking): Pay consultation fee + ₹100 registration fee
- Existing patients (have previous successful payments): Pay only consultation fee

**Actual Behavior**:

- ALL patients are being charged registration fee on every booking

---

## Root Cause Analysis

### The Bug

The migration script `add_registration_fee_tracking.sql` had an incorrect JOIN condition in the UPDATE query:

**WRONG** (Line 40 & 48):

```sql
WHERE a.patient_id = pp.user_id
```

**CORRECT**:

```sql
WHERE a.patient_id = pp.id
```

### Why This Caused the Issue

- `appointments.patient_id` is a foreign key that references `patient_profiles.id` (the patient profile ID)
- The migration script was comparing it to `patient_profiles.user_id` (the user ID)
- These are different values, so the JOIN never matched any records
- Result: No existing patients were marked as having paid the registration fee
- Consequence: Everyone (including existing patients) gets charged ₹100 on every booking

---

## Files Fixed

### 1. Backend Migration Script

**File**: `migrations/add_registration_fee_tracking.sql`

- Fixed the UPDATE query to use correct JOIN condition
- Changed `a.patient_id = pp.user_id` to `a.patient_id = pp.id`

### 2. Frontend Payment Display

**File**: `mibo_version-2/src/pages/BookAppointment/Step3ConfirmBooking.tsx`

- Updated success screen to show payment breakup:
  - Consultation Fee: ₹X
  - Registration Fee: ₹100 (only for new users)
  - Total Amount Paid: ₹X

---

## Fix Scripts Created

### 1. Development/Testing Fix

**File**: `fix-registration-fee-bug.sql`

- Shows BEFORE/AFTER comparison
- Lists patients who should be marked as paid but aren't
- Applies the fix
- Verifies the results

### 2. Production Fix (Auto-commit)

**File**: `production-fix-registration-fee-autocommit.sql`

- Production-safe script with detailed logging
- Shows before/after statistics
- Lists all patients being updated
- Idempotent (safe to run multiple times)
- Auto-commits changes

---

## How to Apply the Fix

### Step 1: Run on Production Database

1. Open pgAdmin and connect to production database
2. Open `production-fix-registration-fee-autocommit.sql`
3. Execute the script
4. Review the output messages to verify:
   - Number of patients updated
   - Before/After statistics
   - Sample of updated patient records

### Step 2: Verify the Fix

After running the script, check:

```sql
-- Should show most patients with registration_fee_paid = TRUE
SELECT
  registration_fee_paid,
  COUNT(*) as count
FROM patient_profiles
GROUP BY registration_fee_paid;
```

### Step 3: Test Booking Flow

1. Test with an existing patient (should NOT see registration fee)
2. Test with a new patient (should see registration fee)

---

## Expected Results After Fix

### Database State

- Existing patients with successful payments: `registration_fee_paid = TRUE`
- New patients (no previous payments): `registration_fee_paid = FALSE`

### Frontend Behavior

**New Patient Booking**:

```
Consultation Fee:        ₹1,600
Registration Fee:        ₹100
------------------------
Total Amount:            ₹1,700
```

**Existing Patient Booking**:

```
Consultation Fee:        ₹1,600
------------------------
Total Amount:            ₹1,600
```

---

## Technical Details

### Database Schema

```sql
-- patient_profiles table
registration_fee_paid BOOLEAN DEFAULT FALSE NOT NULL
registration_fee_paid_at TIMESTAMP WITH TIME ZONE

-- payments table
registration_fee NUMERIC(10,2) DEFAULT 0 NOT NULL
consultation_fee NUMERIC(10,2) DEFAULT 0 NOT NULL
```

### Backend Logic Flow

1. User initiates booking
2. Frontend calls `GET /api/payments/registration-fee-status`
3. Backend checks `patient_profiles.registration_fee_paid` for user
4. Returns `hasPaidRegistrationFee: true/false`
5. Frontend displays appropriate fee breakdown
6. On payment success, backend marks `registration_fee_paid = TRUE`

### Key Functions

- `patientRepository.hasPatientPaidRegistrationFee(userId)` - Checks if user has paid
- `patientRepository.markRegistrationFeePaid(userId)` - Marks as paid after successful payment
- `paymentService.createPaymentOrder()` - Calculates total with/without registration fee
- `paymentService.verifyPayment()` - Marks registration fee as paid after verification

---

## Prevention for Future

### Code Review Checklist

- ✅ Verify foreign key relationships before writing JOIN queries
- ✅ Test migration scripts on development database first
- ✅ Check sample data before and after migration
- ✅ Verify business logic matches database schema

### Testing Checklist

- ✅ Test with new patient (no previous bookings)
- ✅ Test with existing patient (has previous successful payments)
- ✅ Verify payment breakup displays correctly
- ✅ Verify database flags are updated after payment

---

## Deployment Checklist

- [x] Fix migration script
- [x] Update frontend payment display
- [x] Create production fix script
- [ ] Run production fix script on database
- [ ] Verify existing patients are marked correctly
- [ ] Test booking flow with new patient
- [ ] Test booking flow with existing patient
- [ ] Monitor logs for any registration fee issues
- [ ] Verify no existing patients are charged registration fee

---

## Contact

If you encounter any issues after applying this fix, check:

1. Backend logs for payment calculation
2. Database `patient_profiles.registration_fee_paid` values
3. Frontend API call to `/api/payments/registration-fee-status`
