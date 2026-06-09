# Slot Blocking System - Conflict Analysis

## Two Systems Overview

### Old System: `clinician_slot_exceptions`

- Used by clinicians to block their own slots
- Key fields: `clinician_id`, `centre_id`, `exception_date`, `start_time`, `mode`
- Includes `mode` (IN_PERSON, VIDEO, AUDIO, CHAT)
- Controlled by: Clinicians via their dashboard

### New System: `blocked_slots`

- Used by admins to block slots (e.g., clinician unavailable)
- Key fields: `clinician_id`, `centre_id`, `blocked_date`, `start_time`, `end_time`
- Does NOT include `mode` (blocks all modes for that time slot)
- Controlled by: Admins via admin panel

## Current Behavior

### Slot Display Logic

```
isBlocked = isBlockedByException (old system) || isBlockedByBlockedSlots (new system)
```

If a slot is in EITHER system, it shows as "blocked"

## Conflict Scenarios

### ✅ SCENARIO 1: Admin blocks slot via admin panel

- **Action**: Admin clicks "Block" in Slot Management page
- **Result**: Record created in `blocked_slots` table
- **Conflict**: NONE - only touches new system
- **Status**: ✅ SAFE

### ⚠️ SCENARIO 2: Admin tries to unblock a slot that's in OLD system

- **Action**: Admin clicks "Unblock" button
- **Current Code**: Only updates `blocked_slots` table (sets `is_blocked = FALSE`)
- **Problem**: If the slot is blocked in `clinician_slot_exceptions`, it will STILL show as blocked
- **Conflict**: ⚠️ UNBLOCK WON'T WORK for old system blocks
- **Status**: ⚠️ POTENTIAL ISSUE

### ⚠️ SCENARIO 3: Slot exists in BOTH systems

- **How**: Clinician blocked via dashboard (old), then admin also blocked (new)
- **Display**: Shows as "blocked" (correct)
- **Has blockedSlotId**: YES (from new system)
- **Unblock button**: Shows "Unblock" button (using new system ID)
- **Problem**: When unblocked, only new system is updated, old block remains
- **Conflict**: ⚠️ Slot will still appear blocked after "unblock"
- **Status**: ⚠️ POTENTIAL ISSUE

### ✅ SCENARIO 4: Slot only in NEW system

- **Action**: Admin blocked via admin panel
- **Unblock**: Admin clicks unblock
- **Result**: Updates `blocked_slots`, slot becomes available
- **Conflict**: NONE
- **Status**: ✅ WORKS CORRECTLY

## UI Display Issue

### Problem: Which "blockedSlotId" is shown?

Currently, the code returns `blockedSlotId` from the NEW system only:

```typescript
blockedSlotId: blockedSlotId || undefined;
```

**If slot is blocked ONLY in OLD system**:

- `isBlocked = true` (correct)
- `blockedSlotId = undefined` (no new system record)
- **UI shows**: "Block" button (because no blockedSlotId)
- **Clicking Block**: Creates duplicate in new system
- **Status**: ⚠️ CONFUSING UX

## Risk Assessment

### Low Risk (Unlikely to occur)

- Overlap between both systems is unlikely in practice
- Old system used by clinicians (self-service)
- New system used by admins (management)
- Different use cases

### Medium Risk (Could cause confusion)

- Admin tries to unblock a slot that clinician blocked
- Slot appears blocked, has no unblock button or unblock doesn't work
- Admin confusion about why slot is still blocked

## Recommended Solutions

### Option 1: Query both systems for unblock button display

```typescript
blockedSlotId: blockedSlotId || undefined,
hasOldSystemBlock: isBlockedByException,
canUnblock: !!blockedSlotId  // Only show unblock if in new system
```

### Option 2: Migrate old exceptions to new system

- Run a one-time migration script
- Copy all active exceptions from `clinician_slot_exceptions` to `blocked_slots`
- Deprecate old system

### Option 3: Check both systems when displaying unblock button

- If blocked only by old system: Don't show unblock button (or show disabled)
- If blocked by new system: Show unblock button
- Add tooltip explaining which system has the block

### Option 4: Let unblock handle both systems

Modify unblock logic to check and clear BOTH systems:

```typescript
async unblockSlot(slotId: number, adminId: number) {
  // Unblock in new system
  await slotRepository.unblockSlot(slotId, adminId);

  // Also check and remove from old system
  const slot = await slotRepository.findSlotById(slotId);
  if (slot) {
    await staffRepository.removeSlotException(
      slot.clinician_id,
      slot.centre_id,
      slot.blocked_date,
      slot.start_time
    );
  }
}
```

## Current Status

✅ Blocking works correctly
⚠️ Unblocking may not work if slot is in old system
⚠️ UI may be confusing for slots in old system only
