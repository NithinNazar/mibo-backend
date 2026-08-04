# Quick API Reference: Next Available Slot

## Endpoint

```
GET /api/booking/next-available-slot
```

## Parameters

- `clinicianId` (required) - The clinician ID
- `centreId` (optional) - Filter by specific centre

## Example Request

```javascript
const response = await fetch(
  `/api/booking/next-available-slot?clinicianId=${clinicianId}`,
);
const { data } = await response.json();
```

## Example Response

```json
{
  "success": true,
  "data": {
    "date": "2026-08-15",
    "day": "Saturday",
    "time": "10:30 AM",
    "fullText": "15 August, Saturday. 10:30 AM"
  }
}
```

## Quick Usage in React

```typescript
const [nextSlot, setNextSlot] = useState<string | null>(null);

useEffect(() => {
  fetch(`/api/booking/next-available-slot?clinicianId=${clinician.id}`)
    .then(res => res.json())
    .then(({ data }) => {
      if (data) {
        setNextSlot(data.fullText); // "15 August, Saturday. 10:30 AM"
      }
    });
}, [clinician.id]);

// Display
{nextSlot && (
  <div className="next-available">
    <span>Next Available: {nextSlot}</span>
  </div>
)}
```

## What You Get

The `fullText` field is ready to display directly on the clinician card:

- **Format**: "15 August, Saturday. 10:30 AM"
- **Date**: Day of month + Month name
- **Day**: Full day name
- **Time**: 12-hour format with AM/PM

## If No Slots Available

```json
{
  "success": true,
  "data": null,
  "message": "No available slots found in the next 30 days"
}
```

## Notes

- ✅ Public endpoint (no auth needed)
- ✅ Returns next available slot within 30 days
- ✅ Formatted text ready for display
- ✅ Handles multiple centres automatically
