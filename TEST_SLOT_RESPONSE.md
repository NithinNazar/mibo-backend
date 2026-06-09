# Test Slot Response Format

## API Endpoint

```
GET /api/clinicians/:clinicianId/slots?date=YYYY-MM-DD&centreId=1
```

## Expected Response Structure (After Fix)

### Before Fix (Blocked slots excluded):

```json
{
  "success": true,
  "data": [
    {
      "clinicianId": "71",
      "centreId": "1",
      "date": "2026-06-10",
      "startTime": "09:00",
      "endTime": "09:30",
      "status": "available",
      "mode": "ONLINE"
    },
    {
      "clinicianId": "71",
      "centreId": "1",
      "date": "2026-06-10",
      "startTime": "10:00",
      "endTime": "10:30",
      "status": "booked",
      "appointmentId": "123",
      "mode": "ONLINE"
    }
    // NOTE: Blocked slot at 09:30 is MISSING!
  ]
}
```

### After Fix (Blocked slots included):

```json
{
  "success": true,
  "data": [
    {
      "clinicianId": "71",
      "centreId": "1",
      "date": "2026-06-10",
      "startTime": "09:00",
      "endTime": "09:30",
      "status": "available",
      "mode": "ONLINE"
    },
    {
      "clinicianId": "71",
      "centreId": "1",
      "date": "2026-06-10",
      "startTime": "09:30",
      "endTime": "10:00",
      "status": "blocked", // ✅ NEW: Blocked status
      "blockedSlotId": 42, // ✅ NEW: ID for unblocking
      "mode": "ONLINE"
    },
    {
      "clinicianId": "71",
      "centreId": "1",
      "date": "2026-06-10",
      "startTime": "10:00",
      "endTime": "10:30",
      "status": "booked",
      "appointmentId": "123",
      "mode": "ONLINE"
    }
  ]
}
```

## Testing Checklist

### 1. Backend Running

- [ ] Backend server started: `npm run dev` in backend directory
- [ ] Server running on port 5000
- [ ] Database connected

### 2. Create Blocked Slot

```sql
-- Insert a test blocked slot
INSERT INTO blocked_slots (
  clinician_id,
  centre_id,
  blocked_date,
  start_time,
  end_time,
  reason,
  blocked_by_admin_id,
  is_blocked
) VALUES (
  71,  -- Replace with actual clinician ID
  1,   -- Replace with actual centre ID
  '2026-06-10',
  '09:30:00',
  '10:00:00',
  'Test blocked slot',
  1,   -- Replace with actual admin user ID
  TRUE
) RETURNING id;
```

### 3. Call API

```bash
# Using curl
curl -X GET "http://localhost:5000/api/clinicians/71/slots?date=2026-06-10&centreId=1"

# Or use Postman, Thunder Client, etc.
```

### 4. Verify Response

- [ ] Response includes blocked slot
- [ ] `status` field is "blocked"
- [ ] `blockedSlotId` field present with ID from database
- [ ] All other slots still present (available, booked)

### 5. Test Unblock

```bash
# Block a slot first via admin UI or API
POST http://localhost:5000/api/admin/slots/block
Authorization: Bearer <admin_token>
Body: {
  "clinician_id": 71,
  "centre_id": 1,
  "date": "2026-06-10",
  "start_time": "09:30",
  "end_time": "10:00"
}

# Then unblock it
POST http://localhost:5000/api/admin/slots/unblock/42
Authorization: Bearer <admin_token>
Body: {}

# Verify in database
SELECT * FROM blocked_slots WHERE id = 42;
-- Should show is_blocked = FALSE
```

### 6. Test Admin UI

- [ ] Login as admin
- [ ] Go to Slot Management → Block by Clinician
- [ ] Select clinician and date
- [ ] See blocked slots with orange "Blocked" badge
- [ ] Click "Unblock" button
- [ ] Slot changes to green "Available"
- [ ] Can book the slot again

## Success Criteria

✅ All slots (available, booked, blocked) returned in API response
✅ Blocked slots have `status: "blocked"`
✅ Blocked slots have `blockedSlotId` field
✅ Unblock API updates database correctly
✅ Admin UI shows block/unblock buttons correctly
✅ No breaking changes to existing functionality
