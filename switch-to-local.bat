@echo off
REM Switch backend back to local PostgreSQL

echo.
echo ========================================
echo  Switching to Local PostgreSQL
echo ========================================
echo.

REM Check if backup exists
if exist .env.local-backup (
    echo Restoring local database configuration...
    copy /Y .env.local-backup .env >nul
    echo ✓ Local PostgreSQL configuration restored
    echo.
) else (
    echo ✗ Warning: No backup found (.env.local-backup)
    echo.
    echo Creating new local configuration...
    (
        echo PORT=5000
        echo NODE_ENV=development
        echo DATABASE_URL=postgresql://postgres:g20m340i@localhost:5432/mibo-development-db
        echo.
        echo # JWT Configuration
        echo JWT_ACCESS_SECRET=mibo_access_secret_change_in_production_min_32_chars
        echo JWT_REFRESH_SECRET=mibo_refresh_secret_change_in_production_min_32_chars
        echo JWT_ACCESS_EXPIRY=15m
        echo JWT_REFRESH_EXPIRY=7d
        echo.
        echo # OTP Configuration
        echo OTP_EXPIRY_MINUTES=10
        echo.
        echo # Gallabox ^(WhatsApp^) Configuration
        echo GALLABOX_API_KEY=695652f2540814a19bebf8b5
        echo GALLABOX_API_SECRET=edd9fb89a68548d6a7fb080ea8255b1e
        echo GALLABOX_CHANNEL_ID=693a63bfeba0dac02ac3d624
        echo.
        echo # Razorpay Configuration ^(Test Mode^)
        echo RAZORPAY_KEY_ID=rzp_test_Rv16VKPj91R00I
        echo RAZORPAY_KEY_SECRET=lVTIWgJw36ydSFnDeGmaKIBx
        echo.
        echo # CORS Configuration
        echo CORS_ORIGIN=http://localhost:5173
        echo.
        echo # Google Meet Configuration
        echo GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
        echo GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
        echo GOOGLE_CALENDAR_ID=primary
    ) > .env
    echo ✓ Local configuration created
    echo.
)

echo ========================================
echo  Configuration Updated Successfully!
echo ========================================
echo.
echo Database: Local PostgreSQL
echo Host: localhost:5432
echo Database: mibo-development-db
echo.
echo Next steps:
echo 1. Ensure local PostgreSQL is running
echo 2. Run: npm run dev
echo.
echo To switch back to AWS:
echo   Run: switch-to-aws.bat
echo.
pause
