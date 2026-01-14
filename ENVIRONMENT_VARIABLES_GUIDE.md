# 📋 Environment Variables Guide for AWS Deployment

## Quick Start

I've created **5 files** with all your environment variables in different formats:

### 1. **AWS_ENV_COPY_PASTE.txt** ⭐ EASIEST

- **Use this for quick deployment**
- Simple copy-paste format
- One variable per line
- Ready for AWS Console

### 2. **AWS_ENVIRONMENT_VARIABLES.txt**

- Organized by category
- Includes comments
- Good for documentation

### 3. **AWS_ENVIRONMENT_VARIABLES_KEY_VALUE.json**

- JSON format
- Good for programmatic deployment
- Use with AWS CLI or Terraform

### 4. **AWS_ENVIRONMENT_VARIABLES_TABLE.md**

- Complete documentation
- Detailed descriptions
- Troubleshooting guide
- Step-by-step instructions

### 5. **GOOGLE_PRIVATE_KEY_SETUP.md** 🔑

- **Dedicated guide for Google Meet setup**
- Answers: "Does GOOGLE_PRIVATE_KEY expect entire JSON file?"
- Step-by-step instructions with examples
- Common mistakes and troubleshooting

---

## 🚀 Quick Deployment Steps

### Step 1: Copy Variables

Open `AWS_ENV_COPY_PASTE.txt` and copy all variables

### Step 2: Paste in AWS Console

1. Go to AWS Elastic Beanstalk
2. Select your environment
3. Click **Configuration**
4. Click **Software** > **Edit**
5. Scroll to **Environment properties**
6. Paste all variables (AWS will parse them automatically)
7. Click **Apply**

### Step 3: Update These Values

- `CORS_ORIGIN` → Your frontend URL (e.g., `https://mibo.com`)
- `JWT_ACCESS_SECRET` → Generate new secret for production
- `JWT_REFRESH_SECRET` → Generate new secret for production
- `RAZORPAY_KEY_ID` → Use LIVE mode key for production
- `RAZORPAY_KEY_SECRET` → Use LIVE mode secret for production

---

## 📊 Environment Variables Summary

### Total Variables: 17

**Required (14):**

- ✅ NODE_ENV
- ✅ PORT
- ✅ DATABASE_URL
- ✅ JWT_ACCESS_SECRET
- ✅ JWT_REFRESH_SECRET
- ✅ JWT_ACCESS_EXPIRY
- ✅ JWT_REFRESH_EXPIRY
- ✅ OTP_EXPIRY_MINUTES
- ✅ GALLABOX_API_KEY
- ✅ GALLABOX_API_SECRET
- ✅ GALLABOX_CHANNEL_ID
- ✅ RAZORPAY_KEY_ID
- ✅ RAZORPAY_KEY_SECRET
- ✅ CORS_ORIGIN

**Optional (3):**

- ⚠️ GOOGLE_SERVICE_ACCOUNT_EMAIL
- ⚠️ GOOGLE_PRIVATE_KEY
- ⚠️ GOOGLE_CALENDAR_ID

---

## 🔒 Security Checklist

### Before Production Deployment:

- [ ] Generate new JWT_ACCESS_SECRET (32+ characters)
- [ ] Generate new JWT_REFRESH_SECRET (32+ characters)
- [ ] Switch Razorpay to LIVE mode keys
- [ ] Update CORS_ORIGIN to production frontend URL
- [ ] Verify DATABASE_URL points to production database
- [ ] Test all integrations (Gallabox, Razorpay)
- [ ] Enable AWS Secrets Manager for sensitive data
- [ ] Set up CloudWatch logging
- [ ] Configure auto-scaling
- [ ] Set up health checks

### Generate New JWT Secrets:

```bash
# Run this command twice to get two different secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📝 Variable Details

### Server Configuration

```
NODE_ENV=production          # Production mode
PORT=5000                    # Server port (AWS overrides)
```

### Database (AWS RDS)

```
DATABASE_URL=postgresql://mibo_admin:mibo%23aws2026@mibo-postgres.cj00km2acx6s.eu-north-1.rds.amazonaws.com:5432/mibodb
```

**Note:** Password `mibo#aws2026` is URL-encoded as `mibo%23aws2026`

### JWT Authentication

```
JWT_ACCESS_SECRET=...        # Access token secret (CHANGE FOR PRODUCTION)
JWT_REFRESH_SECRET=...       # Refresh token secret (CHANGE FOR PRODUCTION)
JWT_ACCESS_EXPIRY=15m        # Access token expires in 15 minutes
JWT_REFRESH_EXPIRY=7d        # Refresh token expires in 7 days
```

### OTP Configuration

```
OTP_EXPIRY_MINUTES=10        # OTP valid for 10 minutes
```

### WhatsApp (Gallabox)

```
GALLABOX_API_KEY=...         # Gallabox API key
GALLABOX_API_SECRET=...      # Gallabox API secret
GALLABOX_CHANNEL_ID=...      # WhatsApp channel ID
```

### Payment Gateway (Razorpay)

```
RAZORPAY_KEY_ID=rzp_test_... # TEST mode (change to rzp_live_... for production)
RAZORPAY_KEY_SECRET=...      # Razorpay secret
```

### CORS Security

```
CORS_ORIGIN=https://...      # Frontend URL (MUST UPDATE)
```

### Google Meet (Optional)

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=primary
```

**IMPORTANT - GOOGLE_PRIVATE_KEY Format:**

- Extract ONLY the `private_key` field from your Google service account JSON file
- Include the complete key string with `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Use `\n` for line breaks (the code automatically converts them to actual newlines)
- Wrap the entire value in quotes if it contains spaces or special characters

**📖 Detailed Setup Guide:** See `GOOGLE_PRIVATE_KEY_SETUP.md` for complete step-by-step instructions

**Quick Summary:**

- ❌ Don't paste the entire JSON file
- ❌ Don't remove the `\n` characters
- ❌ Don't add actual line breaks
- ✅ Copy only the `private_key` field value from your Google JSON

**Example from Google JSON:**

```json
{
  "type": "service_account",
  "project_id": "your-project",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service-account@project.iam.gserviceaccount.com"
}
```

**What to copy:** Only the value of the `private_key` field (the entire string including BEGIN/END markers)

---

## 🧪 Testing After Deployment

### 1. Health Check

```bash
curl https://your-backend-url.elasticbeanstalk.com/api/health
```

**Expected:**

```json
{
  "status": "ok",
  "timestamp": "2026-01-12T..."
}
```

### 2. Database Connection

Check AWS CloudWatch logs for:

```
✅ Database connection established successfully
```

### 3. Environment Variables Loaded

Check logs for:

```
🔧 Environment Configuration:
   NODE_ENV: production
   PORT: 5000
   CORS_ORIGIN: https://...
```

---

## 🔧 Troubleshooting

### Issue: Variables not loading

**Solution:**

- Check AWS Console > Configuration > Software
- Verify all variables are listed
- Restart environment

### Issue: Database connection fails

**Solution:**

- Verify DATABASE_URL is correct
- Check RDS security group allows connections
- Verify password is URL-encoded

### Issue: CORS errors

**Solution:**

- Update CORS_ORIGIN to match frontend URL exactly
- Include protocol (https://)
- No trailing slash

### Issue: JWT errors

**Solution:**

- Verify JWT secrets are set
- Check secrets are at least 32 characters
- Ensure no extra spaces

---

## 📚 Additional Resources

### AWS Documentation

- [Elastic Beanstalk Environment Properties](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/environments-cfg-softwaresettings.html)
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/)
- [RDS Security Groups](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Overview.RDSSecurityGroups.html)

### Integration Documentation

- [Razorpay API Keys](https://dashboard.razorpay.com/app/keys)
- [Gallabox Dashboard](https://gallabox.com/)
- [Google Cloud Console](https://console.cloud.google.com/)

---

## ✅ Deployment Checklist

- [ ] Copy environment variables from `AWS_ENV_COPY_PASTE.txt`
- [ ] Paste into AWS Console
- [ ] Update CORS_ORIGIN
- [ ] Generate new JWT secrets (production)
- [ ] Switch to Razorpay LIVE keys (production)
- [ ] Verify all variables are set
- [ ] Deploy application
- [ ] Test health endpoint
- [ ] Check CloudWatch logs
- [ ] Test API endpoints
- [ ] Verify database connection
- [ ] Test WhatsApp integration
- [ ] Test payment integration

---

## 🎉 You're Ready!

All environment variables are documented and ready for AWS deployment.

**Files to use:**

1. **Quick deployment:** `AWS_ENV_COPY_PASTE.txt`
2. **Complete documentation:** `AWS_ENVIRONMENT_VARIABLES_TABLE.md`
3. **JSON format:** `AWS_ENVIRONMENT_VARIABLES_KEY_VALUE.json`
4. **Google Meet setup:** `GOOGLE_PRIVATE_KEY_SETUP.md` 🔑

**Next steps:**

1. Copy variables from `AWS_ENV_COPY_PASTE.txt`
2. Paste into AWS Console
3. Update production values (JWT secrets, Razorpay LIVE keys, CORS_ORIGIN)
4. If using Google Meet, follow `GOOGLE_PRIVATE_KEY_SETUP.md`
5. Deploy!

Good luck with your deployment! 🚀
