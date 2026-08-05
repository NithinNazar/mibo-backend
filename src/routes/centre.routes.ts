// src/routes/centre.routes.ts
import { Router } from "express";
import { centreController } from "../controllers/centre.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import {
  validateCreateCentre,
  validateUpdateCentre,
} from "../validations/centre.validation";

const router = Router();

/**
 * GET /api/centres
 * Get all centres (PUBLIC - no authentication required)
 * Query params: ?city=bangalore
 * This endpoint is public because centre information (locations, addresses)
 * needs to be accessible to non-logged-in users browsing the experts page
 */
router.get("/", (req, res, next) =>
  centreController.getCentres(req, res, next),
);

/**
 * GET /api/centres/:id
 * Get centre by ID (PUBLIC - no authentication required)
 * This endpoint is public for the same reason as GET /centres
 */
router.get("/:id", (req, res, next) =>
  centreController.getCentreById(req, res, next),
);

/**
 * POST /api/centres
 * Create new centre (ADMIN, MANAGER)
 */
router.post(
  "/",
  authMiddleware,
  requireRole("ADMIN", "MANAGER"),
  validateCreateCentre,
  (req, res, next) => centreController.createCentre(req, res, next),
);

/**
 * PUT /api/centres/:id
 * Update centre (ADMIN, MANAGER, CENTRE_MANAGER)
 */
router.put(
  "/:id",
  authMiddleware,
  requireRole("ADMIN", "MANAGER", "CENTRE_MANAGER"),
  validateUpdateCentre,
  (req, res, next) => centreController.updateCentre(req, res, next),
);

/**
 * DELETE /api/centres/:id
 * Delete centre (ADMIN only)
 */
router.delete("/:id", authMiddleware, requireRole("ADMIN"), (req, res, next) =>
  centreController.deleteCentre(req, res, next),
);

/**
 * PATCH /api/centres/:id/toggle-active
 * Toggle centre active status (ADMIN, MANAGER)
 */
router.patch(
  "/:id/toggle-active",
  authMiddleware,
  requireRole("ADMIN", "MANAGER"),
  (req, res, next) => centreController.toggleCentreActive(req, res, next),
);

export default router;
