#!/bin/bash

# Activation script for new implementation files
# Run this from the backend folder: bash activate-new-files.sh

echo "🔄 Activating new implementation files..."
echo ""

# Backup old files
echo "📦 Backing up old files..."
mv src/controllers/patient-auth.controller.ts src/controllers/patient-auth.controller.old.ts 2>/dev/null && echo "  ✓ Backed up patient-auth.controller.ts"
mv src/routes/patient-auth.routes.ts src/routes/patient-auth.routes.old.ts 2>/dev/null && echo "  ✓ Backed up patient-auth.routes.ts"
mv src/services/booking.service.ts src/services/booking.service.old.ts 2>/dev/null && echo "  ✓ Backed up booking.service.ts"
mv src/controllers/booking.controller.ts src/controllers/booking.controller.old.ts 2>/dev/null && echo "  ✓ Backed up booking.controller.ts"
mv src/routes/booking.routes.ts src/routes/booking.routes.old.ts 2>/dev/null && echo "  ✓ Backed up booking.routes.ts"

echo ""
echo "✨ Activating new files..."

# Activate new files
mv src/controllers/patient-auth.controller.new.ts src/controllers/patient-auth.controller.ts && echo "  ✓ Activated patient-auth.controller.ts"
mv src/routes/patient-auth.routes.new.ts src/routes/patient-auth.routes.ts && echo "  ✓ Activated patient-auth.routes.ts"
mv src/services/booking.service.new.ts src/services/booking.service.ts && echo "  ✓ Activated booking.service.ts"
mv src/controllers/booking.controller.new.ts src/controllers/booking.controller.ts && echo "  ✓ Activated booking.controller.ts"
mv src/routes/booking.routes.new.ts src/routes/booking.routes.ts && echo "  ✓ Activated booking.routes.ts"

echo ""
echo "✅ All files activated successfully!"
echo ""
echo "📝 Next steps:"
echo "  1. Start the backend: npm run dev"
echo "  2. Test authentication: See STEPS_1_2_COMPLETE.md"
echo "  3. Test booking: See STEPS_1_2_COMPLETE.md"
echo "  4. Continue to Step 3: Payment Service"
echo ""
