# Database Migration Checklist for AWS

This document lists all migrations needed to run the features built in this project.

## Migration Status

Run these migrations in order on your AWS database:

### ✅ Core Feature Migrations (Run in Order)

#### 1. Slot Blocking Feature

- **File**: `migrations/001_create_blocked_slots_table.sql`
- **Purpose**: Creates `blocked_slots` table for slot blocking functionality
- **Features Enabled**: Admin can block appointment slots when clinicians are unavailable
- **Dependencies**: Requires `clinician_profiles`, `centres`, and `users` tables

#### 2. Patient Notifications

- **File**: `migrations/002_create_patient_notifications_table.sql`
- **Purpose**: Creates `patient_notifications` table for patient dashboard notifications
- **Features Enabled**: Patients receive notifications about appointment changes
- **Dependencies**: Requires `patient_profiles`, `appointments`, and `blocked_slots` tables

#### 3. Slot Blocking Audit Trail

- **File**: `migrations/003_create_slot_blocking_audit_table.sql`
- **Purpose**: Creates `slot_blocking_audit` table for audit trail
- **Features Enabled**: Tracks all slot blocking/unblocking actions for accountability
- **Dependencies**: Requires `blocked_slots` and `users` tables

#### 4. Appointments Table Extensions

- **File**: `migrations/004_extend_appointments_table.sql`
- **Purpose**: Adds refund tracking and admin cancellation support
- **Features Enabled**:
  - Admin can cancel appointments with refund tracking
  - New appointment status: `CANCELLED_BY_ADMIN`
  - Links appointments to blocked slots
- **Dependencies**: Requires `appointments` and `blocked_slots` tables

#### 5. Appointment Notes & Google Meet

- **File**: `migrations/005_add_notes_and_google_meet_to_appointments.sql`
- **Purpose**: Adds notes and Google Meet integration to appointments
- **Features Enabled**:
  - Clinicians can add notes to appointments
  - Google Meet links for online appointments
  - Google Calendar event tracking
- **Dependencies**: Requires `appointments` table

#### 6. Clinician Profile Enhancements

- **File**: `migrations/add_clinician_fields.sql`
- **Purpose**: Adds qualification, expertise, and languages fields
- **Features Enabled**: Enhanced clinician profiles with detailed information
- **Dependencies**: Requires `clinician_profiles` table

#### 7. Payment Link Support

- **File**: `migrations/add_payment_link_columns.sql`
- **Purpose**: Adds payment link columns to payments table
- **Features Enabled**: Razorpay payment link functionality
- **Dependencies**: Requires `payments` table

#### 8. Clinician Dynamic Management (IMPORTANT)

- **File**: `migrations/update_clinician_profiles_for_dynamic_management.sql`
- **Purpose**:
  - Converts `specialization` and `qualification` from VARCHAR to JSONB arrays
  - Creates `clinician_availability_rules` table
  - Adds `profile_picture_url` column
- **Features Enabled**:
  - Dynamic clinician management from admin panel
  - Multiple specializations and qualifications per clinician
  - Availability schedule management
- **Dependencies**: Requires `clinician_profiles` and `centres` tables
- **⚠️ WARNING**: This migration modifies existing columns. Backup your data first!

#### 9. Fix Clinician Array Data (Run AFTER #8)

- **File**: `migrations/fix_clinician_array_data.sql`
- **Purpose**: Ensures all clinician data is in proper array format
- **Features Enabled**: Data consistency for clinician profiles
- **Dependencies**: Must run AFTER `update_clinician_profiles_for_dynamic_management.sql`

---

## Migration Execution Order

Run these SQL files in this exact order:

```bash
# 1. Slot Blocking Feature
psql -h <aws-host> -U <username> -d <database> -f migrations/001_create_blocked_slots_table.sql

# 2. Patient Notifications
psql -h <aws-host> -U <username> -d <database> -f migrations/002_create_patient_notifications_table.sql

# 3. Slot Blocking Audit
psql -h <aws-host> -U <username> -d <database> -f migrations/003_create_slot_blocking_audit_table.sql

# 4. Appointments Extensions
psql -h <aws-host> -U <username> -d <database> -f migrations/004_extend_appointments_table.sql

# 5. Notes & Google Meet
psql -h <aws-host> -U <username> -d <database> -f migrations/005_add_notes_and_google_meet_to_appointments.sql

# 6. Clinician Fields
psql -h <aws-host> -U <username> -d <database> -f migrations/add_clinician_fields.sql

# 7. Payment Links
psql -h <aws-host> -U <username> -d <database> -f migrations/add_payment_link_columns.sql

# 8. Dynamic Clinician Management (BACKUP FIRST!)
psql -h <aws-host> -U <username> -d <database> -f migrations/update_clinician_profiles_for_dynamic_management.sql

# 9. Fix Array Data
psql -h <aws-host> -U <username> -d <database> -f migrations/fix_clinician_array_data.sql
```

---

## Features Enabled by These Migrations

### 1. Slot Blocking & Patient Notifications

- Admins can block appointment slots when clinicians are unavailable
- Patients receive notifications about blocked appointments
- Automatic appointment cancellation and refund tracking
- Complete audit trail of all blocking actions

### 2. Clinician Dashboard

- Clinicians can view their appointments
- Add notes to appointments
- Google Meet links for online appointments

### 3. Dynamic Clinician Management

- Admin can create/edit clinicians from admin panel
- Multiple specializations per clinician
- Multiple qualifications per clinician
- Expertise areas and languages
- Profile pictures
- Availability schedule management

### 4. Payment Links

- Send Razorpay payment links via WhatsApp
- Track payment link status

---

## Pre-Migration Checklist

Before running migrations on AWS:

- [ ] **Backup your database** (especially before migration #8)
- [ ] Verify you have the correct database credentials
- [ ] Test migrations on a staging/development database first
- [ ] Check that all referenced tables exist (users, clinician_profiles, centres, etc.)
- [ ] Ensure you have sufficient database permissions (CREATE TABLE, ALTER TABLE, etc.)

---

## Post-Migration Verification

After running all migrations, verify:

```sql
-- Check all new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'blocked_slots',
  'patient_notifications',
  'slot_blocking_audit',
  'clinician_availability_rules'
);

-- Check appointments table has new columns
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'appointments'
AND column_name IN (
  'notes',
  'google_meet_link',
  'google_calendar_event_id',
  'refund_eligible',
  'refund_status',
  'blocked_slot_id'
);

-- Check clinician_profiles has JSONB columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'clinician_profiles'
AND column_name IN (
  'specialization',
  'qualification',
  'expertise',
  'languages',
  'profile_picture_url'
);

-- Check payments table has payment link columns
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'payments'
AND column_name IN (
  'payment_link_id',
  'payment_link_url',
  'payment_link_sent_at'
);
```

---

## Rollback Information

If you need to rollback migration #5 (notes and Google Meet):

- **File**: `migrations/005_rollback_notes_and_google_meet.sql`

For other migrations, you'll need to manually drop tables/columns if needed.

---

## Notes

1. **Migration #8 is critical** - It changes the data type of existing columns. Make sure to backup before running.
2. **Migration #9 must run after #8** - It fixes data format issues that may occur during the conversion.
3. All migrations use `IF NOT EXISTS` or `ADD COLUMN IF NOT EXISTS` to be idempotent (safe to run multiple times).
4. Indexes are created for performance optimization on frequently queried columns.

---

## Support

If you encounter any issues during migration:

1. Check the PostgreSQL error logs
2. Verify all prerequisite tables exist
3. Ensure you have the correct permissions
4. Test on a development database first
