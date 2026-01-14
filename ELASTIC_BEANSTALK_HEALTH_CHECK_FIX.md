# ✅ Elastic Beanstalk Health Check Fix

## Problem Identified

Your backend is running correctly on AWS Elastic Beanstalk:

- ✅ Database connection successful
- ✅ Server listening on port 5000
- ✅ Application working properly

**BUT** the environment health is RED because:

- ❌ Elastic Beanstalk load balancer checks `GET /` by default
- ❌ Your app returns 404 for `/` (no route defined)
- ❌ EB treats 404 as failed health check
- ❌ Repeated failures → Environment marked unhealthy

## Solution Applied

### 1. Added Health Check Endpoints ✅

I've added two endpoints to `backend/src/app.ts`:

#### `/health` - Dedicated Health Check Endpoint

```typescript
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: ENV.NODE_ENV,
  });
});
```

**Response:**

```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2026-01-13T...",
  "uptime": 12345.67,
  "environment": "production"
}
```

#### `/` - Root Endpoint

```typescript
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Mibo Mental Health API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "/health",
      api: "/api",
    },
  });
});
```

**Response:**

```json
{
  "success": true,
  "message": "Mibo Mental Health API",
  "version": "1.0.0",
  "status": "running",
  "endpoints": {
    "health": "/health",
    "api": "/api"
  }
}
```

### 2. Build Verified ✅

```bash
npm run build
# Exit Code: 0 (success)
```

---

## Deployment Steps

### Option A: Quick Fix (Use Root Path)

If you want the quickest fix, you can keep the default health check on `/`:

1. **Rebuild and deploy:**

```bash
cd backend
npm run build
eb deploy
```

2. **Wait 2-3 minutes** for deployment to complete

3. **Check health:**

```bash
curl https://your-env.elasticbeanstalk.com/
```

Expected response:

```json
{
  "success": true,
  "message": "Mibo Mental Health API",
  ...
}
```

4. **Environment should turn green** automatically

---

### Option B: Best Practice (Use /health Endpoint)

This is the recommended production approach:

#### Step 1: Deploy Updated Code

```bash
cd backend
npm run build
eb deploy
```

#### Step 2: Configure Elastic Beanstalk Health Check

**Via AWS Console:**

1. Go to **Elastic Beanstalk Console**
2. Select your environment
3. Click **Configuration** (left sidebar)
4. Find **Load Balancer** section
5. Click **Edit**
6. Scroll to **Processes** section
7. Click **Edit** on the default process
8. Update these settings:
   - **Health check path:** `/health`
   - **Health check interval:** 30 seconds
   - **Health check timeout:** 5 seconds
   - **Healthy threshold:** 3
   - **Unhealthy threshold:** 5
9. Click **Apply**
10. Click **Apply** again on the main configuration page

**Via EB CLI:**

Create `.ebextensions/01_healthcheck.config`:

```yaml
option_settings:
  aws:elasticbeanstalk:environment:process:default:
    HealthCheckPath: /health
    HealthCheckInterval: 30
    HealthCheckTimeout: 5
    HealthyThresholdCount: 3
    UnhealthyThresholdCount: 5
```

Then deploy:

```bash
eb deploy
```

#### Step 3: Verify Health Check

```bash
# Test health endpoint
curl https://your-env.elasticbeanstalk.com/health

# Check environment health
eb health
```

Expected output:

```
Environment health: Ok
```

---

## Testing

### Test Locally

```bash
cd backend
npm run dev

# In another terminal:
curl http://localhost:5000/
curl http://localhost:5000/health
curl http://localhost:5000/api/health  # If you have this too
```

### Test on AWS

```bash
# Root endpoint
curl https://your-env.elasticbeanstalk.com/

# Health endpoint
curl https://your-env.elasticbeanstalk.com/health

# API endpoints (should still work)
curl https://your-env.elasticbeanstalk.com/api/clinicians
```

---

## Why This Happens

### AWS Elastic Beanstalk Health Checks

Elastic Beanstalk uses an Application Load Balancer (ALB) that:

1. Sends periodic HTTP requests to your app
2. Expects HTTP 200 response
3. Marks instance as healthy if checks pass
4. Marks instance as unhealthy if checks fail
5. Removes unhealthy instances from load balancer

### Default Behavior

- **Default health check path:** `/`
- **Your app before fix:** No route for `/` → 404 response
- **EB interpretation:** 404 = unhealthy → Red environment

### After Fix

- **Option A:** `/` returns 200 → Green environment
- **Option B:** `/health` returns 200 + EB configured to check `/health` → Green environment

---

## Configuration File (Optional)

Create `.ebextensions/01_healthcheck.config` for automated configuration:

```yaml
# .ebextensions/01_healthcheck.config
option_settings:
  # Load Balancer Health Check
  aws:elasticbeanstalk:environment:process:default:
    HealthCheckPath: /health
    HealthCheckInterval: 30
    HealthCheckTimeout: 5
    HealthyThresholdCount: 3
    UnhealthyThresholdCount: 5
    Port: 80
    Protocol: HTTP

  # Environment Properties
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
```

This file will be applied automatically on every deployment.

---

## Troubleshooting

### Issue: Environment Still Red After Deploy

**Wait 5-10 minutes** for:

- Deployment to complete
- Health checks to run
- Environment to stabilize

**Check logs:**

```bash
eb logs
```

Look for:

- Server startup messages
- Health check requests
- Any errors

### Issue: Health Endpoint Returns 404

**Cause:** Code not deployed or build failed

**Solution:**

```bash
# Verify build
npm run build
ls dist/

# Verify app.js has health routes
cat dist/app.js | grep "health"

# Redeploy
eb deploy
```

### Issue: Load Balancer Still Checking Wrong Path

**Cause:** Configuration not applied

**Solution:**

1. Go to AWS Console → Elastic Beanstalk
2. Configuration → Load Balancer → Edit
3. Verify health check path is `/health`
4. If not, update and apply
5. Wait 5 minutes

### Issue: 502 Bad Gateway

**Cause:** App not listening on correct port

**Solution:**
Verify `server.ts` uses `process.env.PORT`:

```typescript
const PORT = Number(process.env.PORT) || ENV.PORT || 5000;
```

This is already correct in your code ✅

---

## What Changed in Code

### File: `backend/src/app.ts`

**Added before API routes:**

```typescript
/**
 * Health check endpoint for AWS Elastic Beanstalk / Load Balancer
 */
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: ENV.NODE_ENV,
  });
});

/**
 * Root endpoint
 */
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Mibo Mental Health API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "/health",
      api: "/api",
    },
  });
});
```

**Why before API routes?**

- Express matches routes in order
- These need to be checked before the `/api` prefix
- Prevents them from being caught by 404 handler

---

## Summary

✅ **Added `/health` endpoint** - Returns 200 OK with server status  
✅ **Added `/` endpoint** - Returns 200 OK with API info  
✅ **Build verified** - TypeScript compiles successfully  
✅ **Ready to deploy** - No breaking changes

**Next Steps:**

1. Deploy updated code: `eb deploy`
2. (Optional) Configure EB to use `/health` path
3. Wait 5-10 minutes for environment to stabilize
4. Environment should turn green ✅

**This is NOT a bug** - it's an AWS-specific requirement. All cloud platforms need health check endpoints!

---

## Quick Commands

```bash
# Deploy fix
cd backend
npm run build
eb deploy

# Check status
eb health

# View logs
eb logs

# Test endpoints
curl https://your-env.elasticbeanstalk.com/
curl https://your-env.elasticbeanstalk.com/health
```

Your backend will be healthy after this deployment! 🚀
