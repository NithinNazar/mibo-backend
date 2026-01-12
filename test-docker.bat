@echo off
REM Test Docker build and run locally

echo.
echo ========================================
echo  Testing Docker Build
echo ========================================
echo.

echo Building Docker image...
docker build -t mibo-backend:test .

if %ERRORLEVEL% NEQ 0 (
    echo ✗ Docker build failed
    pause
    exit /b 1
)

echo ✓ Docker build successful
echo.

echo Starting container...
docker run -d --name mibo-backend-test -p 5000:5000 ^
  -e DATABASE_URL="postgresql://mibo_admin:mibo#aws2026@mibo-postgres.cj00km2acx6s.eu-north-1.rds.amazonaws.com:5432/mibodb?sslmode=require" ^
  -e JWT_ACCESS_SECRET="mibo_access_secret_change_in_production_min_32_chars" ^
  -e JWT_REFRESH_SECRET="mibo_refresh_secret_change_in_production_min_32_chars" ^
  -e GALLABOX_API_KEY="695652f2540814a19bebf8b5" ^
  -e GALLABOX_API_SECRET="edd9fb89a68548d6a7fb080ea8255b1e" ^
  -e GALLABOX_CHANNEL_ID="693a63bfeba0dac02ac3d624" ^
  -e RAZORPAY_KEY_ID="rzp_test_Rv16VKPj91R00I" ^
  -e RAZORPAY_KEY_SECRET="lVTIWgJw36ydSFnDeGmaKIBx" ^
  -e CORS_ORIGIN="*" ^
  mibo-backend:test

if %ERRORLEVEL% NEQ 0 (
    echo ✗ Failed to start container
    pause
    exit /b 1
)

echo ✓ Container started
echo.
echo Waiting for backend to start (30 seconds)...
timeout /t 30 /nobreak >nul

echo.
echo Testing health endpoint...
curl http://localhost:5000/api/health

echo.
echo.
echo ========================================
echo  Container is running!
echo ========================================
echo.
echo View logs: docker logs mibo-backend-test
echo Stop container: docker stop mibo-backend-test
echo Remove container: docker rm mibo-backend-test
echo.
echo Press any key to stop and remove container...
pause >nul

docker stop mibo-backend-test
docker rm mibo-backend-test

echo.
echo ✓ Container stopped and removed
pause
