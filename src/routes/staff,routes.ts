// src/routes/staff.routes.ts
import { Router } from "express";
import { staffController } from "../controllers/staff.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireRoles } from "../middlewares/role.middleware";

const router = Router();

router.post("/", authenticate, requireRoles(["ADMIN"]), (req, res, next) =>
  staffController.createStaff(req, res, next)
);

router.post(
  "/assign-role",
  authenticate,
  requireRoles(["ADMIN"]),
  (req, res, next) => staffController.assignRole(req, res, next)
);

router.get(
  "/",
  authenticate,
  requireRoles(["ADMIN", "MANAGER"]),
  (req, res, next) => staffController.listStaff(req, res, next)
);

router.get(
  "/:id",
  authenticate,
  requireRoles(["ADMIN", "MANAGER"]),
  (req, res, next) => staffController.getStaffById(req, res, next)
);

router.delete("/:id", authenticate, requireRoles(["ADMIN"]), (req, res, next) =>
  staffController.deactivate(req, res, next)
);

export default router;
