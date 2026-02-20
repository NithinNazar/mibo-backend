// src/controllers/centre.controller.ts
import { Request, Response, NextFunction } from "express";
import { centreService } from "../services/centre.service";
import { ok, created } from "../utils/response";
import { ApiError } from "../utils/apiError";

export class CentreController {
  /**
   * GET /api/centres
   * Get all centres
   */
  async getCentres(req: Request, res: Response, next: NextFunction) {
    try {
      const city = req.query.city as string | undefined;
      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
      const centres = await centreService.getCentres(city, isActive);
      return ok(res, centres);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/centres/:id
   * Get centre by ID
   */
  async getCentreById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw ApiError.badRequest("Invalid centre ID");
      }
      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
      const centre = await centreService.getCentreById(id, isActive);
      return ok(res, centre);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/centres
   * Create new centre
   */
  async createCentre(req: Request, res: Response, next: NextFunction) {
    try {
      const centre = await centreService.createCentre(req.body);
      return created(res, centre, "Centre created successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/centres/:id
   * Update centre
   */
  async updateCentre(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw ApiError.badRequest("Invalid centre ID");
      }

      const centre = await centreService.updateCentre(id, req.body);
      return ok(res, centre, "Centre updated successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/centres/:id
   * Delete centre
   */
  async deleteCentre(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw ApiError.badRequest("Invalid centre ID");
      }

      await centreService.deleteCentre(id);
      return ok(res, { message: "Centre deleted successfully" });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/centres/:id/toggle-active
   * Toggle centre active status
   */
  async toggleCentreActive(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw ApiError.badRequest("Invalid centre ID");
      }

      const { isActive } = req.body;
      const centre = await centreService.toggleCentreActive(id, isActive);
      return ok(
        res,
        centre,
        `Centre ${isActive ? "activated" : "deactivated"} successfully`,
      );
    } catch (err) {
      next(err);
    }
  }
}

export const centreController = new CentreController();
