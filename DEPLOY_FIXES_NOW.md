# Deploy Production Fixes - Quick Guide

**Status:** ✅ Ready to Deploy  
**Build Status:** ✅ Passing  
**Breaking Changes:** ❌ None

---

## What Was Fixed

1. **Database URL Safety** - Prevents crashes if env var missing
2. **Field Name Consistency** - `years_of_experience` now works correctly
3. **Response Casing** - Backend returns camelCase for frontend

---

## Quick Deploy Steps

### Option 1: AWS Elastic Beanstalk (Recommended)

```bash
# 1. Navigate to backend folder
cd backend

# 2. Verify build works
npm run build

# 3. Create deployment package (exclude unnecessary files)
zip -r ../backend-deploy.zip . -x "*.git*" "node_modules/*" "*.log" "*.md" "dist/*"

# 4. Deploy via AWS Console
# - Go to Elastic Beanstalk Console
# - Select your environment (mibo-backend-env)
# - Click "Upload and deploy"
# - Upload backend-deploy.zip
# - Wait for deployment to complete (~5 minutes)
```

### Option 2: EB CLI (If installed)

```bash
cd backend
eb deploy
```

---

## Verify Deployment

### 1. Health Check

```bash
curl https://api.mibo.care/api/health
```

**Expected:**

```json
{ "status": "ok" }
```

### 2. Test Clinician API

```bash
curl https://api.mibo.care/api/clinicians?centreId=1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** Response with camelCase fields:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "yearsOfExperience": 5,
      "consultationFee": 1500,
      "primaryCentreId": 1
    }
  ]
}
```

### 3. Test Admin Panel

1. Go to `https://mibo.care/admin`
2. Login
3. Navigate to Clinicians page
4. Check if experience years and fees display correctly
5. Try creating a new clinician

---

## Rollback Plan (If Needed)

If something goes wrong:

1. **Via AWS Console:**
   - Go to Elastic Beanstalk
   - Click "Application versions"
   - Select previous version
   - Click "Deploy"

2. **Via EB CLI:**
   ```bash
   eb deploy --version <previous-version-label>
   ```

---

## Post-Deployment Checklist

- [ ] Health endpoint returns 200 OK
- [ ] Clinician list API returns camelCase fields
- [ ] Admin panel displays clinician data correctly
- [ ] Can create new clinician with experience years
- [ ] Can update existing clinician
- [ ] No errors in CloudWatch logs

---

## Environment Variables (Already Set)

No new environment variables needed. Existing config is sufficient:

- ✅ DATABASE_URL
- ✅ JWT_ACCESS_SECRET
- ✅ CORS_ORIGIN

---

## Expected Downtime

**Zero downtime** - Elastic Beanstalk performs rolling deployment.

---

## Support

If issues occur:

1. Check CloudWatch logs in AWS Console
2. Verify environment variables are set
3. Test database connectivity
4. Roll back to previous version if needed

---

## Summary

✅ **Safe to deploy**  
✅ **No breaking changes**  
✅ **Backward compatible**  
✅ **Build verified**

Deploy with confidence!
