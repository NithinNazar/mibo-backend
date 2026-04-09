# AWS Deployment Checklist - Username/Password Login Feature

## Overview

This checklist ensures the new username/password login feature works on AWS production.

## ✅ Step 1: Create Test User on AWS Database

### Option A: Using pgAdmin (Recommended)

1. Open pgAdmin and connect to AWS RDS database
2. Open Query Tool
3. Run the SQL from `create-test-user-aws.sql`:

```sql
-- Check if user exists
SELECT id, username, phone FROM users WHERE username = 'testuser123';

-- If not exists, create user
INSERT INTO users (username, password_hash, phone, email, full_name, user_type, is_active)
VALUES (
  'testuser123',
  '$2b$10$Q0cFryFE2ljhpdjNf3bQGuXRNtbSp4DoGmYBfaCj7ugb5gT1ihb2m',
  '919111111111',
  'testuser123@mibocare.com',
  'Test User for Razorpay',
  'PATIENT',
  true
)
RETURNING id;

-- Note the returned ID, then create patient profile (replace <USER_ID>)
INSERT INTO patient_profiles (user_id, is_active)
VALUES (<USER_ID>, true)
RETURNING id;

-- Verify
SELECT u.id, u.username, u.email, pp.id as patient_id
FROM users u
LEFT JOIN patient_profiles pp ON pp.user_id = u.id
WHERE u.username = 'testuser123';
```

### Option B: Using AWS RDS Query Editor

1. Go to AWS Console → RDS → Query Editor
2. Connect to your database
3. Run the same SQL as above

---

## ✅ Step 2: Deploy Backend Code to AWS

The new code needs to be deployed to AWS. Here's what was added:

### Files Modified:

1. `src/repositories/patient.repository.ts` - Added 2 methods
2. `src/services/patient-auth.service.ts` - Added loginWithPassword method
3. `src/controllers/patient-auth.controller.ts` - Added controller method
4. `src/routes/patient-auth.routes.ts` - Added new route

### Build the Code:

```bash
cd backend
npm run build
```

This creates the `dist/` folder with compiled JavaScript.

### Deploy Options:

#### If using Elastic Beanstalk:

```bash
# Commit changes
git add .
git commit -m "Add username/password login for Razorpay verification"

# Deploy
eb deploy
```

#### If using EC2 with PM2:

```bash
# SSH to EC2
ssh your-ec2-instance

# Pull latest code
cd /path/to/backend
git pull

# Install dependencies (if needed)
npm install

# Build
npm run build

# Restart PM2
pm2 restart all
```

#### If using ECS/Fargate:

```bash
# Build Docker image
docker build -t mibo-backend .

# Tag and push to ECR
docker tag mibo-backend:latest <your-ecr-repo>:latest
docker push <your-ecr-repo>:latest

# Update ECS service (will auto-deploy)
```

#### If using manual deployment:

1. Build locally: `npm run build`
2. Upload `dist/` folder to AWS
3. Restart Node.js process on AWS

---

## ✅ Step 3: Verify Deployment

### Test the API Endpoint:

```bash
curl -X POST https://api.mibo.care/api/patient-auth/login-with-password \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser123","password":"test@789"}'
```

Expected response:

```json
{
  "success": true,
  "message": "Login successful! Welcome back.",
  "data": {
    "user": { ... },
    "patient": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### Test from Frontend:

1. Go to https://mibo.care/auth
2. Click "Login with Username"
3. Enter:
   - Username: testuser123
   - Password: test@789
4. Click "Login"
5. Should redirect to dashboard

---

## ✅ Step 4: Verify Everything Works

### Checklist:

- [ ] Test user created in AWS database
- [ ] Backend code deployed to AWS
- [ ] API endpoint returns 200 (not 404)
- [ ] Frontend can login with username/password
- [ ] User redirected to dashboard after login
- [ ] User can book appointments
- [ ] User can make payments
- [ ] Phone/OTP login still works

---

## 🔧 Troubleshooting

### Error: 404 Not Found

**Problem:** Backend code not deployed to AWS  
**Solution:** Deploy the backend code (Step 2)

### Error: Invalid credentials

**Problem:** Test user not created in AWS database  
**Solution:** Run SQL in pgAdmin (Step 1)

### Error: Database connection failed

**Problem:** AWS RDS security group blocking connections  
**Solution:** Check RDS security group allows connections from backend

### Error: CORS error

**Problem:** CORS not configured for new endpoint  
**Solution:** Already handled - uses same CORS as other endpoints

---

## 📋 Test Credentials

**Username:** testuser123  
**Password:** test@789  
**Email:** testuser123@mibocare.com

---

## 🗑️ How to Remove After Razorpay Verification

### 1. Remove test user from AWS database:

```sql
DELETE FROM patient_profiles WHERE user_id = (SELECT id FROM users WHERE username = 'testuser123');
DELETE FROM users WHERE username = 'testuser123';
```

### 2. Remove backend code:

- Revert the 4 files modified
- Rebuild and redeploy

### 3. Remove frontend code:

- Revert `PatientAuth.tsx` and `authService.ts`
- Rebuild and redeploy frontend

---

## 📞 Support

If deployment fails or you need help:

1. Check AWS CloudWatch logs for errors
2. Check backend server logs
3. Verify database connection
4. Test API endpoint directly with curl

---

## Summary

**What you need to do:**

1. ✅ Run SQL in pgAdmin to create test user on AWS database
2. ✅ Deploy backend code to AWS (build + deploy)
3. ✅ Test the login works on production

**That's it!** The frontend is already updated and will work once backend is deployed.
