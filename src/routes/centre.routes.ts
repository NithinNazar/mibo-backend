// src/routes/centre.routes.ts
import { Router } from "express";
import { centreController } from "../controllers/centre.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import {
  validateCreateCentre,
  validateUpdateCentre,
} from "../validations/centre.validation";

const router = Router();

/**
 * GET /api/centres
 * Get all centres (all authenticated users)
 * Query params: ?city=bangalore
 */
router.get("/", authenticate, (req, res, next) =>
  centreController.getCentres(req, res, next)
);

/**
 * GET /api/centres/:id
 * Get centre by ID (all authenticated users)
 */
router.get("/:id", authenticate, (req, res, next) =>
  centreController.getCentreById(req, res, next)
);

/**
 * POST /api/centres
 * Create new centre (ADMIN, MANAGER)
 */
router.post(
  "/",
  authenticate,
  requireRole("ADMIN", "MANAGER"),
  validateCreateCentre,
  (req, res, next) => centreController.createCentre(req, res, next)
);

/**
 * PUT /api/centres/:id
 * Update centre (ADMIN, MANAGER, CENTRE_MANAGER)
 */
router.put(
  "/:id",
  authenticate,
  requireRole("ADMIN", "MANAGER", "CENTRE_MANAGER"),
  validateUpdateCentre,
  (req, res, next) => centreController.updateCentre(req, res, next)
);

/**
 * DELETE /api/centres/:id
 * Delete centre (ADMIN only)
 */
router.delete("/:id", authenticate, requireRole("ADMIN"), (req, res, next) =>
  centreController.deleteCentre(req, res, next)
);

export default router;
