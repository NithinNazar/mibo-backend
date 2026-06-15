# OTP Issue Diagnostic Guide

## 🔍 PROBLEM IDENTIFIED

**Issue:** OTP not being sent via WhatsApp  
**Root Cause:** Production backend at `https://api.mibo.care` is returning error: "An unexpected error occurred"  
**Scope:** Backend issue, NOT frontend issue

---

## ✅ VERIFIED WORKING

1. ✅ Frontend deployed successfully and calling correct backend URL (`https://api.mibo.care/api`)
2. ✅ Production backend is running and responding (health check passed)
3. ✅ Local backend (localhost:5000) has correct Gallabox configuration
4. ✅ Gallabox credentials exist in local `.env` file

---

## ❌ ISSUE LOCATION

**Production Backend:** `https://api.mibo.care`

The production backend is throwing an error when trying to send OTP. This could be due to:

1. **Missing Environment Variables** - Gallabox credentials not set on production server
2. **Gallabox Template Issues** - `otp_verification` template not approved or missing
3. **Gallabox Channel Issues** - Channel ID mismatch or inactive channel
4. **Network/Firewall Issues** - Production server cannot reach Gallabox API
5. **Error Handling** - Backend not logging actual error details

---

## 🔧 TROUBLESHOOTING STEPS

### Step 1: Check Production Backend Environment Variables

SSH into your production server and verify these environment variables are set:

```bash
# Check if variables exist
echo $GALLABOX_API_KEY
echo $GALLABOX_API_SECRET
echo $GALLABOX_CHANNEL_ID
```

**Expected Values (from local .env):**

- `GALLABOX_API_KEY=695652f2540814a19bebf8b5`
- `GALLABOX_API_SECRET=edd9fb89a68548d6a7fb080ea8255b1e`
- `GALLABOX_CHANNEL_ID=693a63bfeba0dac02ac3d624`

**If missing:** Add them to your production `.env` file or environment configuration (AWS, Docker, etc.)

---

### Step 2: Check Production Backend Logs

View the production backend logs to see the actual error:

```bash
# If using PM2
pm2 logs backend

# If using Docker
docker logs <container-name>

# If using systemd
journalctl -u backend-service -f
```

**Look for:**

- Gallabox initialization message: "✓ Gallabox initialized successfully"
- Error messages when OTP send is attempted
- Network errors or API key errors

---

### Step 3: Verify Gallabox Template Exists and is Approved

1. Login to Gallabox dashboard: https://gallabox.com/
2. Navigate to: **Templates** or **Message Templates**
3. Find template named: `otp_verification`
4. Check status: Should be **APPROVED** (green checkmark)
5. Verify template structure:
   ```
   Template Name: otp_verification
   Body Variables: {{otp}}
   Language: English
   Category: AUTHENTICATION
   ```

**If template is missing or not approved:**

- Create/re-submit the template for WhatsApp approval
- Wait for WhatsApp approval (can take 1-2 hours to 24 hours)
- Use the exact template name `otp_verification` in code

---

### Step 4: Test Gallabox API Directly

Test if Gallabox API is accessible from production server:

```bash
# SSH into production server, then run:
curl -X POST https://server.gallabox.com/devapi/messages/whatsapp \
  -H "Content-Type: application/json" \
  -H "apiKey: 695652f2540814a19bebf8b5" \
  -H "apiSecret: edd9fb89a68548d6a7fb080ea8255b1e" \
  -d '{
    "channelId": "693a63bfeba0dac02ac3d624",
    "channelType": "whatsapp",
    "recipient": {
      "name": "Test",
      "phone": "919876543210"
    },
    "whatsapp": {
      "type": "template",
      "template": {
        "templateName": "otp_verification",
        "bodyValues": {
          "otp": "123456"
        }
      }
    }
  }'
```

**Expected Response:** Success with message ID  
**If fails:** Check error message for API key issues, template issues, or network issues

---

### Step 5: Enable Detailed Error Logging (Temporary)

Modify `src/controllers/patient-auth.controller.ts` to log actual errors:

```typescript
async sendOtp(req: Request, res: Response): Promise<void> {
  try {
    // ... existing code ...
  } catch (error: any) {
    // ADD THIS FOR DEBUGGING:
    console.error("❌ FULL ERROR DETAILS:", error);
    console.error("❌ ERROR STACK:", error.stack);
    console.error("❌ ERROR RESPONSE:", error.response?.data);

    logger.error("Error sending OTP:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send OTP",
    });
  }
}
```

Then redeploy backend and check logs when OTP is attempted.

---

## 🚀 QUICK FIX (Most Likely Solution)

**The most common cause is missing environment variables on production.**

### If using AWS EC2/Ubuntu:

1. SSH into server
2. Edit production `.env` file:

   ```bash
   nano /path/to/backend/.env
   ```

3. Add these lines (if missing):

   ```env
   GALLABOX_API_KEY=695652f2540814a19bebf8b5
   GALLABOX_API_SECRET=edd9fb89a68548d6a7fb080ea8255b1e
   GALLABOX_CHANNEL_ID=693a63bfeba0dac02ac3d624
   ```

4. Restart backend:

   ```bash
   pm2 restart backend
   # OR
   systemctl restart backend
   ```

5. Test OTP again from frontend

---

## 🧪 TEST AFTER FIX

After applying the fix, test the OTP flow:

1. Go to https://mibo.care or https://www.mibo.care
2. Click "Sign In" or start booking flow
3. Enter your phone number (with your actual WhatsApp number)
4. Click "Send OTP"
5. Check your WhatsApp for OTP message

**If still not working:**

- Check backend logs for specific error messages
- Verify Gallabox template is approved
- Test Gallabox API directly from server
- Contact Gallabox support if API is failing

---

## 📞 NEED HELP?

If the issue persists after trying these steps:

1. **Share backend logs** - Copy the error messages from production logs
2. **Share Gallabox dashboard** - Screenshot of template status
3. **Test results** - Result of testing Gallabox API directly

---

## 📝 SUMMARY

**Problem:** Production backend missing Gallabox credentials or template not approved  
**Solution:** Add environment variables to production backend and ensure template is approved  
**Frontend:** ✅ No issues - correctly deployed  
**Backend:** ❌ Needs environment variables configured on production server
