-- Soft Delete Implementation for All Entities
-- This file contains the SQL and code snippets needed for soft delete

-- 1. CENTRES
-- Controller method (add to centre.controller.ts)
/*
async toggleCentreActive(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const { isActive } = req.body;
    const centre = await centreService.toggleCentreActive(id, isActive);
    return ok(
      res,
      centre,
      `Centre ${isActive ? "activated" : "deactivated"} successfully`
    );
  } catch (err) {
    next(err);
  }
}
*/

-- Service method (add to centre.service.ts)
/*
async toggleCentreActive(centreId: number, isActive: boolean) {
  const centre = await centreRepository.findById(centreId);
  if (!centre) {
    throw ApiError.notFound("Centre not found");
  }
  return await centreRepository.toggleActive(centreId, isActive);
}
*/

-- Repository method (add to centre.repository.ts)
/*
async toggleActive(centreId: number, isActive: boolean) {
  await db.none(
    `UPDATE centres 
     SET is_active = $1, updated_at = NOW() 
     WHERE id = $2`,
    [isActive, centreId]
  );
  return this.findById(centreId);
}
*/

-- 2. STAFF USERS (Managers, Centre Managers, Care Coordinators, Front Desk)
-- These all use the same staff endpoints

-- Controller method (add to staff.controller.ts)
/*
async toggleStaffActive(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const { isActive } = req.body;
    const staff = await staffService.toggleStaffActive(id, isActive);
    return ok(
      res,
      staff,
      `Staff ${isActive ? "activated" : "deactivated"} successfully`
    );
  } catch (err) {
    next(err);
  }
}
*/

-- Service method (add to staff.service.ts)
/*
async toggleStaffActive(userId: number, isActive: boolean) {
  const staff = await staffRepository.findStaffById(userId);
  if (!staff) {
    throw ApiError.notFound("Staff user not found");
  }
  return await staffRepository.toggleStaffActive(userId, isActive);
}
*/

-- Repository method (add to staff.repository.ts)
/*
async toggleStaffActive(userId: number, isActive: boolean) {
  await db.none(
    `UPDATE users 
     SET is_active = $1, updated_at = NOW() 
     WHERE id = $2`,
    [isActive, userId]
  );
  
  await db.none(
    `UPDATE staff_profiles 
     SET is_active = $1, updated_at = NOW() 
     WHERE user_id = $2`,
    [isActive, userId]
  );
  
  return this.findStaffById(userId);
}
*/

-- Route (add to staff.routes.ts)
/*
router.patch(
  "/:id/toggle-active",
  authMiddleware,
  requireRole("ADMIN", "MANAGER"),
  (req, res, next) => staffController.toggleStaffActive(req, res, next)
);
*/
