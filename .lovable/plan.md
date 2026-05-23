# Twilio Notification Integration Plan

## Goal
Add Twilio WhatsApp/SMS as a second notification channel alongside n8n. Admin can switch the active provider and enable/disable each event type. Each customer can also opt in/out of receiving their own notifications per event.

## 1. Database changes (migration)

**`admin_notification_settings`** — add columns:
- `notification_provider` text default `'n8n'` — values: `'n8n'` | `'twilio'`
- `twilio_from_number` text — sender (WhatsApp `whatsapp:+...` or SMS `+...`)
- `twilio_channel` text default `'whatsapp'` — `'whatsapp'` | `'sms'`
- `twilio_admin_number` text — admin's phone for admin alerts
- `login_notifications` boolean default true (new event type)

**`notification_settings`** (per-user customer prefs) — add columns:
- `signup_enabled` boolean default true
- `login_enabled` boolean default true
- `booking_enabled` boolean default true
- `cancellation_enabled` boolean default true
(keep existing `login_balance_notification`)

## 2. Edge function: `send-twilio-notification`
New function that:
- Reads provider settings + event type
- Sends a WhatsApp/SMS message via Twilio connector gateway to (a) admin number and (b) customer phone (if customer opted in)
- Logs to `webhook_delivery_logs` / `notification_logs`

Uses `LOVABLE_API_KEY` + `TWILIO_API_KEY` through `https://connector-gateway.lovable.dev/twilio/Messages.json`.

## 3. Update `send-admin-notification`
- Read `notification_provider` from admin settings
- If `'twilio'` → call `send-twilio-notification`
- If `'n8n'` → keep existing webhook behavior
- For both: also dispatch a customer message when the customer's per-event preference is enabled

## 4. Trigger login + signup events
- `AuthContext` (or login handler) calls notification dispatcher on successful login + signup
- Already wired for booking + cancellation; ensure both fire the new dispatcher path

## 5. Admin Settings UI (`src/pages/admin/Settings.tsx`)
- New "Notification Provider" section:
  - Switch: `n8n` ↔ `twilio`
  - Twilio inputs (channel, from number, admin number) — shown when twilio selected
- Event toggles (already partly there): signup, login, booking, cancellation, session_request

## 6. Customer notification preferences UI (`src/pages/user/UserProfile.tsx`)
- New "Notifications" card with 4 switches: signup confirmation, login alert, booking confirmation, cancellation alert
- Reads/writes `notification_settings` row for `auth.uid()`

## 7. Files touched
- `supabase/migrations/<new>.sql` (schema)
- `supabase/functions/send-twilio-notification/index.ts` (new)
- `supabase/functions/send-admin-notification/index.ts` (route by provider, also dispatch to customer)
- `supabase/config.toml` (register new function, `verify_jwt = false`)
- `src/pages/admin/Settings.tsx` (provider switch + Twilio fields + event toggles)
- `src/pages/user/UserProfile.tsx` (customer per-event prefs)
- `src/context/AuthContext.tsx` (fire login + signup events)
- `src/integrations/supabase/types.ts` (regenerated after migration)

## Notes / assumptions
- Twilio connector is already linked, so `TWILIO_API_KEY` + `LOVABLE_API_KEY` are present in edge function env.
- WhatsApp requires the destination to have joined your Twilio sandbox (or you're using an approved sender). I'll default channel to `whatsapp` but expose SMS as an option.
- Customer phone is read from `members.phone` (fallback `profiles.phone_number`).
- "Login" notification to the customer is a security-style "new login detected" message; admin gets a "user X logged in" alert.

Approve and I'll start with the migration.
