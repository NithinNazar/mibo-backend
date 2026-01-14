# AWS Environment Variables - Complete List

## How to Use This File

Copy the Key-Value pairs below and paste them into:

- **AWS Elastic Beanstalk:** Configuration > Software > Environment properties
- **AWS ECS/Fargate:** Task Definition > Environment variables
- **AWS App Runner:** Configuration > Environment variables

---

## Environment Variables Table

| Key                            | Value                                                                                                        | Category    | Required    | Description                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------ | ----------- | ----------- | --------------------------------------------------- |
| `NODE_ENV`                     | `production`                                                                                                 | Server      | ✅ Yes      | Node.js environment mode                            |
| `PORT`                         | `5000`                                                                                                       | Server      | ⚠️ Optional | Server port (AWS overrides this)                    |
| `DATABASE_URL`                 | `postgresql://mibo_admin:mibo%23aws2026@mibo-postgres.cj00km2acx6s.eu-north-1.rds.amazonaws.com:5432/mibodb` | Database    | ✅ Yes      | AWS RDS PostgreSQL connection string                |
| `JWT_ACCESS_SECRET`            | `mibo_access_secret_change_in_production_min_32_chars`                                                       | Security    | ✅ Yes      | JWT access token secret (min 32 chars)              |
| `JWT_REFRESH_SECRET`           | `mibo_refresh_secret_change_in_production_min_32_chars`                                                      | Security    | ✅ Yes      | JWT refresh token secret (min 32 chars)             |
| `JWT_ACCESS_EXPIRY`            | `15m`                                                                                                        | Security    | ✅ Yes      | JWT access token expiry time                        |
| `JWT_REFRESH_EXPIRY`           | `7d`                                                                                                         | Security    | ✅ Yes      | JWT refresh token expiry time                       |
| `OTP_EXPIRY_MINUTES`           | `10`                                                                                                         | Security    | ✅ Yes      | OTP expiration time in minutes                      |
| `GALLABOX_API_KEY`             | `695652f2540814a19bebf8b5`                                                                                   | WhatsApp    | ✅ Yes      | Gallabox API key for WhatsApp                       |
| `GALLABOX_API_SECRET`          | `edd9fb89a68548d6a7fb080ea8255b1e`                                                                           | WhatsApp    | ✅ Yes      | Gallabox API secret                                 |
| `GALLABOX_CHANNEL_ID`          | `693a63bfeba0dac02ac3d624`                                                                                   | WhatsApp    | ✅ Yes      | Gallabox WhatsApp channel ID                        |
| `RAZORPAY_KEY_ID`              | `rzp_test_Rv16VKPj91R00I`                                                                                    | Payment     | ✅ Yes      | Razorpay API key ID                                 |
| `RAZORPAY_KEY_SECRET`          | `lVTIWgJw36ydSFnDeGmaKIBx`                                                                                   | Payment     | ✅ Yes      | Razorpay API secret                                 |
| `CORS_ORIGIN`                  | `https://your-frontend-domain.com`                                                                           | Security    | ✅ Yes      | Allowed CORS origin (frontend URL)                  |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `your-service-account@project.iam.gserviceaccount.com`                                                       | Google Meet | ⚠️ Optional | Google service account email                        |
| `GOOGLE_PRIVATE_KEY`           | `-----BEGIN PRIVATE KEY-----\nYOUR_KEY_CONTENT\n-----END PRIVATE KEY-----\n`                                 | Google Meet | ⚠️ Optional | Google service account private key (see note below) |
| `GOOGLE_CALENDAR_ID`           | `primary`                                                                                                    | Google Meet | ⚠️ Optional | Google Calendar ID                                  |

---

## Copy-Paste Format for AWS Console

### Format 1: Key-Value Pairs (One per line)

```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://mibo_admin:mibo%23aws2026@mibo-postgres.cj00km2acx6s.eu-north-1.rds.amazonaws.com:5432/mibodb
JWT_ACCESS_SECRET=mibo_access_secret_change_in_production_min_32_chars
JWT_REFRESH_SECRET=mibo_refresh_secret_change_in_production_min_32_chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
OTP_EXPIRY_MINUTES=10
GALLABOX_API_KEY=695652f2540814a19bebf8b5
GALLABOX_API_SECRET=edd9fb89a68548d6a7fb080ea8255b1e
GALLABOX_CHANNEL_ID=693a63bfeba0dac02ac3d624
RAZORPAY_KEY_ID=rzp_test_Rv16VKPj91R00I
RAZORPAY_KEY_SECRET=lVTIWgJw36ydSFnDeGmaKIBx
CORS_ORIGIN=https://your-frontend-domain.com
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_CONTENT_HERE\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=primary
```

**⚠️ IMPORTANT - GOOGLE_PRIVATE_KEY Format:**

The `GOOGLE_PRIVATE_KEY` should contain **ONLY the `private_key` field** from your Google service account JSON file.

**Step-by-step:**

1. Download your Google service account JSON file from Google Cloud Console
2. Open the JSON file - it looks like this:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service-account@project.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

3. **Copy ONLY the value of the `private_key` field** (the entire string including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)
4. The key should contain `\n` characters (literal backslash-n, not actual newlines)
5. Wrap the entire value in quotes when setting in AWS

**Example:**

```
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

**What NOT to do:**

- ❌ Don't paste the entire JSON file
- ❌ Don't remove the `\n` characters
- ❌ Don't add actual line breaks (keep it as one line with `\n`)

**Why:** The code automatically converts `\n` to actual newlines when loading the key.

---

## Important Notes

### 🔒 Security - MUST CHANGE Before Production:

1. **JWT Secrets:**

   ```bash
   # Generate new secrets (32+ characters)
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Replace:

   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`

2. **Razorpay:**

   - Currently using **TEST MODE** keys
   - Switch to **LIVE MODE** keys for production
   - Get from: https://dashboard.razorpay.com/app/keys

3. **CORS Origin:**
   - Replace `https://your-frontend-domain.com` with your actual frontend URL
   - Examples:
     - `https://mibo.com`
     - `https://app.mibo.com`
     - `https://mibo-frontend.vercel.app`

### 📝 Database URL Format:

```
postgresql://username:password@host:port/database
```

**Current:**

- Username: `mibo_admin`
- Password: `mibo#aws2026` (URL-encoded as `mibo%23aws2026`)
- Host: `mibo-postgres.cj00km2acx6s.eu-north-1.rds.amazonaws.com`
- Port: `5432`
- Database: `mibodb`

**Note:** The `#` character in password is URL-encoded as `%23`

### ⚠️ Optional Variables:

**Google Meet Integration:**

- Only needed if you want online consultation links
- Can be left empty or removed if not using
- Requires Google Cloud Platform setup

---

## AWS Elastic Beanstalk - Step by Step

1. **Go to AWS Console**
2. **Navigate to:** Elastic Beanstalk > Your Environment
3. **Click:** Configuration
4. **Click:** Software > Edit
5. **Scroll to:** Environment properties
6. **Add each variable:**
   - Click "Add environment property"
   - Enter Key (e.g., `NODE_ENV`)
   - Enter Value (e.g., `production`)
   - Repeat for all variables
7. **Click:** Apply

---

## AWS ECS/Fargate - Task Definition

```json
{
  "containerDefinitions": [
    {
      "environment": [
        { "name": "NODE_ENV", "value": "production" },
        { "name": "PORT", "value": "5000" },
        { "name": "DATABASE_URL", "value": "postgresql://..." },
        { "name": "JWT_ACCESS_SECRET", "value": "..." },
        { "name": "JWT_REFRESH_SECRET", "value": "..." },
        { "name": "JWT_ACCESS_EXPIRY", "value": "15m" },
        { "name": "JWT_REFRESH_EXPIRY", "value": "7d" },
        { "name": "OTP_EXPIRY_MINUTES", "value": "10" },
        { "name": "GALLABOX_API_KEY", "value": "..." },
        { "name": "GALLABOX_API_SECRET", "value": "..." },
        { "name": "GALLABOX_CHANNEL_ID", "value": "..." },
        { "name": "RAZORPAY_KEY_ID", "value": "..." },
        { "name": "RAZORPAY_KEY_SECRET", "value": "..." },
        { "name": "CORS_ORIGIN", "value": "https://..." }
      ]
    }
  ]
}
```

---

## AWS Secrets Manager (Recommended for Production)

For sensitive values, use AWS Secrets Manager:

```bash
# Create secrets
aws secretsmanager create-secret \
  --name mibo/jwt-access-secret \
  --secret-string "your-production-secret" \
  --region eu-north-1

aws secretsmanager create-secret \
  --name mibo/jwt-refresh-secret \
  --secret-string "your-production-secret" \
  --region eu-north-1

aws secretsmanager create-secret \
  --name mibo/database-url \
  --secret-string "postgresql://..." \
  --region eu-north-1
```

Then reference in ECS Task Definition:

```json
{
  "secrets": [
    {
      "name": "JWT_ACCESS_SECRET",
      "valueFrom": "arn:aws:secretsmanager:eu-north-1:ACCOUNT:secret:mibo/jwt-access-secret"
    }
  ]
}
```

---

## Verification Checklist

Before deploying, verify:

- [ ] ✅ All required variables are set
- [ ] ✅ JWT secrets are changed (production)
- [ ] ✅ Razorpay keys are LIVE mode (production)
- [ ] ✅ CORS_ORIGIN matches frontend URL
- [ ] ✅ DATABASE_URL points to AWS RDS
- [ ] ✅ Database password is URL-encoded
- [ ] ✅ Gallabox credentials are correct
- [ ] ✅ No sensitive data in source code
- [ ] ✅ Environment variables are not committed to git

---

## Testing Environment Variables

After deployment, test:

```bash
# Check if variables are loaded
curl https://your-backend-url/api/health

# Should return:
{
  "status": "ok",
  "timestamp": "..."
}
```

---

## Troubleshooting

### Issue: Database connection fails

**Check:**

- DATABASE_URL is correct
- Password is URL-encoded (`#` → `%23`)
- RDS security group allows connections
- RDS is publicly accessible (or in same VPC)

### Issue: CORS errors

**Check:**

- CORS_ORIGIN matches frontend URL exactly
- Include protocol (https://)
- No trailing slash

### Issue: JWT errors

**Check:**

- JWT_ACCESS_SECRET is set
- JWT_REFRESH_SECRET is set
- Both are at least 32 characters

### Issue: WhatsApp not working

**Check:**

- GALLABOX_API_KEY is correct
- GALLABOX_API_SECRET is correct
- GALLABOX_CHANNEL_ID is correct
- Gallabox account is active

---

## Summary

**Total Variables:** 17
**Required:** 14
**Optional:** 3 (Google Meet)

**Files Created:**

1. `AWS_ENVIRONMENT_VARIABLES.txt` - Plain text format
2. `AWS_ENVIRONMENT_VARIABLES_KEY_VALUE.json` - JSON format
3. `AWS_ENVIRONMENT_VARIABLES_TABLE.md` - This file (detailed guide)

**Next Steps:**

1. Review all variables
2. Change JWT secrets for production
3. Switch Razorpay to live mode
4. Update CORS_ORIGIN
5. Copy-paste into AWS Console
6. Deploy and test

---

**Last Updated:** January 12, 2026
**Status:** ✅ Ready for AWS Deployment
