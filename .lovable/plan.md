## Goal
Convert member deletion to a soft-delete (hide), and add a recovery UI in the Settings page so admins can restore deleted members at any time.

## Changes

### 1. Database migration
- Add `deleted_at TIMESTAMPTZ NULL` column to `public.members`.
- Add index on `deleted_at` for fast filtering.
- (Bookings, payments, session_history reference members by id/name — they remain untouched, so restoring brings the history back automatically.)

### 2. Soft-delete behavior (`src/pages/admin/Members.tsx`)
- Replace the hard `DELETE` in `deleteMember` with an `UPDATE members SET deleted_at = now()`.
- Skip the `delete-user` edge function call (keep the auth user so the member can log in again after restore).
- Update the fetch query to filter `deleted_at IS NULL` so hidden members don't appear in the admin list.

### 3. Hide deleted members everywhere they're listed
Filter `deleted_at IS NULL` (or skip records where it's set) in:
- Admin Members list (already covered above)
- Admin Bookings member dropdowns
- Trainer member pickers / NewMemberDialog
- Any other `from('members').select` queries

(I'll grep the codebase and update each call site.)

### 4. Recovery UI in Settings page (`src/pages/admin/Settings.tsx`)
- Add a new "Deleted Members" card/section.
- Lists members where `deleted_at IS NOT NULL`: name, email, phone, deleted date.
- Each row has a **Restore** button → sets `deleted_at = NULL`, member reappears everywhere.
- Optional **Permanently delete** button for true cleanup (calls original hard-delete + `delete-user` edge function).
- Search box to filter the deleted list.

### 5. Toast & UX
- Delete confirmation copy updated: "Member will be hidden. You can restore them from Settings → Deleted Members."
- Restore action shows a success toast.

## Technical notes
- No RLS changes needed — existing admin policies cover update/select.
- `members.email` uniqueness: if a deleted member's email is reused for a new signup before restore, we'll surface a clear error on restore. (Edge case, not blocking.)
- Realtime subscriptions on `members` already broadcast updates, so the UI will reflect deletes/restores instantly.