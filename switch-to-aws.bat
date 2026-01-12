@echo off
REM Switch backend to AWS RDS for local testing

echo.
echo ========================================
echo  Switching to AWS RDS Configuration
echo ========================================
echo.

REM Backup current .env if it exists
if exist .env (
    echo Creating backup of current .env...
    copy /Y .env .env.local-backup >nul
    echo ✓ Backup created: .env.local-backup
    echo.
)

REM Copy AWS configuration
if exist .env.aws-local-test (
    echo Copying AWS RDS configuration...
    copy /Y .env.aws-local-test .env >nul
    echo ✓ AWS RDS configuration activated
    echo.
) else (
    echo ✗ Error: .env.aws-local-test not found
    echo   Please ensure the file exists
    exit /b 1
)

echo ========================================
echo  Configuration Updated Successfully!
echo ========================================
echo.
echo Database: AWS RDS PostgreSQL
echo Host: mibo-postgres.cj00km2acx6s.eu-north-1.rds.amazonaws.com
echo Database: mibodb
echo SSL: Required
echo.
echo Next steps:
echo 1. Ensure your IP is allowed in RDS security group
echo 2. Run: npm run dev
echo 3. Test API endpoints
echo.
echo To restore local database:
echo   Run: switch-to-local.bat
echo.
pause
