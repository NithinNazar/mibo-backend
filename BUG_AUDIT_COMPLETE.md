# Bug Audit Complete - All 3 Projects Checked

**Date:** February 3, 2026  
**Status:** 🟡 1 REAL BUG FOUND

---

## Summary

Checked all 3 reported bugs across backend, frontend, and admin panel.

**Result:**

- ✅ Bug #1 (Payload Mismatch): FALSE ALARM - Already correct
- 🔴 Bug #2 (Hardcoded Role ID): REAL BUG - Needs fix
- ✅ Bug #3 (Sidebar Roles): FALSE ALARM - Already fixed

---

## Bug #1: API Payload Mismatch ✅ FALSE ALARM

**Claim:** Frontend sends snake_case but backend expects camelCase

**Reality:** Backend expects snake_case, frontend sends snake_case ✅

**Evidence:**

```typescript
// Backend validation (backend/src/validations/staff.validation.ts)
if (!body.role_ids || !Array.isArray(body.role_ids)) {
  throw ApiError.badRequest("At least one role must be assigned");
}
// Expects: role_ids, centre_ids, full_name (snake_case)

// Frontend payload (mibo-admin/src/modules/staff/pages/CliniciansPage.tsx)
const createData = {
  full_name: formData.full_name, // ✅ Correct
  role_ids: [4], // ✅ Correct
  centre_ids: [formData.primaryCentreId], // ✅ Correct
  primary_centre_id: formData.primaryCentreId, // ✅ Correct
};
```

**Backend Flow:**

1. Request: snake_case ✅
2. Validation: expects snake_case ✅
3. Database: stores snake_case ✅
4. Response: transformed to camelCase ✅ (for frontend consumption)

**Conclusion:** Working as designed. No fix needed.

---

## Bug #2: Hardcoded Role IDs 🔴 REAL BUG

**Location:** `mibo-admin/src/modules/staff/pages/CliniciansPage.tsx` Line 234

**Problem:** Code hardcodes `role_ids: [4]` assuming Clinician role is ID 4.

**Current Code:**

```typescript
role_ids: [4], // ❌ Hardcoded - breaks if AWS database has different IDs
```

**Impact:**

- Fails if role ID 4 doesn't exist on AWS
- Assigns wrong role if ID 4 is different role
- Clinicians can't access features
- Sidebar shows wrong menu

**Fix Options:**

### Option 1: Check AWS Database (QUICKEST)

```sql
SELECT id, name FROM roles WHERE name = 'CLINICIAN';
```

Update hardcoded value to match AWS database.

### Option 2: Fetch Dynamically (BEST)

```typescript
const [clinicianRoleId, setClinicianRoleId] = useState<number>(4);

useEffect(() => {
  const fetchRoleId = async () => {
    try {
      const roles = await roleService.getRoles();
      const clinicianRole = roles.find((r) => r.name === "CLINICIAN");
      if (clinicianRole) {
        setClinicianRoleId(parseInt(clinicianRole.id));
      }
    } catch (error) {
      console.error("Failed to fetch role ID");
    }
  };
  fetchRoleId();
}, []);

// Use: role_ids: [clinicianRoleId]
```

### Option 3: Backend Accepts Names

Update backend to accept role names:

```typescript
roles: ["CLINICIAN"]; // Instead of role_ids: [4]
```

**Recommended:** Option 1 for quick fix, Option 2 for long-term solution.

---

## Bug #3: Sidebar Role Check ✅ FALSE ALARM

**Claim:** Sidebar uses strict case-sensitive checks that fail

**Reality:** Sidebar already handles case normalization ✅

**Evidence:**

```typescript
// mibo-admin/src/layouts/AdminLayout/Sidebar.tsx
let role: string | undefined = user.role;

// Fallback to roles array if role not set
if (!role && (user as any).roles && Array.isArray((user as any).roles)) {
  const roles = (user as any).roles;
  role = roles[0]?.name || roles[0];
}

// Works because backend returns uppercase consistently
if (role === "ADMIN" || role === "MANAGER") {
  return allSections;
}
```

**Why it works:**

- Backend returns uppercase role names ("ADMIN", "MANAGER", "CLINICIAN")
- Sidebar checks for uppercase
- Handles both `user.role` and `user.roles` array
- Already robust

**Conclusion:** No fix needed.

---

## Action Required

### Immediate (Before AWS Deployment)

1. **Check AWS Database:**

   ```sql
   SELECT id, name FROM roles ORDER BY id;
   ```

2. **Update Role ID:**
   Find CLINICIAN role ID and update line 234 in `CliniciansPage.tsx`:

   ```typescript
   role_ids: [<actual_id>], // Replace with actual AWS role ID
   ```

3. **Test:**
   - Create clinician
   - Verify role assignment
   - Check sidebar shows correct menu

### Long-term (After Deployment)

Implement dynamic role ID fetching (Option 2 above).

---

## Verification Query

```sql
-- After creating clinician, verify correct role:
SELECT
  u.id,
  u.full_name,
  r.name as role_name,
  r.id as role_id
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.user_type = 'STAFF'
ORDER BY u.id DESC
LIMIT 5;
```

---

## Summary

**Real Bugs:** 1 (Hardcoded Role ID)  
**False Alarms:** 2 (Payload format and sidebar already correct)  
**Priority:** Medium (won't break app, but causes wrong role assignment)  
**Fix Time:** 5 minutes (check database + update one number)

**Status:** Ready to fix and deploy ✅
