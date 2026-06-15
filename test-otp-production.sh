#!/bin/bash

# OTP Production Diagnostic Script
# Run this on your production server

echo "================================"
echo "OTP DIAGNOSTIC SCRIPT"
echo "================================"
echo ""

# Check 1: Environment Variables
echo "✓ Checking Gallabox Environment Variables..."
if [ -z "$GALLABOX_API_KEY" ]; then
    echo "❌ GALLABOX_API_KEY is NOT SET"
else
    echo "✅ GALLABOX_API_KEY is set: ${GALLABOX_API_KEY:0:10}..."
fi

if [ -z "$GALLABOX_API_SECRET" ]; then
    echo "❌ GALLABOX_API_SECRET is NOT SET"
else
    echo "✅ GALLABOX_API_SECRET is set: ${GALLABOX_API_SECRET:0:10}..."
fi

if [ -z "$GALLABOX_CHANNEL_ID" ]; then
    echo "❌ GALLABOX_CHANNEL_ID is NOT SET"
else
    echo "✅ GALLABOX_CHANNEL_ID is set: $GALLABOX_CHANNEL_ID"
fi

echo ""

# Check 2: Database Connection
echo "✓ Checking Database Connection..."
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is NOT SET"
else
    echo "✅ DATABASE_URL is set"
    # Try to connect
    psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Database connection successful"
    else
        echo "❌ Database connection FAILED"
    fi
fi

echo ""

# Check 3: Backend Process
echo "✓ Checking Backend Process..."
if command -v pm2 &> /dev/null; then
    pm2 list | grep backend
else
    echo "PM2 not found, checking with ps..."
    ps aux | grep node | grep -v grep
fi

echo ""

# Check 4: Recent Backend Logs
echo "✓ Recent Backend Logs (last 20 lines)..."
if command -v pm2 &> /dev/null; then
    pm2 logs backend --lines 20 --nostream
else
    echo "PM2 not found, cannot fetch logs"
fi

echo ""

# Check 5: Test OTP Endpoint
echo "✓ Testing OTP Endpoint..."
response=$(curl -s -X POST http://localhost:5000/api/patient-auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"919876543210"}')

echo "Response: $response"

if echo "$response" | grep -q "success.*true"; then
    echo "✅ OTP endpoint is working"
elif echo "$response" | grep -q "INTERNAL_ERROR"; then
    echo "❌ OTP endpoint returning INTERNAL_ERROR"
    echo "   Check logs above for details"
else
    echo "⚠️ Unexpected response"
fi

echo ""
echo "================================"
echo "DIAGNOSTIC COMPLETE"
echo "================================"
