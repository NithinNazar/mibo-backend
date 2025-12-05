import { Router } from "express";
import authRoutes from "./auth.routes";
import analyticsRoutes from "./analytics.routes";
import appointmentRoutes from "./appointment.routes";
import centreRoutes from "./centre.routes";
import patientRoutes from "./patient.routes";
import staffRoutes from "./staff.routes";
import videoRoutes from "./video.routes";
import notificationRoutes from "./notification.routes";
import paymentRoutes from "./payment.routes";
import { healthController } from "../controllers/health.controller";
import { ENV } from "../config/env";

const router = Router();

// Health check endpoint
router.get("/health", (req, res, next) =>
  healthController.getHealth(req, res, next)
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
router.use("/auth", authRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/centres", centreRoutes);
router.use("/patients", patientRoutes);
router.use("/users", staffRoutes); // Staff user management
router.use("/clinicians", staffRoutes); // Clinician management (uses same routes file)
router.use("/video", videoRoutes);
router.use("/notifications", notificationRoutes);
router.use("/payments", paymentRoutes);

export default router;
