@echo off
REM Test AWS RDS PostgreSQL connection

echo.
echo ========================================
echo  Testing AWS RDS Connection
echo ========================================
echo.

echo Checking if psql is installed...
where psql >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ✗ psql not found in PATH
    echo.
    echo Please install PostgreSQL client tools:
    echo https://www.postgresql.org/download/windows/
    echo.
    echo Or test using Node.js:
    echo   npm run dev
    echo.
    pause
    exit /b 1
)

echo ✓ psql found
echo.
echo Connecting to AWS RDS...
echo Host: mibo-postgres.cj00km2acx6s.eu-north-1.rds.amazonaws.com
echo Database: mibodb
echo User: mibo_admin
echo.

psql "postgresql://mibo_admin:mibo#aws2026@mibo-postgres.cj00km2acx6s.eu-north-1.rds.amazonaws.com:5432/mibodb?sslmode=require" -c "SELECT version();"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo  ✓ Connection Successful!
    echo ========================================
    echo.
    echo You can now run: npm run dev
    echo.
) else (
    echo.
    echo ========================================
    echo  ✗ Connection Failed
    echo ========================================
    echo.
    echo Possible issues:
    echo 1. Your IP is not allowed in RDS security group
    echo 2. RDS instance is not publicly accessible
    echo 3. Incorrect credentials
    echo 4. Network/firewall blocking connection
    echo.
    echo Check AWS_LOCAL_TESTING_GUIDE.md for troubleshooting
    echo.
)

pause
