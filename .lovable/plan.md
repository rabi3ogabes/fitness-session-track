## Goal

Keep only two notification systems — **n8n webhooks** and **Lovable Email** — let the admin pick one as the active provider, give the admin a full email tracking dashboard, and let admins + members control per-event notifications (signup, login, booking, cancel, session request).

---

## 1. Database changes

- `admin_notification_settings`
  - Add `active_provider TEXT` (`'lovable_email' | 'n8n'`, default `'lovable_email'`)
  - Add `notify_member_on_booking BOOLEAN`, `notify_member_on_cancellation BOOLEAN`, `notify_member_on_signup BOOLEAN` (welcome), `notify_member_on_session_request BOOLEAN` (defaults true)
  - Drop unused columns from UI: `email_provider`, `smtp_*`, `resend_enabled`, `twilio_*` (kept in DB for safety, just hidden + ignored)
- Confirm Lovable Email infrastructure tables exist (`email_send_log`, `suppressed_emails`, `email_unsubscribe_tokens`). Set up if missing.
- `notification_settings` (per-member preferences): already has `signup_enabled`, `login_enabled`, `booking_enabled`, `cancellation_enabled` — reuse.

## 2. Edge function rewrite: `send-admin-notification`

Single dispatcher. Reads `active_provider`:
- If `lovable_email` → invokes `send-transactional-email` with `admin-notification` template (admin + cc) and `member-notification` template (to the member, when enabled).
- If `n8n` → POSTs to the matching `n8n_*_webhook_url`.

Logs every attempt into `webhook_delivery_logs` (n8n) or relies on `email_send_log` (Lovable) — both feed the dashboard.

## 3. New member-facing template

Create `_shared/transactional-email-templates/member-notification.tsx` for booking confirmations, cancellation receipts, session-request acknowledgements (member side). Register in `registry.ts`. Redeploy.

## 4. Admin Settings page redesign (`src/pages/admin/Settings.tsx`)

Replace the notification section with a clean, modern card-based layout:
- **Provider selector** (segmented control): Lovable Email | n8n Webhooks
- **Lovable Email card** (when active): sender domain (read-only `notify.fhbfit.com`), admin email, optional CC, "Verified" status badge
- **n8n card** (when active): per-event webhook URL inputs
- **Event toggles** (grid, 2 columns):
  - Admin alerts: signup, login, booking, cancellation, session request
  - Member emails: welcome, booking confirmation, cancellation confirmation, session request received

Remove WhatsApp/SMS/SMTP/Resend UI entirely.

## 5. New admin page: Email Activity dashboard

Route: `/admin/notifications` (add to admin nav).
Features (per dashboard spec):
- Time range filter (24h / 7d / 30d / custom)
- Template filter (admin-notification, member-notification, auth_emails…)
- Status filter (sent / failed / suppressed)
- Stat cards (total, sent, failed, suppressed) — deduplicated by `message_id`
- Sortable, paginated table: template, recipient, status badge, timestamp, error (admin-only RLS)
- Combined view that also surfaces n8n deliveries from `webhook_delivery_logs`

## 6. Member-side notification preferences

In existing member profile/notification settings UI: keep current per-event toggles, ensure they are honored by `send-admin-notification` before triggering member emails.

## 7. Cleanup

- Remove obsolete UI sections, helpers, and any remaining Resend / Twilio references in `Settings.tsx` and components.
- Delete `RESEND_API_KEY` / `SENDGRID_API_KEY` reads from code (secrets stay in Supabase but unused).

## Technical notes

- `email_send_log` queries always dedupe with `DISTINCT ON (message_id) … ORDER BY message_id, created_at DESC`.
- All edge function changes redeployed after edits.
- RLS: dashboard reads gated by `is_admin()`.
- No business-logic changes to bookings/auth flows — only the notification pipeline downstream.

```text
Trigger (booking/signup/...)
   │
   ▼
send-admin-notification ──► provider switch
   ├── lovable_email ──► send-transactional-email ──► email_send_log
   └── n8n          ──► webhook POST           ──► webhook_delivery_logs
                                                       │
                                                       ▼
                                              Admin → /admin/notifications
```
