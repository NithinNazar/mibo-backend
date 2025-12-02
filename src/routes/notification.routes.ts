// src/routes/notification.routes.ts
import { Router } from "express";
import { notificationController } from "../controllers/notification.controller";

const router = Router();

router.post("/test", (req, res, next) =>
  notificationController.test(req, res, next)
);

export default router;
