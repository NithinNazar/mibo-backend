// src/controllers/analytics.controller.ts
import { Response, NextFunction } from "express";
import { analyticsService } from "../services/analytics.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import { ok } from "../utils/response";
import { ApiError } from "../utils/apiError";

export class AnalyticsController {
  /**
   * GET /api/analytics/dashboard
   * Get dashboard metrics
   */
  async getDashboardMetrics(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const metrics = await analyticsService.getDashboardMetrics(
        req.user.userId,
        req.user.roles
      );

      return ok(res, metrics);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/analytics/top-doctors
   * Get top performing doctors
   */
  async getTopDoctors(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const centreId = req.query.centreId
        ? parseInt(req.query.centreId as string)
        : undefined;

      const doctors = await analyticsService.getTopDoctors(limit, centreId);

      return ok(res, doctors);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/analytics/revenue
   * Get revenue data by period
   */
  async getRevenueData(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const period = (req.query.period as "week" | "month" | "year") || "month";
      const centreId = req.query.centreId
        ? parseInt(req.query.centreId as string)
        : undefined;

      // Validate period
      if (!["week", "month", "year"].includes(period)) {
        throw ApiError.badRequest(
          "Invalid period. Must be 'week', 'month', or 'year'"
        );
      }

      const data = await analyticsService.getRevenueData(period, centreId);

      return ok(res, data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/analytics/leads-by-source
   * Get appointment sources
   */
  async getLeadsBySource(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const centreId = req.query.centreId
        ? parseInt(req.query.centreId as string)
        : undefined;

      const data = await analyticsService.getLeadsBySource(centreId);

      return ok(res, data);
    } catch (err) {
      next(err);
    }
  }
}

export const analyticsController = new AnalyticsController();
