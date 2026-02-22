# Repository Update Summary

## Overview

Updated backend code to use existing database tables (`video_sessions` and `notifications`) instead of referencing non-existent tables (`appointment_video_links` and `notification_logs`).

---

## Changes Made

### 1. Video Repository (`src/repositories/video.repository.ts`)

#### Table Name Change

- **Old**: `appointment_video_links`
- **New**: `video_sessions`

#### Column Mapping Changes

| Old Column Name     | New Column Name      | Notes                                                                 |
| ------------------- | -------------------- | --------------------------------------------------------------------- |
| `meet_link`         | `join_url`           | Stores the meeting join URL                                           |
| `calendar_event_id` | `meeting_id`         | Stores the meeting ID (not calendar event)                            |
| N/A                 | `host_url`           | NEW - Stores host-specific URL                                        |
| N/A                 | `status`             | NEW - Tracks session status (scheduled, active, completed, cancelled) |
| N/A                 | `scheduled_start_at` | NEW - Session start time                                              |
| N/A                 | `scheduled_end_at`   | NEW - Session end time                                                |
| N/A                 | `updated_at`         | NEW - Last update timestamp                                           |

#### Interface Changes

**Before:**

```typescript
interface StoreMeetLinkData {
  appointment_id: number;
  meet_link: string;
  calendar_event_id?: string;
  provider: string;
}
```

**After:**

```typescript
interface StoreMeetLinkData {
  appointment_id: number;
  join_url: string;
  host_url?: string;
  meeting_id?: string;
  provider: string;
  status?: string;
  scheduled_start_at?: Date;
  scheduled_end_at?: Date;
}
```

#### Method Changes

1. **storeMeetLink()** - Updated to use new columns
2. **getMeetLinkByAppointment()** - Updated table name
3. **getMeetLinkByEventId()** → **getMeetLinkByMeetingId()** - Renamed and updated
4. **updateMeetLink()** - Updated parameters and columns
5. **deleteMeetLink()** - Updated table name
6. **updateVideoSessionStatus()** - NEW method to update session status
7. **getAllVideoLinks()** - Updated table name, aliases, and added status filter

---

### 2. Notification Repository (`src/repositories/notification.repository.ts`)

#### Table Name Change

- **Old**: `notification_logs`
- **New**: `notifications`

#### Column Mapping Changes

| Old Column Name       | New Column Name | Notes                                      |
| --------------------- | --------------- | ------------------------------------------ |
| `patient_id`          | `user_id`       | More generic - can be any user             |
| `recipient_phone`     | `phone`         | Simplified name                            |
| `message_content`     | `payload_data`  | Now stores JSON data                       |
| `appointment_id`      | Removed         | Not in new schema - stored in payload_data |
| `notification_type`   | Removed         | Not in new schema - stored in payload_data |
| `external_message_id` | Removed         | Not in new schema                          |
| N/A                   | `template_id`   | NEW - References notification template     |
| N/A                   | `error_message` | NEW - Stores error details                 |
| N/A                   | `sent_at`       | NEW - Timestamp when sent                  |
| N/A                   | `updated_at`    | NEW - Last update timestamp                |

#### Interface Changes

**Before:**

```typescript
interface CreateNotificationData {
  patient_id: number;
  appointment_id?: number;
  notification_type: string;
  channel: string;
  recipient_phone: string;
  message_content: string;
  status: string;
  external_message_id?: string;
}
```

**After:**

```typescript
interface CreateNotificationData {
  user_id: number;
  phone: string;
  channel: string;
  template_id?: number;
  payload_data?: any;
  status: string;
  error_message?: string;
}
```

#### Method Changes

1. **createNotificationLog()** - Updated to use new columns
2. **updateNotificationStatus()** - Changed `delivered_at` to `sent_at`, added `error_message`
3. **getNotificationHistory()** - Updated filter parameters and query
4. **getNotificationById()** - Updated table name
5. **getNotificationsByAppointment()** - REMOVED (appointment_id not in schema)
6. **getNotificationsByPatient()** → **getNotificationsByUser()** - Renamed
7. **getNotificationStats()** - Updated to use channel instead of notification_type
8. **getNotificationsByPhone()** - NEW method
9. **getNotificationsByTemplate()** - NEW method

---

### 3. Video Service (`src/services/video.service.ts`)

#### Changes Made

1. **storeMeetLink() calls** - Updated to pass new column names:
   - `meet_link` → `join_url` and `host_url`
   - Added `status: "scheduled"`
   - Added `scheduled_start_at` and `scheduled_end_at`

2. **updateMeetLink() calls** - Updated parameters:
   - Now passes `joinUrl`, `hostUrl`, `meetingId` instead of `meetLink`, `eventId`

3. **Return value handling** - Updated to use `join_url` instead of `meet_link`

4. **deleteMeetLink()** - Removed calendar event deletion logic (no longer have calendar_event_id)

---

### 4. Notification Service (`src/services/notification.service.ts`)

#### Changes Made

All `createNotificationLog()` calls updated to use new schema:

**Before:**

```typescript
await notificationRepository.createNotificationLog({
  patient_id: appointment.patient_id,
  appointment_id: appointmentId,
  notification_type: "APPOINTMENT_CONFIRMATION",
  channel: "WHATSAPP",
  recipient_phone: patient.user.phone,
  message_content: "...",
  status: result.success ? "SENT" : "FAILED",
  external_message_id: result.messageId,
});
```

**After:**

```typescript
await notificationRepository.createNotificationLog({
  user_id: appointment.patient_id,
  phone: patient.user.phone,
  channel: "WHATSAPP",
  payload_data: {
    appointment_id: appointmentId,
    notification_type: "APPOINTMENT_CONFIRMATION",
    message: "...",
    clinician_name: appointment.clinician_name,
    centre_name: appointment.centre_name,
  },
  status: result.success ? "SENT" : "FAILED",
  error_message: result.success ? undefined : result.error,
});
```

#### Key Changes:

- `patient_id` → `user_id`
- `recipient_phone` → `phone`
- `message_content` → moved to `payload_data.message`
- `appointment_id` → moved to `payload_data.appointment_id`
- `notification_type` → moved to `payload_data.notification_type`
- `external_message_id` → removed
- Added `error_message` field

---

## Why These Changes Were Made

### Problem

The backend code was referencing tables that don't exist in the database:

- Code expected: `appointment_video_links` and `notification_logs`
- Database has: `video_sessions` and `notifications`

This caused SQL errors whenever the code tried to:

- Store Google Meet links for online appointments
- Log notification delivery status
- Query notification history

### Solution

Updated the backend code to use the correct table names and column names that match the actual database schema.

### Benefits

1. ✅ **No SQL errors** - Code now uses tables that actually exist
2. ✅ **No database changes needed** - Works with existing schema
3. ✅ **Better data structure** - New schema uses JSONB for flexible payload storage
4. ✅ **More features** - New schema has status tracking, error messages, templates
5. ✅ **Future-proof** - Code now matches the actual database design

---

## Impact Analysis

### No Breaking Changes

- These repositories were NOT being used anywhere in the codebase yet
- No controllers or routes import these services
- Changes are purely internal to the repository and service layers

### When These Features Are Used

When video consultation or notification features are implemented:

- Google Meet links will be stored correctly in `video_sessions`
- Notifications will be logged correctly in `notifications`
- No additional changes needed - code is ready to use

---

## Testing

Created test script: `test-updated-repositories.js`

**Test Results:**

- ✅ video_sessions table exists with correct schema
- ✅ notifications table exists with correct schema
- ✅ Old tables do not exist (as expected)
- ✅ Repository code uses correct table and column names
- ✅ Service code uses correct column names
- ✅ TypeScript build succeeds with no errors

---

## Files Modified

1. `src/repositories/video.repository.ts` - Updated table and column names
2. `src/repositories/notification.repository.ts` - Updated table and column names
3. `src/services/video.service.ts` - Updated service calls to use new column names
4. `src/services/notification.service.ts` - Updated service calls to use new column names

---

## Migration Notes

### For Future Developers

If you need to use video consultation features:

- Import `videoService` from `src/services/video.service.ts`
- Call `generateGoogleMeetLink(appointmentId)` to create a Meet link
- Call `getMeetLinkForAppointment(appointmentId)` to retrieve a link

If you need to send notifications:

- Import `notificationService` from `src/services/notification.service.ts`
- Call appropriate methods like `sendAppointmentConfirmation(appointmentId)`
- Notification logs will be stored automatically in the `notifications` table

### Data Structure

**Video Sessions:**

- Stores both `join_url` (for participants) and `host_url` (for hosts)
- Tracks session status: scheduled, active, completed, cancelled
- Links to appointments via `appointment_id`

**Notifications:**

- Uses `payload_data` (JSONB) for flexible data storage
- Can store any notification-related data (appointment_id, notification_type, etc.)
- Supports template-based notifications via `template_id`
- Tracks errors via `error_message` field

---

## Conclusion

The backend code is now fully compatible with the existing database schema. No SQL errors will occur when video consultation or notification features are used.
