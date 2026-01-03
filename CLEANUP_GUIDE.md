# Project Cleanup Guide

## ✅ Safe to Delete - Test Scripts

These are temporary test files used during development:

```bash
# Google Meet tests
test-google-meet.js
test-google-meet-creation.js
test-google-meet-automated.js
test-google-meet-simple.js
test-google-meet-status.js
test-google-env.js

# Database tests
check-online-appointments.js
check-appointment-payment.js
test-database-verification.js

# Gallabox tests
test-gallabox.js
test-gallabox-simple.js
test-gallabox-fixed.js
test-gallabox-simple.js

# Other tests
test-booking-flow.js
test-booking-confirmation.js
test-cancellation.js
test-with-otp.js
test-quick.js
test-admin-login.js
test-admin-panel-api.js
test-production-flow.js
test-x-api-key.js
test-new-api-key.js
test-db-connection.js

# Database fix scripts (already executed)
fix-status-column.js
fix-status-constraint.js
fix-status-constraint-v2.js
add-google-meet-columns.js

# Utility scripts (already executed)
get-clinician-ids.js
check-admin-phone.js
update-admin-phone.js
populate-database.js
create-admin.js
```

## ✅ Safe to Delete - Duplicate/Old Documentation

These are progress tracking docs and duplicates:

```bash
# Google Meet duplicates (keep only 1-2 main ones)
GOOGLE_MEET_TESTS_COMPLETE.md
GOOGLE_MEET_TEST_RESULTS.md
GOOGLE_MEET_INTEGRATION_SUMMARY.md
GOOGLE_MEET_COMPLETE_SUMMARY.md
GOOGLE_MEET_FIX_SUMMARY.md
GOOGLE_CREDENTIALS_SETUP.md (duplicate)
SETUP_GOOGLE_CREDENTIALS.md (duplicate)

# Progress tracking (no longer needed)
ALL_PROJECTS_BUILD_SUCCESS.md
ALL_STEPS_COMPLETE.md
STEPS_1_2_COMPLETE.md
STEP_3_COMPLETE.md
STEP_4_COMPLETE.md
SETUP_COMPLETE.md
READY_TO_ACTIVATE.md
IMPLEMENTATION_PROGRESS.md

# Build fix docs (already fixed)
TYPESCRIPT_BUILD_FIX.md
TYPESCRIPT_FIXES_SUMMARY.md
TYPESCRIPT_ERRORS_ANALYSIS.md

# Feature completion docs (already done)
APPOINTMENT_CANCELLATION_BACKEND_COMPLETE.md
WHATSAPP_CONFIRMATION_SUMMARY.md
BOOKING_CONFIRMATION_WHATSAPP.md
FRONTEND_BACKEND_CONNECTED.md
FRONTEND_INTEGRATION_SUMMARY.md
ADMIN_PANEL_BACKEND_STATUS.md
ADMIN_PANEL_READY.md
GALLABOX_FIX_SUMMARY.md

# Old SQL files (already executed)
add-google-meet-columns.sql
fix-status-column.sql
FIX_DATABASE_SCHEMA.sql
SETUP_TEST_DATA.sql
CREATE_ADMIN.sql
POPULATE_DATABASE.sql
```

## ⚠️ KEEP - Important Files

These should stay:

```bash
# Essential documentation
README.md                           # Main project documentation
API_DOCUMENTATION.md                # API reference
TESTING_GUIDE.md                    # How to test
QUICK_START.md                      # Quick start guide
PROJECT_SUMMARY.md                  # Project overview
PROJECT_OVERVIEW.md                 # Project details

# Google Meet (keep 1-2 best ones)
GOOGLE_MEET_INTEGRATION_COMPLETE.md # Complete technical guide
GOOGLE_MEET_QUICK_START.md          # Quick reference
GOOGLE_CREDENTIALS_FINAL_SETUP.md   # Credentials setup

# Deployment
PRODUCTION_IMPLEMENTATION_PLAN.md   # Production deployment plan
ACTIVATION_CHECKLIST.md             # Pre-launch checklist
NEXT_STEPS.md                       # What to do next

# Setup
SETUP_GUIDE.md                      # Initial setup
CREDENTIALS.md                      # Credentials reference

# Database
CHECK_DATABASE.sql                  # Database verification queries
current_db_schema.txt               # Schema reference

# Testing
api-requests.http                   # API testing (useful)
api-requests-production.http        # Production API tests

# Scripts (keep useful ones)
activate-new-files.bat              # Activation script
activate-new-files.sh               # Activation script
```

## 🗂️ Recommended Structure

After cleanup, your backend folder should have:

```
backend/
├── src/                    # Source code (keep all)
├── dist/                   # Compiled code (keep)
├── node_modules/           # Dependencies (keep)
├── .env                    # Environment variables (keep)
├── .env.example            # Example env (keep)
├── .gitignore              # Git ignore (keep)
├── package.json            # Dependencies (keep)
├── tsconfig.json           # TypeScript config (keep)
├── README.md               # Main docs (keep)
├── API_DOCUMENTATION.md    # API docs (keep)
├── QUICK_START.md          # Quick start (keep)
├── TESTING_GUIDE.md        # Testing guide (keep)
├── GOOGLE_MEET_INTEGRATION_COMPLETE.md  # Google Meet docs (keep)
├── GOOGLE_CREDENTIALS_FINAL_SETUP.md    # Credentials setup (keep)
├── api-requests.http       # API testing (keep)
└── clinic-booking-system-*.json  # Google credentials (keep, not in git)
```

## 🧹 Cleanup Commands

### Option 1: Delete All Test Files

```bash
cd backend

# Delete test scripts
rm test-*.js
rm check-*.js
rm fix-*.js
rm add-google-meet-columns.js
rm get-clinician-ids.js
rm populate-database.js
rm create-admin.js
rm update-admin-phone.js
```

### Option 2: Delete Old Documentation

```bash
# Delete progress tracking docs
rm ALL_*.md
rm STEPS_*.md
rm STEP_*.md
rm SETUP_COMPLETE.md
rm READY_TO_ACTIVATE.md
rm IMPLEMENTATION_PROGRESS.md

# Delete duplicate Google Meet docs (keep the main ones)
rm GOOGLE_MEET_TESTS_COMPLETE.md
rm GOOGLE_MEET_TEST_RESULTS.md
rm GOOGLE_MEET_FIX_SUMMARY.md
rm GOOGLE_CREDENTIALS_SETUP.md
rm SETUP_GOOGLE_CREDENTIALS.md

# Delete build fix docs
rm TYPESCRIPT_*.md

# Delete feature completion docs
rm APPOINTMENT_CANCELLATION_BACKEND_COMPLETE.md
rm WHATSAPP_CONFIRMATION_SUMMARY.md
rm BOOKING_CONFIRMATION_WHATSAPP.md
rm FRONTEND_BACKEND_CONNECTED.md
rm FRONTEND_INTEGRATION_SUMMARY.md
rm ADMIN_PANEL_*.md
rm GALLABOX_FIX_SUMMARY.md
```

### Option 3: Delete Old SQL Files

```bash
# Delete executed SQL files
rm add-google-meet-columns.sql
rm fix-status-column.sql
rm FIX_DATABASE_SCHEMA.sql
rm SETUP_TEST_DATA.sql
rm CREATE_ADMIN.sql
rm POPULATE_DATABASE.sql
```

### Option 4: All at Once (Recommended)

```bash
cd backend

# Create a backup first (optional)
mkdir ../backend-backup-docs
cp *.md ../backend-backup-docs/
cp *.js ../backend-backup-docs/
cp *.sql ../backend-backup-docs/

# Delete test files
rm test-*.js check-*.js fix-*.js add-google-meet-columns.js get-clinician-ids.js populate-database.js create-admin.js update-admin-phone.js

# Delete old docs
rm ALL_*.md STEPS_*.md STEP_*.md SETUP_COMPLETE.md READY_TO_ACTIVATE.md IMPLEMENTATION_PROGRESS.md
rm GOOGLE_MEET_TESTS_COMPLETE.md GOOGLE_MEET_TEST_RESULTS.md GOOGLE_MEET_FIX_SUMMARY.md GOOGLE_CREDENTIALS_SETUP.md SETUP_GOOGLE_CREDENTIALS.md GOOGLE_MEET_INTEGRATION_SUMMARY.md GOOGLE_MEET_COMPLETE_SUMMARY.md
rm TYPESCRIPT_*.md
rm APPOINTMENT_CANCELLATION_BACKEND_COMPLETE.md WHATSAPP_CONFIRMATION_SUMMARY.md BOOKING_CONFIRMATION_WHATSAPP.md FRONTEND_BACKEND_CONNECTED.md FRONTEND_INTEGRATION_SUMMARY.md ADMIN_PANEL_*.md GALLABOX_FIX_SUMMARY.md

# Delete old SQL
rm add-google-meet-columns.sql fix-status-column.sql FIX_DATABASE_SCHEMA.sql SETUP_TEST_DATA.sql CREATE_ADMIN.sql POPULATE_DATABASE.sql

# Delete other temp files
rm GALLABOX_CURL_REQUEST.txt
```

## ✅ After Cleanup

Your project will be much cleaner with only essential files:

**Documentation** (5-8 files):

- README.md
- API_DOCUMENTATION.md
- QUICK_START.md
- TESTING_GUIDE.md
- GOOGLE_MEET_INTEGRATION_COMPLETE.md
- GOOGLE_CREDENTIALS_FINAL_SETUP.md
- PROJECT_SUMMARY.md

**Testing** (2 files):

- api-requests.http
- api-requests-production.http

**Database** (2 files):

- CHECK_DATABASE.sql
- current_db_schema.txt

**Everything else** is in `src/` folder where it belongs!

## 🔒 Safety Check

Before deleting, verify:

```bash
# Check if any test files are imported in src/
grep -r "test-" src/
grep -r "check-" src/
grep -r "fix-" src/

# Should return nothing or only comments
```

## 📝 Commit After Cleanup

```bash
git add .
git commit -m "Clean up test files and duplicate documentation"
git push
```

---

**Recommendation**: Delete all test files and old docs. Keep only the essential documentation listed above. Your app will work exactly the same!
