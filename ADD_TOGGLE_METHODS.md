# Quick Implementation Guide for Soft Delete

## Add to centre.service.ts (after deleteCentre method):

```typescript
async toggleCentreActive(centreId: number, isActive: boolean) {
  const centre = await centreRepository.findById(centreId);
  if (!centre) {
    throw ApiError.notFound("Centre not found");
  }
  return await centreRepository.toggleActive(centreId, isActive);
}
```

## Add to centre.repository.ts (at end of class):

```typescript
async toggleActive(centreId: number, isActive: boolean) {
  await db.none(
    `UPDATE centres
     SET is_active = $1, updated_at = NOW()
     WHERE id = $2`,
    [isActive, centreId]
  );
  return this.findById(centreId);
}
```

## Add to staff.controller.ts (after deleteClinician method):

```typescript
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
```

## Add to staff.service.ts (after deleteStaffUser method):

```typescript
async toggleStaffActive(userId: number, isActive: boolean) {
  const staff = await staffRepository.findStaffById(userId);
  if (!staff) {
    throw ApiError.notFound("Staff user not found");
  }
  return await staffRepository.toggleStaffActive(userId, isActive);
}
```

## Add to staff.repository.ts (at end of class):

```typescript
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
```

## Add to staff.routes.ts (after DELETE /:id route):

```typescript
router.patch(
  "/:id/toggle-active",
  authMiddleware,
  requireRole("ADMIN", "MANAGER"),
  (req, res, next) => staffController.toggleStaffActive(req, res, next),
);
```

## Frontend Services - Add to each service:

### staffService.ts:

```typescript
async toggleActive(id: string, isActive: boolean): Promise<any> {
  const response = await api.patch(`/users/${id}/toggle-active`, { isActive });
  return response.data.data || response.data;
}
```

## Frontend Pages - Replace delete with toggle in:

- ManagersPage.tsx
- CentreManagersPage.tsx
- CareCoordinatorsPage.tsx
- FrontDeskPage.tsx

Replace:

```typescript
const handleDelete = async (id: string) => {
  if (!confirm("Are you sure?")) return;
  await service.delete(id);
  toast.success("Deleted");
  fetchData();
};
```

With:

```typescript
const handleToggleActive = async (id: string, isActive: boolean) => {
  await service.toggleActive(id, isActive);
  toast.success(`${isActive ? "Activated" : "Deactivated"} successfully`);
  fetchData();
};
```

And in table columns, replace delete button with toggle.
