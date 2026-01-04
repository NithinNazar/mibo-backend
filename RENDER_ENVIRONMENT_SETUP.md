# Render Environment Variables Setup

## Overview

This guide lists all environment variables that must be configured on Render for the backend to work correctly with the Vercel frontend.

## Required Environment Variables

### 1. Server Configuration

**NODE_ENV**

```
production
```

**PORT**

```
5000
```

(Render will override this automatically, but it's good to set)

### 2. Database Configuration

**DATABASE_URL**

```
postgresql://username:password@host:port/database
```

Get this from your Render PostgreSQL database or external database provider.

### 3. JWT Configuration

**JWT_ACCESS_SECRET**

```
[Generate a strong 32+ character secret]
```

Example: `mibo_prod_access_secret_2026_change_this_to_random_string_min_32_chars`

**JWT_REFRESH_SECRET**

```
[Generate a different strong 32+ character secret]
```

Example: `mibo_prod_refresh_secret_2026_change_this_to_random_string_min_32_chars`

**JWT_ACCESS_EXPIRY**

```
15m
```

**JWT_REFRESH_EXPIRY**

```
7d
```

### 4. OTP Configuration

**OTP_EXPIRY_MINUTES**

```
10
```

### 5. Gallabox (WhatsApp) Configuration

**GALLABOX_API_KEY**

```
695652f2540814a19bebf8b5
```

**GALLABOX_API_SECRET**

```
edd9fb89a68548d6a7fb080ea8255b1e
```

**GALLABOX_CHANNEL_ID**

```
693a63bfeba0dac02ac3d624
```

### 6. Razorpay Configuration

**RAZORPAY_KEY_ID**

```
rzp_live_xxxxx  (for production)
rzp_test_xxxxx  (for testing)
```

Current test key: `rzp_test_Rv16VKPj91R00I`

**RAZORPAY_KEY_SECRET**

```
[Your Razorpay secret key]
```

Current test secret: `lVTIWgJw36ydSFnDeGmaKIBx`

### 7. CORS Configuration

**CORS_ORIGIN** ⚠️ **CRITICAL**

```
https://your-app.vercel.app
```

Replace with your actual Vercel deployment URL. This MUST match exactly or you'll get CORS errors.

Examples:

- `https://mibo-mental-health.vercel.app`
- `https://mibo-v2.vercel.app`

### 8. Google Meet Configuration

**GOOGLE_SERVICE_ACCOUNT_KEY**

```
{
  "type": "service_account",
  "project_id": "clinic-booking-system-483212",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

⚠️ **IMPORTANT**: Paste the ENTIRE JSON content from `clinic-booking-system-483212-31e92efb492d.json` as a single line or multiline string.

**GOOGLE_MEET_ORGANIZER_EMAIL**

```
reach@mibocare.com
```

## How to Set Environment Variables on Render

1. Go to your Render dashboard
2. Select your backend web service
3. Click on **Environment** in the left sidebar
4. Click **Add Environment Variable**
5. For each variable:
   - Enter the **Key** (e.g., `DATABASE_URL`)
   - Enter the **Value**
   - Click **Add**
6. After adding all variables, click **Save Changes**
7. Render will automatically redeploy your service

## Environment Variables Checklist

Use this checklist to ensure all variables are set:

- [ ] NODE_ENV=production
- [ ] PORT=5000
- [ ] DATABASE_URL (from Render PostgreSQL or external)
- [ ] JWT_ACCESS_SECRET (strong random string)
- [ ] JWT_REFRESH_SECRET (different strong random string)
- [ ] JWT_ACCESS_EXPIRY=15m
- [ ] JWT_REFRESH_EXPIRY=7d
- [ ] OTP_EXPIRY_MINUTES=10
- [ ] GALLABOX_API_KEY
- [ ] GALLABOX_API_SECRET
- [ ] GALLABOX_CHANNEL_ID
- [ ] RAZORPAY_KEY_ID
- [ ] RAZORPAY_KEY_SECRET
- [ ] CORS_ORIGIN (Vercel URL)
- [ ] GOOGLE_SERVICE_ACCOUNT_KEY (entire JSON)
- [ ] GOOGLE_MEET_ORGANIZER_EMAIL

## Verification

After setting all environment variables and redeploying:

1. **Check Render Logs**

   ```
   🔧 Environment Configuration:
      NODE_ENV: production
      PORT: 5000
      CORS_ORIGIN: https://your-app.vercel.app
   ```

2. **Test API Endpoint**

   ```bash
   curl https://mibo-backend.onrender.com/api/health
   ```

   Should return: `{"success":true,"message":"API is running"}`

3. **Test CORS**
   - Open your Vercel frontend
   - Try to sign in
   - Check browser console for CORS errors
   - If you see CORS errors, verify `CORS_ORIGIN` matches your Vercel URL exactly

## Common Issues

### Issue: CORS Error

**Symptom**: Frontend shows "CORS policy" error in console
**Solution**:

- Verify `CORS_ORIGIN` on Render matches Vercel URL exactly
- No trailing slash in URL
- Must be HTTPS for production

### Issue: Database Connection Failed

**Symptom**: Backend logs show "connection refused" or "authentication failed"
**Solution**:

- Verify `DATABASE_URL` is correct
- Check database is running and accessible
- Ensure database allows connections from Render IPs

### Issue: Google Meet Links Not Generated

**Symptom**: Appointments created but no Google Meet link
**Solution**:

- Verify `GOOGLE_SERVICE_ACCOUNT_KEY` is set correctly
- Check JSON is valid (use JSON validator)
- Ensure domain-wide delegation is enabled
- Verify service account has Calendar API access

### Issue: WhatsApp OTP Not Sent

**Symptom**: OTP send fails with Gallabox error
**Solution**:

- Verify Gallabox credentials are correct
- Check Gallabox account is active
- Ensure phone number format is correct (with country code)

## Security Best Practices

1. **Never commit `.env` file to Git**

   - Already in `.gitignore`
   - Use environment variables on Render

2. **Use strong secrets for JWT**

   - Minimum 32 characters
   - Random alphanumeric + special characters
   - Different secrets for access and refresh tokens

3. **Use production Razorpay keys**

   - Switch from `rzp_test_*` to `rzp_live_*` for production
   - Keep test keys for staging environment

4. **Rotate secrets regularly**

   - Change JWT secrets every 3-6 months
   - Update Razorpay keys if compromised

5. **Monitor logs**
   - Check Render logs regularly
   - Set up alerts for errors
   - Monitor API usage

## Next Steps

After setting up environment variables:

1. ✅ Verify backend deployment succeeds
2. ✅ Test API endpoints
3. ✅ Configure frontend `VITE_API_BASE_URL` on Vercel
4. ✅ Test complete booking flow
5. ✅ Monitor logs for errors
6. ✅ Set up database backups
7. ✅ Configure custom domain (optional)

## Support

If you encounter issues:

1. Check Render logs for error messages
2. Verify all environment variables are set correctly
3. Test API endpoints using curl or Postman
4. Check frontend browser console for errors
