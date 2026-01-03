# Google Service Account Credentials Setup

## ⚠️ Security Warning

**NEVER commit the `clinic-booking-system-483212-31e92efb492d.json` file to Git!**

This file contains sensitive credentials including:

- Private key
- Service account email
- Project ID
- Client secrets

## Development Setup (Local)

### Option 1: Keep JSON File Locally (Current)

The file `clinic-booking-system-483212-31e92efb492d.json` is in your backend folder.

**Status**: ✅ Already working  
**Security**: ⚠️ File is in `.gitignore` - don't commit it!

### Option 2: Use Environment Variable (Recommended)

1. Read the JSON file content
2. Add to `.env`:

```env
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"clinic-booking-system-483212",...}'
```

3. Remove the JSON file from project

## Production Setup (Cloud Hosting)

### For Railway, Render, Heroku, etc.

#### Step 1: Get JSON Content

```bash
# On your local machine
cat backend/clinic-booking-system-483212-31e92efb492d.json
```

Copy the entire JSON content (it's one long line).

#### Step 2: Add Environment Variable

In your hosting platform's dashboard:

**Variable Name**: `GOOGLE_SERVICE_ACCOUNT_KEY`

**Value**: Paste the entire JSON content as a single line:

```json
{
  "type": "service_account",
  "project_id": "clinic-booking-system-483212",
  "private_key_id": "31e92efb492d...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "clinic-booking-system@...",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

**Important**:

- Must be valid JSON
- Keep it as ONE line
- Include all quotes and braces
- Don't add extra spaces or line breaks

### For AWS, Google Cloud, Azure

#### Option 1: Environment Variable (Same as above)

Set `GOOGLE_SERVICE_ACCOUNT_KEY` with JSON content.

#### Option 2: Secret Manager

- **AWS**: Use AWS Secrets Manager
- **Google Cloud**: Use Secret Manager
- **Azure**: Use Key Vault

Store the JSON content and reference it in your app.

#### Option 3: File Upload

Upload the JSON file to a secure location:

- Set proper permissions (read-only for app)
- Don't include in public directories
- Update path in code if needed

## How It Works

### Code Logic

```typescript
// In src/utils/google-meet.ts

if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
  // Production: Use environment variable
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
} else {
  // Development: Use local file
  auth = new google.auth.GoogleAuth({
    keyFile: "./clinic-booking-system-483212-31e92efb492d.json",
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
}
```

### Environment Detection

- **Local Development**: Uses JSON file (if no env var)
- **Production**: Uses `GOOGLE_SERVICE_ACCOUNT_KEY` env var

## Testing

### Test with Environment Variable

```bash
# Linux/Mac
export GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
npm run dev

# Windows PowerShell
$env:GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
npm run dev

# Windows CMD
set GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
npm run dev
```

### Verify

Check logs for:

```
✅ Using Google credentials from environment variable
✅ Google Meet utility initialized
```

## Deployment Checklist

### Before Deploying

- [ ] JSON file is in `.gitignore`
- [ ] JSON file is NOT committed to Git
- [ ] Environment variable is set in hosting platform
- [ ] Test locally with environment variable

### After Deploying

- [ ] Check logs for "Using Google credentials from environment variable"
- [ ] Test booking an ONLINE appointment
- [ ] Verify Google Meet link is created
- [ ] Check WhatsApp message is sent

### If It Fails

1. **Check logs**: Look for Google Meet initialization errors
2. **Verify JSON**: Make sure it's valid JSON (use jsonlint.com)
3. **Check quotes**: Ensure proper escaping in environment variable
4. **Test locally**: Set env var locally and test

## Security Best Practices

### ✅ DO

- Store credentials in environment variables
- Use secret managers for production
- Rotate credentials periodically
- Limit service account permissions
- Monitor API usage

### ❌ DON'T

- Commit JSON file to Git
- Share credentials in chat/email
- Store in public repositories
- Hard-code credentials in code
- Use same credentials for dev/prod

## Troubleshooting

### Error: "Failed to initialize Google Meet utility"

**Cause**: Credentials not found or invalid

**Solution**:

1. Check if `GOOGLE_SERVICE_ACCOUNT_KEY` is set
2. Verify JSON is valid
3. Ensure no extra spaces or line breaks
4. Check file exists (if using file method)

### Error: "Invalid JSON"

**Cause**: Environment variable has malformed JSON

**Solution**:

1. Copy JSON content again
2. Validate at jsonlint.com
3. Ensure proper escaping
4. Remove any line breaks

### Error: "Permission denied"

**Cause**: Service account doesn't have Calendar API access

**Solution**:

1. Go to Google Cloud Console
2. Enable Calendar API
3. Check service account permissions
4. Verify project ID matches

## Example: Railway Deployment

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Link project
railway link

# 4. Set environment variable
railway variables set GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'

# 5. Deploy
railway up
```

## Example: Render Deployment

1. Go to Render Dashboard
2. Select your service
3. Go to "Environment" tab
4. Click "Add Environment Variable"
5. Key: `GOOGLE_SERVICE_ACCOUNT_KEY`
6. Value: Paste JSON content
7. Save and redeploy

## Example: Vercel Deployment

```bash
# Using Vercel CLI
vercel env add GOOGLE_SERVICE_ACCOUNT_KEY

# Or in Vercel Dashboard:
# Settings > Environment Variables > Add
```

## Support

If you need help:

1. Check logs for specific error messages
2. Verify JSON format
3. Test locally with environment variable
4. Contact your hosting provider's support

---

**Last Updated**: January 4, 2026  
**Status**: Production Ready  
**Security Level**: High
