// src/routes/analytics.routes.ts
import { Router } from "express";
import { analyticsController } from "../controllers/analytics.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";

const router = Router();

// All analytics routes require authentication and specific roles
const analyticsRoles = requireRole("ADMIN", "MANAGER", "CENTRE_MANAGER");

/**
 * GET /api/analytics/dashboard
 * Get dashboard metrics (total patients, doctors, follow-ups, revenue)
 */
router.get("/dashboard", authenticate, analyticsRoles, (req, res, next) =>
  analyticsController.getDashboardMetrics(req, res, next)
);

/**
 * GET /api/analytics/top-doctors
 * Get top performing doctors
 * Query params: ?limit=10&centreId=1
 */
router.get("/top-doctors", authenticate, analyticsRoles, (req, res, next) =>
  analyticsController.getTopDoctors(req, res, next)
);

/**
 * GET /api/analytics/revenue
 * Get revenue data by period
 * Query params: ?period=month&centreId=1
 */
router.get("/revenue", authenticate, analyticsRoles, (req, res, next) =>
  analyticsController.getRevenueData(req, res, next)
);

/**
 * GET /api/analytics/leads-by-source
 * Get appointment sources distribution
 * Query params: ?centreId=1
 */
router.get("/leads-by-source", authenticate, analyticsRoles, (req, res, next) =>
  analyticsController.getLeadsBySource(req, res, next)
);

export default router;
