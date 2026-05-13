# Registration Fee Feature - Quick Summary

## ✅ What Was Implemented

### Feature

- **One-time registration fee of ₹100** for new patients
- **New patients** pay: Consultation Fee + ₹100
- **Existing patients** pay: Consultation Fee only
- Applies to both website booking and admin panel booking

### Example

- Clinician fee: ₹2500
- **New patient** pays: ₹2500 + ₹100 = **₹2600**
- **Existing patient** pays: **₹2500**

---

## 📊 Database Changes

### Migration File

`migrations/add_registration_fee_tracking.sql`

### Tables Modified

1. **patient_profiles**
   - Added: `registration_fee_paid` (BOOLEAN)
   - Added: `registration_fee_paid_at` (TIMESTAMP)

2. **payments**
   - Added: `registration_fee` (NUMERIC)
   - Added: `consultation_fee` (NUMERIC)

### Existing Data

- ✅ All 11 existing patients marked as `registration_fee_paid = TRUE`
- ✅ They will NOT be charged registration fee again

---

## 🔧 Backend Changes

### Files Modified

1. `src/repositories/patient.repository.ts`
   - Added: `hasPatientPaidRegistrationFee()`
   - Added: `markRegistrationFeePaid()`

2. `src/services/payment.service.ts`
   - Updated: `createPaymentOrder()` - adds ₹100 for new patients
   - Updated: `verifyPayment()` - marks patient as paid after successful payment
   - Updated: `sendPaymentLink()` - adds ₹100 for new patients (admin panel)
   - Updated: `handleWebhook()` - marks patient as paid via webhook

3. `src/repositories/payment.repository.ts`
   - Updated: `createPayment()` - stores consultation_fee and registration_fee separately
   - Updated: `Payment` interface - added new fields

---

## 🔄 How It Works

### Website Booking

1. Patient books appointment
2. Patient clicks "Pay Now"
3. **Backend checks**: Has patient paid registration fee before?
   - **NO** → Amount = Consultation Fee + ₹100
   - **YES** → Amount = Consultation Fee only
4. Patient completes payment
5. **Backend marks**: Patient as having paid registration fee
6. **Next booking**: Patient only pays consultation fee

### Admin Panel Booking

1. Staff books appointment for patient
2. Staff sends payment link
3. **Backend checks**: Has patient paid registration fee before?
   - **NO** → Amount = Consultation Fee + ₹100
   - **YES** → Amount = Consultation Fee only
4. Patient pays via link
5. **Backend marks**: Patient as having paid registration fee
6. **Next booking**: Patient only pays consultation fee

---

## 📱 Frontend Impact

### Website (mibo_version-2)

**No changes required** if:

- Frontend displays `amount` from API response
- Frontend doesn't need fee breakdown

**Optional changes**:

- Display separate line items for consultation and registration fees
- API response now includes: `consultationFee` and `registrationFee`

### Admin Panel (mibo-admin)

**No changes required**:

- Backend automatically calculates total amount
- Staff just sends payment link
- Patient sees correct amount

---

## ✅ Testing Checklist

### Local Testing (Already Done)

- [x] Database migration applied
- [x] Backend compiled successfully
- [x] Backend server running
- [x] Existing patients marked as paid

### Production Testing (To Do)

- [ ] Run migration on production database
- [ ] Deploy backend
- [ ] Test new patient booking (should pay ₹100 extra)
- [ ] Test existing patient booking (should NOT pay ₹100 extra)
- [ ] Verify patient marked as paid after first payment
- [ ] Test second booking by same patient (should NOT pay ₹100 extra)

---

## 🚀 Production Deployment

### Step 1: Backup Database

```bash
pg_dump > backup_before_registration_fee.sql
```

### Step 2: Run Migration

In pgAdmin4:

1. Open Query Tool
2. Open file: `migrations/add_registration_fee_tracking.sql`
3. Execute (F5)
4. Verify success

### Step 3: Deploy Backend

```bash
cd backend
npm run build
# Deploy to AWS
# Restart server
```

### Step 4: Test

1. Create test booking as new patient
2. Verify amount = consultation fee + ₹100
3. Complete payment
4. Create second booking
5. Verify amount = consultation fee only

---

## 📝 Key Points

### ✅ Backward Compatible

- Existing patients protected
- No impact on existing appointments
- No breaking changes to API

### ✅ Automatic

- Backend handles all logic
- No manual intervention needed
- Works for both booking methods

### ✅ One-Time Only

- Patient pays once, ever
- Even if they cancel and rebook
- Even if they book multiple appointments

### ✅ Transparent

- Payment breakdown stored in database
- Can generate reports on registration fee revenue
- Audit trail maintained

---

## 🔍 Monitoring

### Check Registration Fee Status

```sql
SELECT
  u.full_name,
  u.phone,
  pp.registration_fee_paid,
  pp.registration_fee_paid_at
FROM patient_profiles pp
JOIN users u ON pp.user_id = u.id
ORDER BY pp.registration_fee_paid_at DESC NULLS LAST;
```

### Check Recent Payments

```sql
SELECT
  p.id,
  p.amount as total,
  p.consultation_fee,
  p.registration_fee,
  p.status,
  p.paid_at
FROM payments p
ORDER BY p.created_at DESC
LIMIT 10;
```

---

## 📞 Support

### Common Issues

**Q: Existing patient charged ₹100**
A: Check `registration_fee_paid` status. Should be TRUE for existing patients.

**Q: New patient not charged ₹100**
A: Check backend logs. Should see "Registration Fee: ₹100" in payment calculation.

**Q: Patient charged ₹100 twice**
A: Check `registration_fee_paid_at`. Should be set after first payment.

---

## 📄 Documentation

- **Full Documentation**: `REGISTRATION_FEE_FEATURE.md`
- **Migration File**: `migrations/add_registration_fee_tracking.sql`
- **This Summary**: `REGISTRATION_FEE_SUMMARY.md`

---

**Status**: ✅ Ready for Production Deployment
**Backend**: Running with changes
**Migration**: Applied to local database
**Next Step**: Deploy to production
