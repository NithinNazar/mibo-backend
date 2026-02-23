# Phone Number Formatting Fix for Gallabox

## Problem

The system had inconsistent phone number storage:

- Some users stored with 10 digits: `9048810697`
- Some users stored with 12 digits: `919048810697`

Gallabox (WhatsApp API) requires phone numbers in international format with country code (e.g., `919876543210`), but the code was only stripping special characters without ensuring the country code was present.

This caused WhatsApp messages to fail for users with 10-digit phone numbers.

## Solution

Added a private helper method `formatPhoneNumber()` in the `GallaboxUtil` class that:

1. Removes all non-digit characters (+, spaces, dashes, etc.)
2. Automatically adds country code `91` if the phone number is 10 digits
3. Keeps the number as-is if it's already 12 digits starting with `91`
4. Handles edge cases like `+91` format (13 characters)

## Changes Made

**File Modified:** `backend/src/utils/gallabox.ts`

### Added Helper Method:

```typescript
private formatPhoneNumber(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, "");

  if (cleanPhone.length === 10) {
    return `91${cleanPhone}`;
  } else if (cleanPhone.length === 12 && cleanPhone.startsWith("91")) {
    return cleanPhone;
  } else if (cleanPhone.length === 13 && cleanPhone.startsWith("91")) {
    return cleanPhone.substring(1);
  }

  return cleanPhone;
}
```

### Updated All Phone Formatting Calls:

Replaced all instances of:

```typescript
const formattedPhone = phone.replace(/[+\s-]/g, "");
```

With:

```typescript
const formattedPhone = this.formatPhoneNumber(phone);
```

This was updated in 5 methods:

1. `sendOTP()`
2. `sendWhatsAppMessage()`
3. `sendTemplateMessage()`
4. `sendAppointmentConfirmation()`
5. `sendOnlineConsultationConfirmation()`

## Testing

Created comprehensive test cases covering:

- ✅ 10 digits without country code → adds `91`
- ✅ 12 digits with country code → keeps as-is
- ✅ 13 characters with `+91` → formats correctly
- ✅ Phone numbers with spaces and dashes → handles correctly

All 8 test cases passed successfully.

## Impact

### Before Fix:

- Users with 10-digit phone numbers: ❌ WhatsApp messages FAIL
- Users with 12-digit phone numbers: ✅ WhatsApp messages work

### After Fix:

- Users with 10-digit phone numbers: ✅ WhatsApp messages work (country code added automatically)
- Users with 12-digit phone numbers: ✅ WhatsApp messages work (no change)
- Users with any format (+91, spaces, dashes): ✅ All work correctly

## No Breaking Changes

- Only modified the `gallabox.ts` utility file
- No changes to database schema
- No changes to validation rules
- No changes to API endpoints
- No changes to frontend code
- Backward compatible with existing phone number formats

## Verification

1. ✅ TypeScript build succeeds with no errors
2. ✅ Backend server starts successfully
3. ✅ Database connection working
4. ✅ All test cases pass
5. ✅ No other files modified

## Recommendation for Future

To prevent inconsistency, consider:

1. Standardizing phone number storage to always include country code (12 digits)
2. Updating validation to enforce consistent format
3. Running a one-time migration to normalize existing phone numbers

However, the current fix handles both formats gracefully, so this is not urgent.
