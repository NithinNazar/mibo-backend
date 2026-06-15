# 🚨 URGENT: OTP Issue - Production Backend Error

## ✅ CONFIRMED

- Frontend: **NO ISSUES** - Correctly deployed and configured
- Backend Code: **NO CHANGES** - Same code that was working before
- Production Backend: **THROWING ERROR** - Returning 500 Internal Server Error

## 🔍 INVESTIGATION RESULTS

### Test Results:

```bash
curl https://api.mibo.care/api/patient-auth/send-otp
Response: {"success":false,"error":{"code":"INTERNAL_ERROR","message":"An unexpected error occurred"}}
Status: 500 Internal Server Error
```

### What This Means:

- Production backend is catching an UNEXPECTED error
- Error is being logged to backend logs (but message is hidden in response)
- Error is happening INSIDE the `patientAuthService.sendOTP()` method

## 🎯 MOST LIKELY CAUSES (In Order of Probability)

### 1. ⚠️ DATABASE CONNECTION ISSUE (Most Likely)

**Symptom:** Backend can't connect to database to check if user exists  
**Why:** The `sendOTP` method calls `patientRepository.findUserByPhone()` which requires database

**Quick Test:**

```bash
# Check if database is reachable from production server
psql -h <db-host> -U <db-user> -d <db-name> -c "SELECT 1;"
```

**Fix:**

- Check if production database is running
- Check if DATABASE_URL environment variable is correct
- Check database firewall rules
- Restart database if needed

---

### 2. ⚠️ GALLABOX CREDENTIALS EXPIRED/CHANGED

**Symptom:** Gallabox rejecting API requests  
**Why:** API keys might have been rotated, expired, or account suspended

**Quick Test:**

```bash
# From production server, test Gallabox API directly
curl -X POST https://server.gallabox.com/devapi/messages/whatsapp \
  -H "apiKey: YOUR_API_KEY" \
  -H "apiSecret: YOUR_API_SECRET" \
  -d '{"channelId":"YOUR_CHANNEL_ID","recipient":{"phone":"919876543210"}}'
```

**Fix:**

- Login to Gallabox dashboard: https://gallabox.com/
- Check if API keys are still valid
- Check if account is active
- Regenerate API keys if needed and update production .env

---

### 3. ⚠️ GALLABOX TEMPLATE UNAPPROVED/DELETED

**Symptom:** Gallabox rejecting template messages  
**Why:** WhatsApp template `otp_verification` might have been rejected or deleted

**Quick Test:**

- Login to Gallabox dashboard
- Navigate to "Templates" section
- Look for template: `otp_verification`
- Check status: Should be "APPROVED" (green)

**Fix:**

- If template missing: Recreate and submit for approval
- If template rejected: Fix issues and resubmit
- If template pending: Wait for WhatsApp approval (1-24 hours)

---

### 4. ⚠️ PRODUCTION ENVIRONMENT VARIABLES MISSING

**Symptom:** Backend can't find Gallabox config  
**Why:** Environment variables not set on production

**Quick Test:**

```bash
# SSH to production server
echo $GALLABOX_API_KEY
echo $GALLABOX_API_SECRET
echo $GALLABOX_CHANNEL_ID
```

**Fix:**

- Add missing variables to production .env
- Restart backend after adding variables

---

## 🔧 IMMEDIATE ACTION REQUIRED

### Step 1: Check Production Backend Logs (URGENT!)

This is the MOST IMPORTANT step - the logs will tell you the exact error.

**If using PM2:**

```bash
ssh <your-production-server>
pm2 logs backend --lines 100
```

**If using Docker:**

```bash
docker logs <backend-container-name> --tail 100
```

**If using systemd:**

```bash
journalctl -u backend-service -n 100
```

**What to Look For:**

- Database connection errors: `ECONNREFUSED`, `password authentication failed`, `database does not exist`
- Gallabox errors: `401 Unauthorized`, `Invalid API Key`, `Template not found`
- Any error with "Error sending OTP:" prefix

**Send me the error logs and I can help fix it immediately!**

---

### Step 2: Check Production Database Connectivity

```bash
# On production server
psql "postgresql://user:password@host:5432/database" -c "SELECT COUNT(*) FROM users;"
```

If this fails, your database is the issue.

---

### Step 3: Verify Gallabox Configuration

```bash
# Check environment variables are set
env | grep GALLABOX
```

Should show:

```
GALLABOX_API_KEY=695652f2540814a19bebf8b5
GALLABOX_API_SECRET=edd9fb89a68548d6a7fb080ea8255b1e
GALLABOX_CHANNEL_ID=693a63bfeba0dac02ac3d624
```

---

## 🚀 QUICK FIXES

### If Database Issue:

```bash
# Restart database
sudo systemctl restart postgresql
# OR
docker restart postgres-container

# Then restart backend
pm2 restart backend
```

### If Gallabox Issue:

1. Login to Gallabox dashboard
2. Check API credentials under Settings > API
3. Check templates under Templates section
4. Check WhatsApp connection under Channels

### If Environment Variables Missing:

```bash
# Edit production .env
nano /path/to/backend/.env

# Add these lines:
GALLABOX_API_KEY=695652f2540814a19bebf8b5
GALLABOX_API_SECRET=edd9fb89a68548d6a7fb080ea8255b1e
GALLABOX_CHANNEL_ID=693a63bfeba0dac02ac3d624

# Save and restart
pm2 restart backend
```

---

## 📝 WHAT WE KNOW FOR SURE

✅ **Frontend is fine** - No changes to OTP sending logic  
✅ **Backend code is fine** - Same code that worked before  
❌ **Production environment has an issue** - Database, Gallabox, or config

## 🎯 NEXT STEPS

1. **CHECK PRODUCTION LOGS** (Most important!)
2. **Test database connectivity**
3. **Verify Gallabox dashboard**
4. **Check environment variables**

---

## 💬 NEED HELP?

**Share with me:**

1. Production backend logs (last 50-100 lines)
2. Result of database connectivity test
3. Screenshot of Gallabox dashboard (templates section)

**I can help you fix this in minutes once I see the actual error!**
