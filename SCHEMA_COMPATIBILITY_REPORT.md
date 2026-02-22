# Schema Compatibility Report

## Executive Summary

**Status:** ❌ **INCOMPATIBLE** - Tables exist but with different schemas

The backend code references tables that don't exist (`appointment_video_links` and `notification_logs`), but similar tables exist with **different column names and structures**.

---

## 1. Video Links Table Comparison

### Code Expects: `appointment_video_links`

**Columns from INSERT query:**

```sql
INSERT INTO appointment_video_links (
  appointment_id,
  meet_link,
  calendar_event_id,
  provider,
  created_at
)
```

### Database Has: `video_sessions`

**Actual columns:**

```sql
- id: bigint NOT NULL
- appointment_id: bigint NOT NULL
- provider: character varying(30) NOT NULL
- meeting_id: character varying(150) NULL
- join_url: text NULL
- host_url: text NULL
- status: character varying(20) NOT NULL
- scheduled_start_at: timestamp with time zone NULL
- scheduled_end_at: timestamp with time zone NULL
- created_at: timestamp with time zone NOT NULL
- updated_at: timestamp with time zone NOT NULL
```

### ❌ Compatibility Issues:

1. **Column name mismatch:**
   - Code expects: `meet_link`
   - Database has: `join_url` and `host_url`

2. **Missing columns in database:**
   - `calendar_event_id` - NOT in video_sessions

3. **Extra columns in database:**
   - `meeting_id`, `status`, `scheduled_start_at`, `scheduled_end_at`, `updated_at`

### 🔴 Impact:

- **INSERT queries will FAIL** - Column `meet_link` doesn't exist
- **SELECT queries will FAIL** - Column `calendar_event_id` doesn't exist
- Online appointments cannot store/retrieve Google Meet links properly

---

## 2. Notification Logs Table Comparison

### Code Expects: `notification_logs`

**Columns from INSERT query:**

```sql
INSERT INTO notification_logs (
  patient_id,
  appointment_id,
  notification_type,
  channel,
  recipient_phone,
  message_content,
  status,
  ...
)
```

### Database Has: `notifications`

**Actual columns:**

```sql
- id: bigint NOT NULL
- user_id: bigint NULL
- phone: character varying(20) NULL
- channel: character varying(20) NOT NULL
- template_id: bigint NULL
- payload_data: jsonb NULL
- status: character varying(20) NOT NULL
- error_message: text NULL
- sent_at: timestamp with time zone NULL
- created_at: timestamp with time zone NOT NULL
- updated_at: timestamp with time zone NOT NULL
```

### ❌ Compatibility Issues:

1. **Column name mismatches:**
   - Code expects: `patient_id` → Database has: `user_id`
   - Code expects: `recipient_phone` → Database has: `phone`
   - Code expects: `message_content` → Database has: `payload_data` (jsonb)

2. **Missing columns in database:**
   - `appointment_id` - NOT in notifications
   - `notification_type` - NOT in notifications
   - `message_content` - NOT in notifications

3. **Extra columns in database:**
   - `template_id`, `error_message`, `sent_at`, `updated_at`

### 🔴 Impact:

- **INSERT queries will FAIL** - Multiple column mismatches
- **SELECT queries will FAIL** - Missing expected columns
- Cannot track notification history properly
- Cannot debug notification delivery issues

---

## 3. Root Cause Analysis

### Why This Happened:

1. **Database schema was refactored** but code wasn't updated
2. **Table names were changed:**
   - `appointment_video_links` → `video_sessions`
   - `notification_logs` → `notifications`
3. **Column names were changed** during refactoring
4. **Schema structure was redesigned** (e.g., `message_content` → `payload_data` as jsonb)

---

## 4. Recommendations

### Option 1: Update Backend Code (RECOMMENDED)

**Pros:**

- No database changes needed
- Works with existing data
- Safer approach

**Changes needed:**

1. Update `video.repository.ts`:
   - Change table name: `appointment_video_links` → `video_sessions`
   - Change column: `meet_link` → `join_url`
   - Remove reference to: `calendar_event_id`

2. Update `notification.repository.ts`:
   - Change table name: `notification_logs` → `notifications`
   - Change column: `patient_id` → `user_id`
   - Change column: `recipient_phone` → `phone`
   - Change column: `message_content` → `payload_data`
   - Remove reference to: `appointment_id`, `notification_type`

### Option 2: Create Missing Tables

**Pros:**

- Code works as-is
- No code changes needed

**Cons:**

- Duplicate tables in database
- Data inconsistency risk
- More maintenance overhead

---

## 5. Immediate Action Required

### Critical Issues:

1. ❌ **Online appointments will fail** when trying to store Google Meet links
2. ❌ **Notification logging will fail** when trying to track sent notifications
3. ❌ **Error: relation "appointment_video_links" does not exist**
4. ❌ **Error: relation "notification_logs" does not exist**

### Workaround:

The code likely has try-catch blocks that prevent crashes, but functionality is broken:

- Google Meet links are generated but not stored
- Notifications are sent but not logged
- No audit trail for notifications

---

## 6. Conclusion

**The backend code is NOT compatible with the existing database tables.**

The tables exist but with completely different schemas. The code will throw SQL errors when trying to:

- Store Google Meet links for online appointments
- Log notification delivery status
- Query notification history

**Action:** Update the backend code to use the correct table names and column names that match the actual database schema.
