@echo off
REM Activation script for new implementation files
REM Run this from the backend folder: activate-new-files.bat

echo.
echo 🔄 Activating new implementation files...
echo.

echo 📦 Backing up old files...
if exist src\controllers\patient-auth.controller.ts (
    move src\controllers\patient-auth.controller.ts src\controllers\patient-auth.controller.old.ts >nul 2>&1
    echo   ✓ Backed up patient-auth.controller.ts
)
if exist src\routes\patient-auth.routes.ts (
    move src\routes\patient-auth.routes.ts src\routes\patient-auth.routes.old.ts >nul 2>&1
    echo   ✓ Backed up patient-auth.routes.ts
)
if exist src\services\booking.service.ts (
    move src\services\booking.service.ts src\services\booking.service.old.ts >nul 2>&1
    echo   ✓ Backed up booking.service.ts
)
if exist src\controllers\booking.controller.ts (
    move src\controllers\booking.controller.ts src\controllers\booking.controller.old.ts >nul 2>&1
    echo   ✓ Backed up booking.controller.ts
)
if exist src\routes\booking.routes.ts (
    move src\routes\booking.routes.ts src\routes\booking.routes.old.ts >nul 2>&1
    echo   ✓ Backed up booking.routes.ts
)
if exist src\services\payment.service.ts (
    move src\services\payment.service.ts src\services\payment.service.old.ts >nul 2>&1
    echo   ✓ Backed up payment.service.ts
)
if exist src\controllers\payment.controller.ts (
    move src\controllers\payment.controller.ts src\controllers\payment.controller.old.ts >nul 2>&1
    echo   ✓ Backed up payment.controller.ts
)
if exist src\routes\payment.routes.ts (
    move src\routes\payment.routes.ts src\routes\payment.routes.old.ts >nul 2>&1
    echo   ✓ Backed up payment.routes.ts
)

echo.
echo ✨ Activating new files...

move src\controllers\patient-auth.controller.new.ts src\controllers\patient-auth.controller.ts >nul 2>&1 && echo   ✓ Activated patient-auth.controller.ts
move src\routes\patient-auth.routes.new.ts src\routes\patient-auth.routes.ts >nul 2>&1 && echo   ✓ Activated patient-auth.routes.ts
move src\services\booking.service.new.ts src\services\booking.service.ts >nul 2>&1 && echo   ✓ Activated booking.service.ts
move src\controllers\booking.controller.new.ts src\controllers\booking.controller.ts >nul 2>&1 && echo   ✓ Activated booking.controller.ts
move src\routes\booking.routes.new.ts src\routes\booking.routes.ts >nul 2>&1 && echo   ✓ Activated booking.routes.ts
move src\services\payment.service.new.ts src\services\payment.service.ts >nul 2>&1 && echo   ✓ Activated payment.service.ts
move src\controllers\payment.controller.new.ts src\controllers\payment.controller.ts >nul 2>&1 && echo   ✓ Activated payment.controller.ts
move src\routes\payment.routes.new.ts src\routes\payment.routes.ts >nul 2>&1 && echo   ✓ Activated payment.routes.ts

echo.
echo ✅ All files activated successfully!
echo.
echo 📝 Next steps:
echo   1. Start the backend: npm run dev
echo   2. Test authentication: See STEPS_1_2_COMPLETE.md
echo   3. Test booking: See STEPS_1_2_COMPLETE.md
echo   4. Continue to Step 3: Payment Service
echo.
pause
