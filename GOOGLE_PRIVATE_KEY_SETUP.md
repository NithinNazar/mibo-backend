# 🔑 Google Private Key Setup Guide

## Quick Answer

**NO** - `GOOGLE_PRIVATE_KEY` does **NOT** expect the entire JSON file.

It expects **ONLY the `private_key` field value** from your Google service account JSON file.

---

## Step-by-Step Instructions

### 1. Download Google Service Account JSON

From Google Cloud Console:

1. Go to **IAM & Admin** > **Service Accounts**
2. Select your service account
3. Click **Keys** > **Add Key** > **Create new key**
4. Choose **JSON** format
5. Download the file

### 2. Open the JSON File

Your downloaded file looks like this:

```json
{
  "type": "service_account",
  "project_id": "clinic-booking-system-483212",
  "private_key_id": "abc123def456...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7xYz...\n-----END PRIVATE KEY-----\n",
  "client_email": "mibo-calendar@clinic-booking-system-483212.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

### 3. Extract ONLY the `private_key` Value

Copy **ONLY** this part:

```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7xYz...\n-----END PRIVATE KEY-----\n
```

**Important:**

- ✅ Include `-----BEGIN PRIVATE KEY-----` at the start
- ✅ Include `-----END PRIVATE KEY-----` at the end
- ✅ Keep the `\n` characters (literal backslash-n)
- ✅ It should be ONE long line with `\n` in it
- ❌ Don't paste the entire JSON
- ❌ Don't remove the `\n` characters
- ❌ Don't add actual line breaks

### 4. Set in AWS Environment Variables

In AWS Console, add:

```
Key: GOOGLE_PRIVATE_KEY
Value: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7xYz...\n-----END PRIVATE KEY-----\n"
```

**Note:** Wrap in quotes if your AWS interface requires it.

---

## Why This Format?

The code automatically converts `\n` to actual newlines:

```typescript
// From: backend/src/config/env.ts
GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY
  ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
  : "";
```

This allows you to store the key as a single-line environment variable, and the code converts it to the proper multi-line format that Google's API expects.

---

## Complete Google Meet Setup

You need **3 environment variables**:

```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=mibo-calendar@clinic-booking-system-483212.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7xYz...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=primary
```

**Where to find each:**

| Variable                       | Location in JSON                           |
| ------------------------------ | ------------------------------------------ |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `client_email` field                       |
| `GOOGLE_PRIVATE_KEY`           | `private_key` field (entire value)         |
| `GOOGLE_CALENDAR_ID`           | Use `primary` or your specific calendar ID |

---

## Example

**From this JSON:**

```json
{
  "client_email": "mibo-calendar@clinic-booking-system-483212.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASC...\n-----END PRIVATE KEY-----\n"
}
```

**Set these environment variables:**

```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=mibo-calendar@clinic-booking-system-483212.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASC...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=primary
```

---

## Troubleshooting

### Error: "Invalid private key"

**Cause:** Missing BEGIN/END markers or incorrect format

**Solution:**

- Ensure you copied the complete `private_key` value
- Include `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Keep `\n` characters intact

### Error: "Failed to initialize Google Meet"

**Cause:** Missing one of the 3 required variables

**Solution:**

- Verify all 3 variables are set: `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_CALENDAR_ID`
- Check CloudWatch logs for specific error messages

### Private key is too long for AWS Console

**Solution:**

- Use AWS Secrets Manager instead
- Or use AWS CLI to set environment variables
- Or use Infrastructure as Code (Terraform, CloudFormation)

---

## Testing

After deployment, check CloudWatch logs for:

```
✓ Google Meet initialized successfully
```

If you see this warning, Google Meet is not configured (but app will still work):

```
⚠ Google Meet not configured. Add GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, and GOOGLE_CALENDAR_ID to enable video consultations.
```

---

## Security Best Practices

1. **Never commit** the JSON file or private key to Git
2. **Use AWS Secrets Manager** for production (recommended)
3. **Rotate keys** periodically
4. **Limit service account permissions** to only Calendar API
5. **Monitor usage** in Google Cloud Console

---

## Need Help?

- Google Cloud Console: https://console.cloud.google.com/
- Service Accounts: https://console.cloud.google.com/iam-admin/serviceaccounts
- Calendar API: https://console.cloud.google.com/apis/library/calendar-json.googleapis.com

---

**Summary:** Extract only the `private_key` field value from your Google JSON file, keep it as one line with `\n` characters, and set it as the `GOOGLE_PRIVATE_KEY` environment variable.
