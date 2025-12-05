// src/controllers/health.controller.ts
import { Request, Response, NextFunction } from "express";
import { testDatabaseConnection } from "../config/db";
import { ENV } from "../config/env";
import { ok } from "../utils/response";

export class HealthController {
  /**
   * GET /api/health
   * Health check endpoint
   */
  async getHealth(req: Request, res: Response, next: NextFunction) {
    try {
      const dbConnected = await testDatabaseConnection();

      const health = {
        status: dbConnected ? "healthy" : "unhealthy",
        timestamp: new Date().toISOString(),
        database: dbConnected ? "connected" : "disconnected",
        version: "1.0.0",
        environment: ENV.NODE_ENV,
        uptime: process.uptime(),
      };

      return ok(res, health);
    } catch (err) {
      next(err);
    }
  }
}

export const healthController = new HealthController();
