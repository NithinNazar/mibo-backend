# Direct Payment Implementation (Cash/Card/UPI)

## Overview

Added parallel payment flow to accept direct payments (CASH, CARD, UPI) at front desk while preserving the existing Razorpay payment link flow.

## Database Changes

### Migration: `add_payment_method_to_payments.sql`

- Added `payment_method` column to `payments` table
- Possible values: `ONLINE` (Razorpay), `CASH`, `CARD`, `UPI`
- Default: `ONLINE` for backward compatibility
- All existing payments are marked as `ONLINE`

**Run migration:**

```sql
-- Execute this SQL file in your production database
\i migrations/add_payment_method_to_payments.sql
```

## Backend Changes

### 1. Payment Repository (`src/repositories/payment.repository.ts`)

**New Method:** `createDirectPayment()`

- Creates payment record with direct payment method
- Sets status to `SUCCESS` immediately
- Sets `paid_at` to current timestamp
- Uses `provider: 'DIRECT'` to distinguish from Razorpay payments

### 2. Appointment Service (`src/services/appointment.services.ts`)

**New Method:** `confirmDirectPayment(appointmentId, paymentMethod, authUser)`

- **Permission Check:** Only ADMIN, FRONT_DESK, CARE_COORDINATOR, MANAGER
- **Steps:**
  1. Validates appointment exists and is not already confirmed/cancelled
  2. Calculates consultation fee + registration fee (if applicable)
  3. Creates payment record with selected method
  4. Marks patient registration fee as paid (if applicable)
  5. Updates appointment status to `CONFIRMED`
  6. For ONLINE appointments: Creates Google Meet link and sends notifications
  7. For IN_PERSON appointments: Sends WhatsApp confirmation

### 3. Appointment Controller (`src/controllers/appointment.controller.ts`)

**New Endpoint:** `POST /api/appointments/:id/confirm-direct-payment`

- Body: `{ "paymentMethod": "CASH" | "CARD" | "UPI" }`
- Returns: `{ success, appointment, payment }`

### 4. Routes (`src/routes/appointment.routes.ts`)

```typescript
POST /api/appointments/:id/confirm-direct-payment
Roles: ADMIN, MANAGER, FRONT_DESK, CARE_COORDINATOR
```

## Admin Panel Changes

### 1. Appointment Service (`src/services/appointmentService.ts`)

**New Method:** `confirmDirectPayment(appointmentId, paymentMethod)`

- Calls backend endpoint to confirm payment

### 2. Book Appointment Page (`src/modules/appointments/pages/BookAppointmentPage.tsx`)

**UI Changes:**

- **Button 1:** "Confirm: Send Payment Link" (existing flow)
  - Creates appointment with status `BOOKED`
  - Generates Razorpay payment link
  - Sends link via WhatsApp to patient
  - Patient has 30 minutes to pay
  - On payment: Status → `CONFIRMED`, Meet link generated, notifications sent

- **Button 2:** "Confirm: Pay via Cash/Card/UPI" (new flow)
  - Opens modal with payment method selection
  - Three options: Cash, Card, UPI
  - On confirm:
    1. Creates appointment with status `BOOKED`
    2. Immediately confirms direct payment
    3. Status → `CONFIRMED`
    4. Meet link generated (for online appointments)
    5. WhatsApp confirmation sent
    6. Appointment logged in admin panel

**Modal Features:**

- Three radio buttons for payment method selection
- "Close" button to cancel
- "Confirm Payment" button to proceed
- Loading state during processing
- Toast notifications for success/error

## Payment Tracking for Statistics

### Existing Flow (Razorpay):

- Tracked in `payments` table with `payment_method='ONLINE'`
- Status: `CREATED` → `SUCCESS` (on payment) or `FAILED`
- Payment statistics query:

```sql
SELECT payment_method, COUNT(*), SUM(amount)
FROM payments
WHERE status = 'SUCCESS'
GROUP BY payment_method;
```

### New Flow (Direct Payments):

- Tracked in `payments` table with `payment_method='CASH'|'CARD'|'UPI'`
- Status: Always `SUCCESS` (confirmed immediately)
- Same statistics query works for all payment methods

### Statistics Compatibility:

- All existing payment reports will continue to work
- Can now filter/group by `payment_method` to see breakdown
- Example queries:

```sql
-- Total revenue by payment method
SELECT payment_method, SUM(amount) as revenue
FROM payments
WHERE status = 'SUCCESS'
GROUP BY payment_method;

-- Daily revenue with payment breakdown
SELECT
  DATE(paid_at) as date,
  payment_method,
  COUNT(*) as count,
  SUM(amount) as revenue
FROM payments
WHERE status = 'SUCCESS'
GROUP BY DATE(paid_at), payment_method
ORDER BY date DESC;
```

## User Flow Comparison

### Flow 1: Send Payment Link (Existing)

1. Admin selects centre, clinician, date/time, session type
2. Admin enters patient details
3. Admin clicks "Confirm: Send Payment Link"
4. System creates appointment with status `BOOKED`
5. Razorpay payment link generated and sent via WhatsApp
6. Patient receives WhatsApp with payment link
7. Patient pays within 30 minutes
8. On successful payment:
   - Appointment status → `CONFIRMED`
   - Google Meet link created (for online)
   - WhatsApp confirmation sent to patient
   - Appointment visible in admin panel

### Flow 2: Direct Payment (New)

1. Admin selects centre, clinician, date/time, session type
2. Admin enters patient details
3. Admin clicks "Confirm: Pay via Cash/Card/UPI"
4. Modal opens with payment method options
5. Patient pays cash/card/UPI directly to admin/front desk
6. Admin selects payment method and clicks "Confirm Payment"
7. System:
   - Creates appointment with status `BOOKED`
   - Immediately confirms payment
   - Appointment status → `CONFIRMED`
   - Google Meet link created (for online)
   - WhatsApp confirmation sent to patient
   - Appointment visible in admin panel
8. Done - No waiting for payment

## Testing Checklist

### Backend Testing

- [ ] Run migration on local database
- [ ] Test direct payment confirmation API endpoint
- [ ] Verify payment record is created with correct method
- [ ] Verify appointment status changes to CONFIRMED
- [ ] Verify Google Meet link is created for online appointments
- [ ] Verify WhatsApp notifications are sent
- [ ] Verify registration fee is marked as paid

### Frontend Testing (Admin Panel)

- [ ] Both buttons appear on Step 6
- [ ] "Send Payment Link" button works as before
- [ ] "Pay via Cash/Card/UPI" button opens modal
- [ ] Modal shows three payment options
- [ ] Can select each payment method
- [ ] "Close" button closes modal
- [ ] "Confirm Payment" processes booking
- [ ] Success toast appears on completion
- [ ] Form resets after successful booking
- [ ] Appointment appears in appointments list
- [ ] Appointment status is CONFIRMED

### Integration Testing

- [ ] Book with CASH payment - verify in database
- [ ] Book with CARD payment - verify in database
- [ ] Book with UPI payment - verify in database
- [ ] Verify payment statistics include direct payments
- [ ] Verify online appointment gets Meet link
- [ ] Verify in-person appointment gets confirmation
- [ ] Verify patient receives WhatsApp
- [ ] Compare with Razorpay booking - both work

## Deployment Steps

### 1. Backend Deployment

```bash
# Deploy backend first (ALWAYS)
cd backend
git add .
git commit -m "Add direct payment support (CASH/CARD/UPI)"
git push origin main

# Run migration on production database
psql -h <RDS_HOST> -U <DB_USER> -d <DB_NAME> -f migrations/add_payment_method_to_payments.sql
```

### 2. Admin Panel Deployment

```bash
# Deploy admin panel after backend
cd mibo-admin
npm run build
# Deploy dist folder
```

### 3. Verification

- [ ] Test both flows on production
- [ ] Check backend logs for errors
- [ ] Verify payments appear in database
- [ ] Verify WhatsApp messages are sent

## Rollback Plan

If issues occur:

1. **Frontend only:** Revert admin panel, backend remains compatible
2. **Backend only:** Database migration is backward compatible (default ONLINE)
3. **Full rollback:**
   - Revert frontend
   - Backend continues to work (new endpoint is additive)
   - Database keeps `payment_method` column (safe, defaults to ONLINE)

## Notes

- Current flow is PRESERVED and continues to work exactly as before
- New flow runs IN PARALLEL - no changes to existing behavior
- Both flows tracked identically for statistics
- Permission checks ensure only authorized staff can confirm direct payments
- All notifications (WhatsApp, Google Meet) work for both flows
