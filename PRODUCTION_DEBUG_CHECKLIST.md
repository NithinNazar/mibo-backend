# Production Debug Checklist - Profile Completion Error

## ✅ CONFIRMED:

- ✅ `date_of_birth` column EXISTS in production database
- ✅ Local backend code has dateOfBirth handling
- ✅ Frontend sends correct date format (YYYY-MM-DD)

## 🔍 ISSUES TO CHECK:

### 1. **Production Backend Not Restarted**

After deploying the backend code changes, did you restart the backend server?

**Check & Fix:**

```bash
# SSH to production server
pm2 restart backend
# OR
pm2 reload backend
# OR
systemctl restart backend-service
```

---

### 2. **Production Backend Has Old Code**

The deployed backend might have the old controller code without dateOfBirth handling.

**Check:**

```bash
# SSH to production server
cd /path/to/backend
cat src/controllers/patient-dashboard.controller.ts | grep -A 5 "dateOfBirth"
```

**Expected to see:**

```typescript
if (dateOfBirth) profileUpdates.date_of_birth = new Date(dateOfBirth);
```

**If NOT present:**

- Re-deploy backend
- Make sure you committed and pushed the changes
- Pull latest code on server

---

### 3. **Check Production Backend Logs**

The error message "Failed to update profile" is generic. The real error is in the logs.

**Check logs:**

```bash
# If using PM2
pm2 logs backend --lines 100 | grep -i "error\|profile"

# If using Docker
docker logs backend-container --tail 100 | grep -i "error\|profile"

# If using systemd
journalctl -u backend-service -n 100 | grep -i "error\|profile"
```

**Look for:**

- Database connection errors
- SQL errors related to date_of_birth column
- TypeError or ReferenceError
- Any stack traces

---

### 4. **Test Production API Directly**

Test the endpoint directly to see the actual error response.

**Using curl:**

```bash
curl -X PUT https://api.mibo.care/api/patient/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACTUAL_TOKEN" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "dateOfBirth": "1994-03-18",
    "age": 32,
    "gender": "MALE"
  }'
```

**Expected Success Response:**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": { ... },
    "profile": { ... }
  }
}
```

**Error Response (example):**

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Actual error message here"
  }
}
```

---

### 5. **Check Browser Console for Full Error**

In your browser (where you're testing):

1. Open Chrome DevTools (F12)
2. Go to **Console** tab
3. Clear console
4. Submit the form
5. Look for the full error object

**Look for:**

- `console.error("Profile completion error:", err);`
- The actual error message from backend
- Network request details

---

### 6. **Check Network Tab for Response**

1. Open Chrome DevTools (F12)
2. Go to **Network** tab
3. Submit the form
4. Click on the failed `profile` request
5. Go to **Response** tab
6. Copy the full error response

**Share the response with me and I can identify the exact issue!**

---

## 🚀 MOST LIKELY FIX:

Based on the symptoms, the issue is most likely:

### **Production backend not restarted after deployment**

**Solution:**

```bash
# SSH to production server
pm2 restart backend

# Verify it's using the new code
pm2 logs backend --lines 20
```

---

## 📝 QUICK DEBUG STEPS:

1. **SSH to production server**
2. **Check if backend has latest code:**

   ```bash
   grep -n "dateOfBirth" src/controllers/patient-dashboard.controller.ts
   ```

   Should show line with: `if (dateOfBirth) profileUpdates.date_of_birth`

3. **Restart backend:**

   ```bash
   pm2 restart backend
   ```

4. **Check logs for errors:**

   ```bash
   pm2 logs backend --lines 50
   ```

5. **Test form again on frontend**

---

## 🆘 IF STILL FAILING:

**Send me:**

1. Production backend logs (last 50 lines)
2. Browser console error (full error object)
3. Network tab response (Response tab content)

I'll identify the exact issue immediately!
