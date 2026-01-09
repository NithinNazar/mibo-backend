# Fix Google Meet Integration on Render

## Problem

Google Meet links are not being generated for online appointments on Render because the environment variable is not set correctly.

## Current Issue

You have set individual fields:

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_CALENDAR_ID`

But the code expects a **single variable** called `GOOGLE_SERVICE_ACCOUNT_KEY` containing the entire JSON.

## Solution

### Step 1: Get Your JSON File Content

Open your local file: `clinic-booking-system-483212-31e92efb492d.json`

It should look like this:

```json
{
  "type": "service_account",
  "project_id": "clinic-booking-system-483212",
  "private_key_id": "31e92efb492d...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDAOe6fRL5u2F41P...\n-----END PRIVATE KEY-----\n",
  "client_email": "clinic-booking-system@clinic-booking-system-483212.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

### Step 2: Remove Old Environment Variables on Render

1. Go to your Render dashboard
2. Select your backend web service
3. Go to **Environment** tab
4. **Delete** these variables:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - `GOOGLE_CALENDAR_ID`

### Step 3: Add New Environment Variable

1. Click **Add Environment Variable**
2. Set **Key**: `GOOGLE_SERVICE_ACCOUNT_KEY`
3. Set **Value**: Paste the **entire JSON content** from your file

**IMPORTANT**: You can paste it as-is (multiline) or as a single line. Render will handle it correctly.

**Example (multiline format):**

```json
{
  "type": "service_account",
  "project_id": "clinic-booking-system-483212",
  "private_key_id": "31e92efb492d...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDAOe6fRL5u2F41P...\n-----END PRIVATE KEY-----\n",
  "client_email": "clinic-booking-system@clinic-booking-system-483212.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

4. Click **Save Changes**
5. Render will automatically redeploy your service

### Step 4: Verify in Render Logs

After redeployment, check the logs:

**Success:**

```
✅ Using Google credentials from environment variable
✅ Google Meet utility initialized
```

**Failure:**

```
❌ Failed to initialize Google Meet utility
```

## How It Works

The code in `src/utils/google-meet.ts` checks for the environment variable:

```typescript
if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
  // Parse JSON from environment variable
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
  logger.info("✅ Using Google credentials from environment variable");
}
```

## Testing After Fix

1. **Book an online appointment** on your Vercel frontend
2. **Complete payment**
3. **Check WhatsApp** - should receive message with Google Meet link
4. **Check Dashboard** - appointment should show with "Join Google Meet" button
5. **Check Render logs** - should see:
   ```
   📹 Creating Google Meet link for online appointment X
   ✅ Google Meet link created: https://meet.google.com/xxx-xxxx-xxx
   ✅ WhatsApp online consultation confirmation sent to +91XXXXXXXXXX with Google Meet link
   ```

## Dashboard Display Issue

You mentioned appointments don't show on the dashboard. This is a separate issue from Google Meet. Let me check the dashboard API.

### Dashboard API Endpoint

The dashboard calls: `GET /api/patient/dashboard`

This should return:

- `upcomingAppointments` - appointments with status CONFIRMED and future date
- `recentAppointments` - recent past appointments

### Possible Causes:

1. **Appointment status** - Check if appointment status is "CONFIRMED" after payment
2. **Date filtering** - Dashboard might be filtering by date incorrectly
3. **Patient ID mismatch** - Dashboard might be querying wrong patient ID

### Quick Fix for Dashboard

Let me check the patient dashboard controller to see the query logic.

## Summary

**For Google Meet:**

1. Delete individual Google env vars on Render
2. Add single `GOOGLE_SERVICE_ACCOUNT_KEY` with entire JSON
3. Redeploy and test

**For Dashboard:**

- Need to investigate the dashboard API query
- Check appointment status after payment
- Verify patient ID is correct

## Environment Variables Checklist

After fixing, you should have:

- ✅ `GOOGLE_SERVICE_ACCOUNT_KEY` - Entire JSON from service account file
- ❌ ~~`GOOGLE_SERVICE_ACCOUNT_EMAIL`~~ - Remove this
- ❌ ~~`GOOGLE_PRIVATE_KEY`~~ - Remove this
- ❌ ~~`GOOGLE_CALENDAR_ID`~~ - Remove this (code uses "primary" by default)
