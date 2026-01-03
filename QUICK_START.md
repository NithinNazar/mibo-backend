# 🚀 Quick Start Guide

## ✅ Everything is Ready!

All three applications are now running and fully integrated:

---

## 🌐 Access URLs

| Application          | URL                                | Status     |
| -------------------- | ---------------------------------- | ---------- |
| **Backend API**      | http://localhost:5000              | ✅ Running |
| **Admin Panel**      | http://localhost:5174              | ✅ Running |
| **Patient Frontend** | http://localhost:5173/mibo-alt-v2/ | ✅ Running |

---

## 🔐 Test Credentials

### Admin Panel Login

- **URL**: http://localhost:5174
- **Username**: `admin`
- **Password**: `Admin@123`

### Patient Booking

- **Phone**: `9048810697` (has WhatsApp for OTP)
- **Test Card**: `4111 1111 1111 1111`
- **CVV**: Any 3 digits
- **Expiry**: Any future date

---

## 🧪 Quick Test Flow

### 1. Test Patient Booking (5 minutes)

1. **Go to Frontend**

   - Open: http://localhost:5173/mibo-alt-v2/
   - Click "Book Appointment" or go to Experts page

2. **Select Doctor**

   - Choose any doctor from the list
   - Click "Book Appointment"

3. **Choose Appointment Details**

   - Select consultation type: Online or In-Person
   - Select date and time
   - Click "Continue"

4. **Phone Verification**

   - Enter phone: `9048810697`
   - Click "Send OTP"
   - Check WhatsApp for OTP
   - Enter OTP
   - Enter name: "Test User"
   - Enter email (optional): "test@example.com"
   - Click "Verify & Continue"

5. **Confirm Booking**

   - Review booking details
   - Click "Confirm & Pay"
   - Razorpay modal opens
   - Enter test card: `4111 1111 1111 1111`
   - Complete payment
   - ✅ Success! Redirected to dashboard

6. **Check Dashboard**
   - Should see your new appointment
   - Should see payment in payment history

---

### 2. Test Admin Panel (2 minutes)

1. **Login to Admin Panel**

   - Open: http://localhost:5174
   - Username: `admin`
   - Password: `Admin@123`

2. **View Dashboard**

   - Should see real metrics:
     - Total Patients: 1+
     - Active Doctors: 23
     - Total Appointments: 1+
   - Should see top doctors list
   - Should see revenue data

3. **View Doctors**

   - Click "Clinicians" in sidebar
   - Should see all 23 doctors
   - Can filter by centre

4. **View Centres**
   - Click "Centres" in sidebar
   - Should see 3 centres:
     - Mibo Bangalore
     - Mibo Kochi
     - Mibo Mumbai

---

## 📊 What's in the Database

### Doctors (23 total)

- **Bangalore**: 16 doctors
- **Kochi**: 6 doctors
- **Mumbai**: 1 doctor
- **Consultation Fee**: ₹1,600 each
- **Availability**: Monday-Friday, 9 AM - 6 PM

### Centres (3 total)

- Mibo Bangalore
- Mibo Kochi
- Mibo Mumbai

### Patients

- Will be created when users book appointments

---

## 🔧 If Something Doesn't Work

### Backend Not Responding

```bash
cd backend
npm run dev
```

### Frontend Not Loading

```bash
cd mibo_version-2
npm run dev
```

### Admin Panel Not Loading

```bash
cd mibo-admin
npm run dev
```

### Database Issues

```bash
cd backend
node check-admin-phone.js  # Check admin user
node populate-database.js  # Re-populate doctors
```

---

## 📝 Important Notes

### Google Meet Integration

- ⚠️ Google service account keys not configured
- ✅ Online bookings still work without it
- ✅ Dashboard shows "Online" mode
- ✅ No errors or broken flow
- 💡 Add keys later to enable video links

### WhatsApp OTP

- ✅ Fully working via Gallabox
- ✅ OTP sent to phone: 9048810697
- ✅ Check WhatsApp for OTP code

### Payment

- ✅ Razorpay test mode enabled
- ✅ Use test card: 4111 1111 1111 1111
- ✅ All payments are test transactions

---

## 📚 Documentation

| Document                                      | Purpose                     |
| --------------------------------------------- | --------------------------- |
| `QUICK_START.md`                              | This file - Quick reference |
| `FRONTEND_BACKEND_CONNECTED.md`               | Integration summary         |
| `mibo_version-2/test-frontend-integration.md` | Complete testing guide      |
| `backend/API_DOCUMENTATION.md`                | API reference               |
| `backend/CREDENTIALS.md`                      | All credentials             |

---

## 🎯 Next Steps

1. ✅ **Test the booking flow** (follow steps above)
2. ✅ **Test the admin panel** (follow steps above)
3. ⏳ **Add Google Meet credentials** (optional)
4. ⏳ **Configure production environment**
5. ⏳ **Deploy to production**

---

## 🆘 Need Help?

### Check Logs

**Backend**:

```bash
# Backend logs show in terminal where you ran npm run dev
# Look for:
# - OTP sent messages
# - Appointment created messages
# - Payment verified messages
```

**Frontend**:

```bash
# Open browser console (F12)
# Look for:
# - API call responses
# - Error messages
# - Network tab for failed requests
```

### Common Issues

**"Please login first"**

- Complete OTP verification first
- Check localStorage for tokens

**"Failed to create appointment"**

- Check backend is running
- Check database connection
- Check doctor/centre IDs are valid

**"Payment gateway not loaded"**

- Refresh page
- Check Razorpay script loaded

---

## ✅ System Status

| Component        | Status                       |
| ---------------- | ---------------------------- |
| Backend API      | ✅ Running on port 5000      |
| Admin Panel      | ✅ Running on port 5174      |
| Patient Frontend | ✅ Running on port 5173      |
| Database         | ✅ PostgreSQL connected      |
| WhatsApp OTP     | ✅ Gallabox working          |
| Payment          | ✅ Razorpay test mode        |
| Google Meet      | ⚠️ Optional (not configured) |

---

## 🎉 You're All Set!

Everything is connected and ready to use. Start testing the booking flow!

**Test Phone**: 9048810697  
**Test Card**: 4111 1111 1111 1111

---

**Last Updated**: January 3, 2026
**Status**: ✅ ALL SYSTEMS OPERATIONAL
