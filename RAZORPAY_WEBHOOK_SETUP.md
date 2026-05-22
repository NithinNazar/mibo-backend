# Razorpay Webhook Configuration

## Overview

Added Razorpay webhook secret to enable webhook event handling for payment links.

## Changes Made

### 1. **Local Environment (.env)**

**File**: `backend/.env`

Added webhook secret to Razorpay configuration section:

```env
# Razorpay Configuration (Live Mode)
RAZORPAY_KEY_ID=rzp_live_SV2cgPgjbxBTKL
RAZORPAY_KEY_SECRET=SVArdnuzXO2lwV1dHRQwGWLP
RAZORPAY_WEBHOOK_SECRET=rzpwhsec7Gk9XpL2VaQh8MfT3ZnY6RsB
```

### 2. **Example Environment (.env.example)**

**File**: `backend/.env.example`

Updated template for new developers:

```env
# Razorpay Configuration (Optional - for payments)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
```

### 3. **TypeScript Configuration (env.ts)**

**File**: `backend/src/config/env.ts`

✅ **Already configured** - The webhook secret is already defined in the TypeScript interface:

```typescript
interface EnvironmentConfig {
  // ... other configs
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
  RAZORPAY_WEBHOOK_SECRET: string; // ✅ Already present
  // ... other configs
}
```

And loaded in the validation function:

```typescript
RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || "",
```

---

## Webhook Events Supported

The webhook secret will be used to verify webhook signatures for the following events:

1. **`payment_link.paid`**
   - Triggered when a payment link is successfully paid
   - Use case: Update appointment payment status to "PAID"
   - Update booking confirmation status

2. **`payment_link.expired`**
   - Triggered when a payment link expires without payment
   - Use case: Cancel appointment or mark as "PAYMENT_EXPIRED"
   - Send reminder to patient

---

## Production Deployment

### For Render.com (or similar platforms):

1. **Navigate to Environment Variables**
   - Go to your backend service dashboard
   - Find "Environment" or "Environment Variables" section

2. **Add New Variable**

   ```
   Key: RAZORPAY_WEBHOOK_SECRET
   Value: rzpwhsec7Gk9XpL2VaQh8MfT3ZnY6RsB
   ```

3. **Save and Redeploy**
   - Save the environment variable
   - Trigger a redeploy if not automatic

### For Other Platforms:

**Vercel:**

```bash
vercel env add RAZORPAY_WEBHOOK_SECRET production
# Enter value: rzpwhsec7Gk9XpL2VaQh8MfT3ZnY6RsB
```

**Heroku:**

```bash
heroku config:set RAZORPAY_WEBHOOK_SECRET=rzpwhsec7Gk9XpL2VaQh8MfT3ZnY6RsB
```

**AWS Elastic Beanstalk:**

```bash
eb setenv RAZORPAY_WEBHOOK_SECRET=rzpwhsec7Gk9XpL2VaQh8MfT3ZnY6RsB
```

**Docker:**

```dockerfile
ENV RAZORPAY_WEBHOOK_SECRET=rzpwhsec7Gk9XpL2VaQh8MfT3ZnY6RsB
```

Or in docker-compose.yml:

```yaml
environment:
  - RAZORPAY_WEBHOOK_SECRET=rzpwhsec7Gk9XpL2VaQh8MfT3ZnY6RsB
```

---

## Razorpay Dashboard Configuration

### Step 1: Access Webhook Settings

1. Login to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Navigate to **Settings** → **Webhooks**
3. Click **"+ Add New Webhook"**

### Step 2: Configure Webhook URL

```
Webhook URL: https://api.mibo.care/api/webhooks/razorpay
```

### Step 3: Select Events

Enable the following events:

- ✅ `payment_link.paid`
- ✅ `payment_link.expired`

### Step 4: Set Secret

The secret is already generated and added to your environment:

```
Secret: rzpwhsec7Gk9XpL2VaQh8MfT3ZnY6RsB
```

### Step 5: Activate Webhook

- Click **"Create Webhook"**
- Verify webhook is active
- Test webhook using Razorpay's test feature

---

## Testing Webhooks

### Local Testing with ngrok

1. **Install ngrok** (if not already installed):

   ```bash
   npm install -g ngrok
   ```

2. **Start your backend server**:

   ```bash
   cd backend
   npm run dev
   ```

3. **Start ngrok tunnel**:

   ```bash
   ngrok http 5000
   ```

4. **Copy ngrok URL** (e.g., `https://abc123.ngrok.io`)

5. **Update Razorpay webhook URL** (temporarily):

   ```
   https://abc123.ngrok.io/api/webhooks/razorpay
   ```

6. **Test webhook**:
   - Create a test payment link in Razorpay
   - Complete payment
   - Check your backend logs for webhook event

### Production Testing

1. **Create test payment link** in Razorpay Dashboard
2. **Complete payment** using test card
3. **Verify webhook received**:
   - Check backend logs
   - Verify appointment status updated
   - Verify database records

---

## Webhook Signature Verification

The webhook secret is used to verify that webhook requests are genuinely from Razorpay.

### How It Works:

1. **Razorpay sends webhook** with signature in header:

   ```
   X-Razorpay-Signature: <signature>
   ```

2. **Backend verifies signature** using webhook secret:

   ```typescript
   import crypto from "crypto";

   const expectedSignature = crypto
     .createHmac("sha256", ENV.RAZORPAY_WEBHOOK_SECRET)
     .update(JSON.stringify(req.body))
     .digest("hex");

   if (expectedSignature !== receivedSignature) {
     throw new Error("Invalid webhook signature");
   }
   ```

3. **If signature matches**, process the webhook event
4. **If signature doesn't match**, reject the request (security)

---

## Implementation Checklist

### Backend Developer Tasks:

- [ ] Create webhook endpoint: `POST /api/webhooks/razorpay`
- [ ] Implement signature verification using `RAZORPAY_WEBHOOK_SECRET`
- [ ] Handle `payment_link.paid` event:
  - [ ] Update appointment payment status
  - [ ] Send confirmation email/SMS
  - [ ] Update booking status
- [ ] Handle `payment_link.expired` event:
  - [ ] Cancel appointment or mark as expired
  - [ ] Send reminder to patient
  - [ ] Free up the time slot
- [ ] Add error handling and logging
- [ ] Add webhook event tracking in database
- [ ] Write unit tests for webhook handler
- [ ] Write integration tests

### DevOps Tasks:

- [x] Add `RAZORPAY_WEBHOOK_SECRET` to local .env
- [x] Add `RAZORPAY_WEBHOOK_SECRET` to .env.example
- [ ] Add `RAZORPAY_WEBHOOK_SECRET` to production environment
- [ ] Configure webhook URL in Razorpay Dashboard
- [ ] Test webhook in production
- [ ] Monitor webhook logs

---

## Security Best Practices

### 1. **Always Verify Signature**

Never process webhook events without verifying the signature. This prevents malicious requests.

### 2. **Use HTTPS Only**

Webhook URL must use HTTPS in production:

```
✅ https://api.mibo.care/api/webhooks/razorpay
❌ http://api.mibo.care/api/webhooks/razorpay
```

### 3. **Keep Secret Confidential**

- Never commit webhook secret to Git
- Never log webhook secret
- Never expose in API responses
- Rotate secret if compromised

### 4. **Implement Idempotency**

Razorpay may send the same webhook multiple times. Ensure your handler is idempotent:

```typescript
// Check if event already processed
const existingEvent = await db.query(
  "SELECT * FROM webhook_events WHERE razorpay_event_id = $1",
  [eventId],
);

if (existingEvent) {
  return res.status(200).json({ message: "Event already processed" });
}
```

### 5. **Rate Limiting**

Implement rate limiting on webhook endpoint to prevent abuse.

### 6. **Logging**

Log all webhook events for debugging and audit:

```typescript
logger.info("Webhook received", {
  event: event.event,
  paymentLinkId: event.payload.payment_link.entity.id,
  timestamp: new Date().toISOString(),
});
```

---

## Troubleshooting

### Issue: Webhook signature verification fails

**Possible Causes:**

1. Wrong webhook secret in environment
2. Request body modified before verification
3. Incorrect signature calculation

**Solution:**

```typescript
// Ensure you're using raw body for signature verification
app.use("/api/webhooks/razorpay", express.raw({ type: "application/json" }));
```

### Issue: Webhook not received

**Possible Causes:**

1. Webhook URL not configured in Razorpay
2. Firewall blocking Razorpay IPs
3. Server not running
4. Wrong endpoint URL

**Solution:**

- Verify webhook URL in Razorpay Dashboard
- Check server logs
- Test with ngrok for local development

### Issue: Duplicate webhook events

**Possible Causes:**

1. Razorpay retries on timeout
2. No idempotency check

**Solution:**

- Implement idempotency using event ID
- Return 200 status quickly
- Process webhook asynchronously if needed

---

## Monitoring

### Metrics to Track:

1. **Webhook Success Rate**
   - Total webhooks received
   - Successfully processed
   - Failed processing

2. **Response Time**
   - Average webhook processing time
   - Should be < 5 seconds

3. **Error Rate**
   - Signature verification failures
   - Processing errors
   - Database errors

4. **Event Types**
   - Count of `payment_link.paid` events
   - Count of `payment_link.expired` events

### Logging Example:

```typescript
logger.info("Webhook processed successfully", {
  event: "payment_link.paid",
  paymentLinkId: "plink_xyz",
  appointmentId: 123,
  processingTime: "1.2s",
  timestamp: new Date().toISOString(),
});
```

---

## Next Steps

1. **Backend Developer**: Implement webhook handler endpoint
2. **DevOps**: Add webhook secret to production environment
3. **QA**: Test webhook events in staging
4. **Product**: Configure webhook in Razorpay Dashboard
5. **Monitor**: Track webhook events in production

---

## References

- [Razorpay Webhooks Documentation](https://razorpay.com/docs/webhooks/)
- [Razorpay Payment Links](https://razorpay.com/docs/payments/payment-links/)
- [Webhook Signature Verification](https://razorpay.com/docs/webhooks/validate-test/)

---

**Configuration Date**: May 21, 2026  
**Status**: ✅ Environment Variables Configured  
**Next Action**: Backend developer to implement webhook handler  
**Production Deployment**: Pending (add to production environment)
