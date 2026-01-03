# Setup Google Credentials - Quick Guide

## You Removed the JSON File - Here's What to Do

Since you removed `clinic-booking-system-483212-31e92efb492d.json`, you have two options:

---

## Option 1: Download the File Again (Easiest for Now)

### Step 1: Go to Google Cloud Console

1. Visit: https://console.cloud.google.com/
2. Select project: **clinic-booking-system-483212**
3. Go to: **IAM & Admin** > **Service Accounts**

### Step 2: Find Your Service Account

Look for: `clinic-booking-system@clinic-booking-system-483212.iam.gserviceaccount.com`

### Step 3: Create New Key

1. Click on the service account
2. Go to **Keys** tab
3. Click **Add Key** > **Create new key**
4. Choose **JSON** format
5. Click **Create**
6. File will download automatically

### Step 4: Place the File

1. Rename it to: `clinic-booking-system-483212-31e92efb492d.json`
2. Put it in: `backend/` folder
3. **DO NOT commit to Git** (it's already in .gitignore)

### Step 5: Test

```bash
cd backend
node test-google-meet-creation.js
```

You should see:

```
⚠️ Using Google credentials from file (development only)
✅ Google Meet utility initialized
✅ SUCCESS! Google Meet link created
```

---

## Option 2: Use Environment Variable (Better for Production)

### Step 1: Get the JSON Content

If you still have the file somewhere (backup, email, etc.), open it and copy the entire content.

It looks like this:

```json
{
  "type": "service_account",
  "project_id": "clinic-booking-system-483212",
  "private_key_id": "31e92efb492d...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "clinic-booking-system@clinic-booking-system-483212.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

### Step 2: Add to .env File

Open `backend/.env` and add:

```env
# Google Service Account (entire JSON as one line)
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"clinic-booking-system-483212","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

**Important**:

- Must be ONE line
- Keep all quotes and braces
- Don't add extra spaces

### Step 3: Test

```bash
cd backend
node test-google-meet-creation.js
```

You should see:

```
✅ Using Google credentials from environment variable
✅ Google Meet utility initialized
✅ SUCCESS! Google Meet link created
```

---

## For Production Deployment

### Railway / Render / Heroku

1. Go to your project dashboard
2. Find **Environment Variables** section
3. Add variable:
   - **Name**: `GOOGLE_SERVICE_ACCOUNT_KEY`
   - **Value**: Paste the entire JSON (one line)
4. Save and redeploy

### Vercel

```bash
vercel env add GOOGLE_SERVICE_ACCOUNT_KEY
# Paste the JSON when prompted
```

### AWS / Google Cloud / Azure

Use their secret management services:

- **AWS**: Secrets Manager
- **Google Cloud**: Secret Manager
- **Azure**: Key Vault

---

## Quick Test Script

Save this as `test-google-env.js`:

```javascript
// Test if Google credentials are set
require("dotenv").config();

console.log("🔍 Checking Google credentials...\n");

if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
  try {
    const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    console.log("✅ Environment variable found");
    console.log("✅ JSON is valid");
    console.log("✅ Project:", creds.project_id);
    console.log("✅ Email:", creds.client_email);
    console.log("\n✅ Ready to use!");
  } catch (error) {
    console.log("❌ Environment variable found but JSON is invalid");
    console.log("Error:", error.message);
  }
} else {
  console.log("⚠️  Environment variable not set");
  console.log("Looking for file instead...");

  const fs = require("fs");
  const path = require("path");
  const filePath = path.join(
    __dirname,
    "clinic-booking-system-483212-31e92efb492d.json"
  );

  if (fs.existsSync(filePath)) {
    console.log("✅ File found:", filePath);
    console.log("✅ Ready to use!");
  } else {
    console.log("❌ File not found:", filePath);
    console.log("\n📝 You need to either:");
    console.log("   1. Download the JSON file from Google Cloud Console");
    console.log("   2. Set GOOGLE_SERVICE_ACCOUNT_KEY environment variable");
  }
}
```

Run it:

```bash
node test-google-env.js
```

---

## Recommendation

**For Now (Development)**:

- Download the JSON file again (Option 1)
- Keep it in backend folder
- It's already in .gitignore so it won't be committed

**For Production**:

- Use environment variable (Option 2)
- Never include the JSON file in your deployment
- Set `GOOGLE_SERVICE_ACCOUNT_KEY` in your hosting platform

---

## Security Checklist

- [ ] JSON file is in `.gitignore`
- [ ] JSON file is NOT committed to Git
- [ ] For production, use environment variable
- [ ] Never share credentials in chat/email
- [ ] Rotate credentials periodically

---

## Need Help?

If you can't find the JSON file:

1. Go to Google Cloud Console
2. Create a new key (Step 3 in Option 1)
3. Download it
4. Place in backend folder

The code will automatically detect and use it!
