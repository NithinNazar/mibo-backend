import { Router } from "express";
import authRoutes from "./auth.routes";
import patientAuthRoutes from "./patient-auth.routes";
import bookingRoutes from "./booking.routes";
import patientDashboardRoutes from "./patient-dashboard.routes";
import analyticsRoutes from "./analytics.routes";
import appointmentRoutes from "./appointment.routes";
import centreRoutes from "./centre.routes";
import patientRoutes from "./patient.routes";
import staffRoutes from "./staff.routes";
import videoRoutes from "./video.routes";
import notificationRoutes from "./notification.routes";
import paymentRoutes from "./payment.routes";
import testOtpRoutes from "./test-otp.routes"; // TEST ONLY - Simple OTP without database
import { healthController } from "../controllers/health.controller";
import { ENV } from "../config/env";

const router = Router();

// Health check endpoint
router.get("/health", (req, res, next) =>
  healthController.getHealth(req, res, next),
);

// Root endpoint
router.get("/", (req, res) => {
  res.json({
    message: "Mibo Mental Hospital Chain Backend API",
    version: "1.0.0",
    environment: ENV.NODE_ENV,
    documentation: "See API_DOCUMENTATION.md for detailed API documentation",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      patientAuth: "/api/patient-auth",
      booking: "/api/booking",
      patientDashboard: "/api/patient",
      analytics: "/api/analytics",
      appointments: "/api/appointments",
      centres: "/api/centres",
      patients: "/api/patients",
      users: "/api/users",
      clinicians: "/api/clinicians",
      video: "/api/video",
      notifications: "/api/notifications",
      payments: "/api/payments",
    },
  });
});

// Mount route modules (specific routes before generic ones)
router.use("/auth", authRoutes); // Staff authentication
router.use("/patient-auth", patientAuthRoutes); // Patient authentication (OTP-based)
router.use("/booking", bookingRoutes); // Patient booking flow
router.use("/patient", patientDashboardRoutes); // Patient dashboard
router.use("/analytics", analyticsRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/centres", centreRoutes);
router.use("/patients", patientRoutes); // Staff managing patients
router.use("/users", staffRoutes); // Staff user management
router.use("/clinicians", staffRoutes); // Clinician management (uses same routes file)
router.use("/video", videoRoutes);
router.use("/notifications", notificationRoutes);
router.use("/payments", paymentRoutes); // Standardized to plural

// TEST ONLY - Simple OTP endpoints without database (for testing with dummy data)
if (ENV.NODE_ENV === "development") {
  router.use("/test", testOtpRoutes);
}

export default router;
