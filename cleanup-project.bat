@echo off
echo ========================================
echo Project Cleanup Script
echo ========================================
echo.
echo This will delete:
echo - Test scripts (test-*.js, check-*.js, fix-*.js)
echo - Old documentation (progress tracking, duplicates)
echo - Executed SQL files
echo.
echo Your source code and essential docs will NOT be affected.
echo.
pause

echo.
echo Creating backup...
mkdir ..\backend-cleanup-backup 2>nul
xcopy *.md ..\backend-cleanup-backup\ /Y >nul 2>&1
xcopy *.js ..\backend-cleanup-backup\ /Y >nul 2>&1
xcopy *.sql ..\backend-cleanup-backup\ /Y >nul 2>&1
echo Backup created in: ..\backend-cleanup-backup\
echo.

echo Deleting test scripts...
del /Q test-*.js 2>nul
del /Q check-*.js 2>nul
del /Q fix-*.js 2>nul
del /Q add-google-meet-columns.js 2>nul
del /Q get-clinician-ids.js 2>nul
del /Q populate-database.js 2>nul
del /Q create-admin.js 2>nul
del /Q update-admin-phone.js 2>nul
echo Done!

echo.
echo Deleting old documentation...
del /Q ALL_*.md 2>nul
del /Q STEPS_*.md 2>nul
del /Q STEP_*.md 2>nul
del /Q SETUP_COMPLETE.md 2>nul
del /Q READY_TO_ACTIVATE.md 2>nul
del /Q IMPLEMENTATION_PROGRESS.md 2>nul
del /Q GOOGLE_MEET_TESTS_COMPLETE.md 2>nul
del /Q GOOGLE_MEET_TEST_RESULTS.md 2>nul
del /Q GOOGLE_MEET_FIX_SUMMARY.md 2>nul
del /Q GOOGLE_CREDENTIALS_SETUP.md 2>nul
del /Q SETUP_GOOGLE_CREDENTIALS.md 2>nul
del /Q GOOGLE_MEET_INTEGRATION_SUMMARY.md 2>nul
del /Q GOOGLE_MEET_COMPLETE_SUMMARY.md 2>nul
del /Q TYPESCRIPT_*.md 2>nul
del /Q APPOINTMENT_CANCELLATION_BACKEND_COMPLETE.md 2>nul
del /Q WHATSAPP_CONFIRMATION_SUMMARY.md 2>nul
del /Q BOOKING_CONFIRMATION_WHATSAPP.md 2>nul
del /Q FRONTEND_BACKEND_CONNECTED.md 2>nul
del /Q FRONTEND_INTEGRATION_SUMMARY.md 2>nul
del /Q ADMIN_PANEL_*.md 2>nul
del /Q GALLABOX_FIX_SUMMARY.md 2>nul
echo Done!

echo.
echo Deleting old SQL files...
del /Q add-google-meet-columns.sql 2>nul
del /Q fix-status-column.sql 2>nul
del /Q FIX_DATABASE_SCHEMA.sql 2>nul
del /Q SETUP_TEST_DATA.sql 2>nul
del /Q CREATE_ADMIN.sql 2>nul
del /Q POPULATE_DATABASE.sql 2>nul
echo Done!

echo.
echo Deleting other temp files...
del /Q GALLABOX_CURL_REQUEST.txt 2>nul
echo Done!

echo.
echo ========================================
echo Cleanup Complete!
echo ========================================
echo.
echo Backup location: ..\backend-cleanup-backup\
echo.
echo Remaining files:
dir /B *.md 2>nul
echo.
dir /B *.js 2>nul | findstr /V "node_modules"
echo.
echo Your project is now clean!
echo.
pause
