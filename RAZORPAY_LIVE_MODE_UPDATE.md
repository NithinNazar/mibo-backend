# Razorpay Live Mode Update

## ✅ Changes Made

Updated Razorpay keys from **Test Mode** to **Live Mode** in all configuration files.

### New Live Mode Credentials:

- **Key ID:** `rzp_live_SV2cgPgjbxBTKL`
- **Key Secret:** `SVArdnuzXO2lwV1dHRQwGWLP`

---

## Files Updated:

### 1. Local Development

- ✅ `backend/.env` - Updated to live keys
- ✅ `backend/.env.aws-local-test` - Updated to live keys

### 2. AWS Deployment Files

- ✅ `backend/AWS_ENVIRONMENT_VARIABLES.txt` - Updated to live keys
- ✅ `backend/AWS_ENV_COPY_PASTE.txt` - Updated to live keys
- ✅ `backend/AWS_ENVIRONMENT_VARIABLES_KEY_VALUE.json` - Updated to live keys

### 3. Code Verification

- ✅ No hardcoded keys found in source code
- ✅ All keys are loaded from environment variables
- ✅ Code uses `process.env.RAZORPAY_KEY_ID` and `process.env.RAZORPAY_KEY_SECRET`

---

## ⚠️ IMPORTANT: Update AWS Environment Variables

The local files have been updated, but you MUST also update the environment variables on AWS:

### Option 1: AWS Console (Recommended)

1. Go to AWS Elastic Beanstalk Console
2. Select your application
3. Go to **Configuration** → **Software** → **Edit**
4. Update these two variables:
   - `RAZORPAY_KEY_ID` = `rzp_live_SV2cgPgjbxBTKL`
   - `RAZORPAY_KEY_SECRET` = `SVArdnuzXO2lwV1dHRQwGWLP`
5. Click **Apply**
6. Wait for environment to restart

### Option 2: AWS CLI

```bash
aws elasticbeanstalk update-environment \
  --environment-name your-env-name \
  --option-settings \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=RAZORPAY_KEY_ID,Value=rzp_live_SV2cgPgjbxBTKL \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=RAZORPAY_KEY_SECRET,Value=SVArdnuzXO2lwV1dHRQwGWLP
```

---

## 🧪 Testing Live Mode

### Test Payment Flow:

1. Login to your application
2. Book an appointment
3. Proceed to payment
4. Use a REAL card (live mode doesn't accept test cards)
5. Complete payment
6. Verify payment appears in Razorpay Dashboard (Live Mode)

### Test Cards (Will NOT work in Live Mode):

- ❌ 4111 1111 1111 1111 (Test card)
- ❌ 5555 5555 5555 4444 (Test card)

### Real Cards (Will work in Live Mode):

- ✅ Your actual debit/credit card
- ✅ UPI payments
- ✅ Net banking

---

## 🔒 Security Notes

1. **Never commit live keys to Git**
   - Keys are in `.env` which is in `.gitignore`
   - Safe to keep locally

2. **AWS Environment Variables are secure**
   - Stored encrypted on AWS
   - Not visible in logs
   - Only accessible to your application

3. **Rotate keys if compromised**
   - Generate new keys from Razorpay Dashboard
   - Update all files and AWS environment variables
   - Old keys will stop working immediately

---

## 📊 Razorpay Dashboard

### Live Mode Dashboard:

- URL: https://dashboard.razorpay.com/
- Switch to **Live Mode** (toggle in top-right)
- View real transactions, settlements, refunds

### What to Monitor:

- ✅ Payment success rate
- ✅ Failed payments (check reasons)
- ✅ Settlement schedule (T+3 days typically)
- ✅ Refunds and disputes

---

## 🚨 Rollback to Test Mode (If Needed)

If you need to switch back to test mode:

1. Update environment variables:
   - `RAZORPAY_KEY_ID` = `rzp_test_Rv16VKPj91R00I`
   - `RAZORPAY_KEY_SECRET` = `lVTIWgJw36ydSFnDeGmaKIBx`

2. Restart application

3. Test cards will work again

---

## ✅ Checklist

Before going live with payments:

- [ ] Updated all local `.env` files
- [ ] Updated AWS environment variables
- [ ] Restarted AWS application
- [ ] Tested payment flow with real card
- [ ] Verified payment in Razorpay Live Dashboard
- [ ] Checked webhook configuration (if using webhooks)
- [ ] Verified refund flow works
- [ ] Set up payment failure alerts
- [ ] Documented payment flow for support team

---

## 📞 Support

If payments fail in live mode:

1. Check Razorpay Dashboard for error details
2. Check AWS CloudWatch logs for backend errors
3. Verify keys are correctly set in AWS environment
4. Contact Razorpay support if needed

---

**Status:** ✅ Configuration files updated. AWS environment variables need manual update.
