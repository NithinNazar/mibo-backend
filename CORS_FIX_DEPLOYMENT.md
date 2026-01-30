# CORS Fix for Production Deployment

## Issue

Frontend at `https://mibo.care` and `https://www.mibo.care` is getting CORS errors when trying to access the backend API.

## Solution

Updated backend CORS configuration to include production domains.

## Changes Made

1. Added `https://mibo.care` and `https://www.mibo.care` to allowed origins
2. Made CORS configurable via `CORS_ORIGIN` environment variable
3. Added logging to help debug CORS issues

## Deployment Steps

### Option 1: Redeploy to Elastic Beanstalk (Recommended)

1. **Build the backend:**

   ```bash
   cd backend
   npm run build
   ```

2. **Create deployment package:**
   - Zip the following files/folders:
     - `dist/` folder (compiled JavaScript)
     - `package.json`
     - `package-lock.json`
     - `.ebextensions/` folder (if exists)

   Or use this command:

   ```bash
   zip -r backend-deploy.zip dist package.json package-lock.json .ebextensions
   ```

3. **Deploy to Elastic Beanstalk:**
   - Go to AWS Elastic Beanstalk Console
   - Select your environment: `mibo-backend-env`
   - Click "Upload and deploy"
   - Upload the `backend-deploy.zip` file
   - Wait for deployment to complete (2-5 minutes)

4. **Verify:**
   - Check environment health turns green
   - Test the API: `https://api.mibo.care/api/health`
   - Test CORS: Try signup from `https://mibo.care`

### Option 2: Update Environment Variable Only (Quick Fix)

If you want to add more origins without redeploying:

1. Go to AWS Elastic Beanstalk Console
2. Select your environment: `mibo-backend-env`
3. Go to Configuration → Software → Edit
4. Add/Update environment variable:
   - **Name**: `CORS_ORIGIN`
   - **Value**: `https://mibo.care,https://www.mibo.care`
5. Click "Apply"
6. Wait for environment to restart

**Note:** The hardcoded origins in the code will still work, but this allows you to add more without redeploying.

## Current Allowed Origins

After deployment, these origins will be allowed:

- ✅ `https://mibo.care`
- ✅ `https://www.mibo.care`
- ✅ `https://mibo-alt-v2.vercel.app`
- ✅ `https://mibo-alt-v2-git-main-nithin-nazars-projects.vercel.app`
- ✅ `http://localhost:5173` (local frontend)
- ✅ `http://localhost:5174` (local admin panel)
- ✅ `http://localhost:5175` (local admin panel alternate)
- ✅ Any origins specified in `CORS_ORIGIN` environment variable

## Testing After Deployment

1. **Test Health Endpoint:**

   ```bash
   curl https://api.mibo.care/api/health
   ```

   Should return: `{"status":"ok","timestamp":"..."}`

2. **Test CORS from Browser:**
   - Go to `https://mibo.care`
   - Open DevTools → Console
   - Try to sign up with OTP
   - Should work without CORS errors

3. **Check Logs:**
   - Go to Elastic Beanstalk → Logs → Request Logs
   - Download full logs
   - Search for "CORS" to see if any origins are being blocked

## Troubleshooting

### Still Getting CORS Errors?

1. **Check the exact origin in error message:**
   - Is it `https://mibo.care` or `https://www.mibo.care`?
   - Make sure both are in the allowed list

2. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or clear cache in DevTools → Network → Disable cache

3. **Check backend logs:**
   - Look for "CORS blocked for origin" messages
   - The logs will show which origin was blocked

4. **Verify deployment:**
   - Check that the new code is actually deployed
   - Look at the deployment timestamp in EB console

### Backend Not Responding?

1. Check environment health in EB console
2. Check if health check endpoint is working: `/api/health`
3. Review application logs for errors
4. Verify all environment variables are set correctly

## Environment Variables Checklist

Make sure these are set in Elastic Beanstalk:

- ✅ `DATABASE_URL`
- ✅ `JWT_ACCESS_SECRET`
- ✅ `JWT_REFRESH_SECRET`
- ✅ `RAZORPAY_KEY_ID`
- ✅ `RAZORPAY_KEY_SECRET`
- ✅ `GALLABOX_API_KEY`
- ✅ `GALLABOX_API_SECRET`
- ✅ `GOOGLE_PRIVATE_KEY`
- ✅ All other variables from `AWS_ENVIRONMENT_VARIABLES.txt`

## Next Steps After Fix

Once CORS is working:

1. Test complete signup flow on production
2. Test booking appointments
3. Test payment flow
4. Monitor error logs for any other issues
