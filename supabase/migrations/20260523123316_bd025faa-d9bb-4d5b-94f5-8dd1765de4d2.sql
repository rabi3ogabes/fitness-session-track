
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'transactional',
  display_name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sender_name TEXT,
  subject TEXT,
  preheader TEXT,
  heading TEXT,
  intro TEXT,
  body TEXT,
  button_label TEXT,
  footer_text TEXT,
  accent_color TEXT DEFAULT '#c9a861',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "emailtpl admin all" ON public.email_templates;
CREATE POLICY "emailtpl admin all" ON public.email_templates
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "emailtpl service read" ON public.email_templates;
CREATE POLICY "emailtpl service read" ON public.email_templates
  FOR SELECT TO public USING (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.touch_email_templates()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_touch_email_templates ON public.email_templates;
CREATE TRIGGER trg_touch_email_templates BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.touch_email_templates();

INSERT INTO public.email_templates (template_key, category, display_name, sender_name, subject, preheader, heading, intro, body, button_label, footer_text, accent_color) VALUES
  ('auth.signup', 'auth', 'Signup confirmation', 'FHB Fit', 'Confirm your email', 'Welcome to FHB Fit — please confirm your address', 'Welcome', 'One last step before you begin.', 'Tap the button below to confirm your email address and activate your FHB Fit account.', 'Confirm Email', 'If you didn''t create this account, you can safely ignore this email.', '#c9a861'),
  ('auth.magiclink', 'auth', 'Magic link', 'FHB Fit', 'Your secure sign-in link', 'Sign in to FHB Fit', 'Your sign-in link is ready', 'Tap the button below to securely sign in to your account. This link expires shortly.', 'Use the button below to access your dashboard.', 'Sign In', 'If you didn''t request this link, you can safely ignore this email.', '#c9a861'),
  ('auth.recovery', 'auth', 'Password reset', 'FHB Fit', 'Reset your password', 'A secure link to reset your FHB Fit password', 'Reset your password', 'We received a request to reset your password.', 'Tap the button below to choose a new password. The link will expire shortly for your security.', 'Reset Password', 'If you didn''t request a reset, you can safely ignore this email — your password will remain unchanged.', '#c9a861'),
  ('auth.invite', 'auth', 'Account invitation', 'FHB Fit', 'You''ve been invited to FHB Fit', 'Your invitation to join FHB Fit', 'You''re invited', 'Welcome aboard.', 'You''ve been invited to join FHB Fit. Tap the button below to accept your invitation and set up your account.', 'Accept Invitation', 'If you weren''t expecting this invitation, you can safely ignore this email.', '#c9a861'),
  ('auth.email_change', 'auth', 'Email change confirmation', 'FHB Fit', 'Confirm your new email address', 'Confirm your new email', 'Confirm new email', 'Almost done.', 'Tap the button below to confirm your new email address. The change won''t take effect until you confirm.', 'Confirm New Email', 'If you didn''t request this change, please secure your account immediately.', '#c9a861'),
  ('auth.reauthentication', 'auth', 'Verification code', 'FHB Fit', 'Your verification code', 'Your one-time verification code', 'Verification code', 'Use the code below to continue.', 'Enter this verification code in the application to confirm it''s you.', NULL, 'This code expires shortly. If you didn''t request it, you can safely ignore this email.', '#c9a861'),
  ('transactional.member-welcome', 'transactional', 'Member welcome', 'FHB Fit', 'Welcome to FHB Fit', 'Your membership is active', 'Welcome to FHB Fit', 'Your membership is active and ready to use.', 'You can now book classes, manage your sessions, and track your progress from your member dashboard.', 'Go to Dashboard', '— The FHB Fit team', '#c9a861'),
  ('transactional.admin-notification', 'transactional', 'Admin notification', 'FHB Fit', 'New activity on FHB Fit', 'A new event needs your attention', 'New activity', 'A new event has occurred on your platform.', 'See the details below and take action from the admin dashboard.', 'Open Dashboard', '— FHB Fit admin notifications', '#c9a861'),
  ('transactional.member-notification.booking', 'transactional', 'Member — booking confirmed', 'FHB Fit', 'Your booking is confirmed', 'See you at your next class', 'Booking confirmed', 'Your class is on the schedule.', 'We''ve confirmed your booking. The full class details are below — we look forward to training with you.', NULL, '— The FHB Fit team', '#c9a861'),
  ('transactional.member-notification.cancellation', 'transactional', 'Member — booking cancelled', 'FHB Fit', 'Your booking has been cancelled', 'Your class booking was cancelled', 'Booking cancelled', 'Your booking has been cancelled.', 'The details below were removed from your schedule. You can book another class anytime from your dashboard.', NULL, '— The FHB Fit team', '#c9a861'),
  ('transactional.member-notification.session_request', 'transactional', 'Member — session request', 'FHB Fit', 'Session request received', 'We''ve received your session request', 'Request received', 'Thanks — we''ve got your request.', 'Our team is reviewing your session request and will get back to you shortly.', NULL, '— The FHB Fit team', '#c9a861'),
  ('transactional.member-notification.password_changed', 'transactional', 'Member — password changed', 'FHB Fit', 'Your password was changed', 'Confirmation of a password change on your account', 'Password updated', 'This is a confirmation.', 'The password on your FHB Fit account was just changed. If this wasn''t you, please contact us immediately so we can secure your account.', NULL, '— The FHB Fit team', '#c9a861')
ON CONFLICT (template_key) DO NOTHING;
