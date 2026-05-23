-- =========================================================
-- Phase 2 / Step 1: recreate old schema on Lovable Cloud
-- =========================================================

-- ---------- TABLES ----------
CREATE TABLE IF NOT EXISTS public.payments (
  id integer PRIMARY KEY,
  member text NOT NULL,
  amount numeric NOT NULL,
  date text NOT NULL,
  membership text NOT NULL,
  status text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.membership_types (
  id integer PRIMARY KEY,
  name text NOT NULL,
  sessions integer NOT NULL,
  price numeric NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type text NOT NULL,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL,
  error_message text,
  user_name text,
  user_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.webhook_delivery_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_type text NOT NULL,
  webhook_url text,
  status_code integer,
  success boolean NOT NULL DEFAULT false,
  error_message text,
  response_body text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  login_balance_notification boolean NOT NULL DEFAULT true,
  signup_enabled boolean NOT NULL DEFAULT true,
  login_enabled boolean NOT NULL DEFAULT true,
  booking_enabled boolean NOT NULL DEFAULT true,
  cancellation_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.membership_requests (
  id integer PRIMARY KEY,
  member text NOT NULL,
  email text NOT NULL,
  type text NOT NULL,
  date text NOT NULL,
  status text DEFAULT 'Pending',
  sessions integer,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.classes (
  id integer PRIMARY KEY,
  name text NOT NULL,
  trainer text,
  trainers text[],
  schedule text NOT NULL,
  capacity integer NOT NULL,
  enrolled integer DEFAULT 0,
  status text DEFAULT 'Active',
  gender text DEFAULT 'All',
  start_time text,
  end_time text,
  description text,
  location text,
  difficulty text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  phone_number varchar NOT NULL,
  name varchar,
  email varchar,
  membership_type varchar,
  sessions_remaining integer DEFAULT 0,
  total_sessions integer DEFAULT 0,
  emergency_contact_name text,
  emergency_contact_phone text,
  gender text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  class_id integer NOT NULL,
  booking_date timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'confirmed',
  attendance boolean,
  notes text,
  user_name text,
  member_id integer
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text,
  user_id uuid,
  user_email text,
  user_name text,
  event_type text NOT NULL,
  path text,
  details jsonb,
  user_agent text,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trainers (
  id integer PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  specialization text,
  status text DEFAULT 'Active',
  gender text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.session_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id integer NOT NULL,
  member_name text,
  delta integer NOT NULL,
  previous_sessions integer NOT NULL,
  new_sessions integer NOT NULL,
  reason text,
  changed_by_user_id uuid,
  changed_by_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_email text NOT NULL,
  from_email text,
  from_name text,
  signup_notifications boolean NOT NULL DEFAULT true,
  booking_notifications boolean NOT NULL DEFAULT true,
  session_request_notifications boolean NOT NULL DEFAULT true,
  smtp_host text,
  smtp_port integer DEFAULT 587,
  smtp_username text,
  smtp_password text,
  smtp_use_tls boolean DEFAULT true,
  email_provider text DEFAULT 'smtp',
  notification_cc_email text,
  n8n_webhook_url text,
  n8n_signup_webhook_url text,
  n8n_booking_webhook_url text,
  n8n_cancellation_webhook_url text,
  n8n_session_request_webhook_url text,
  resend_enabled boolean DEFAULT true,
  cancellation_notifications boolean DEFAULT true,
  notification_provider text NOT NULL DEFAULT 'n8n',
  twilio_channel text NOT NULL DEFAULT 'whatsapp',
  twilio_from_number text,
  twilio_admin_number text,
  login_notifications boolean NOT NULL DEFAULT true,
  active_provider text NOT NULL DEFAULT 'lovable_email',
  notify_member_welcome boolean NOT NULL DEFAULT true,
  notify_member_booking boolean NOT NULL DEFAULT true,
  notify_member_cancellation boolean NOT NULL DEFAULT true,
  notify_member_session_request boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cancellation_hours integer NOT NULL DEFAULT 4,
  logo text,
  header_color text DEFAULT '#ffffff',
  footer_color text DEFAULT '#000000',
  membership_expiry_basic integer DEFAULT 30,
  membership_expiry_standard integer DEFAULT 60,
  membership_expiry_premium integer DEFAULT 90,
  show_testimonials boolean DEFAULT true,
  show_low_session_warning boolean DEFAULT true,
  show_member_delete_icon boolean DEFAULT true,
  show_class_delete_icon boolean DEFAULT true,
  show_booking_delete_icon boolean DEFAULT false,
  hero_title text DEFAULT 'Streamlined Gym Management System',
  hero_description text DEFAULT 'A complete solution for gym owners and members.',
  hero_image text,
  feature1_title text DEFAULT 'User Roles',
  feature1_description text DEFAULT 'Separate dashboards for administrators and members.',
  feature2_title text DEFAULT 'Session Booking',
  feature2_description text DEFAULT 'Effortless class booking with membership session tracking.',
  feature3_title text DEFAULT 'Membership Management',
  feature3_description text DEFAULT 'Manage different membership packages with automated session tracking.',
  features_section text DEFAULT 'Our Features',
  testimonials_section text DEFAULT 'What Our Members Say',
  cta_title text DEFAULT 'Ready to Transform Your Fitness Journey?',
  cta_description text DEFAULT 'Join us today.',
  cta_button text DEFAULT 'Get Started Now',
  company_name text DEFAULT 'FitTrack Pro',
  copyright text DEFAULT '© 2025 All rights reserved',
  footer_login text DEFAULT 'Login',
  footer_about text DEFAULT 'About',
  footer_contact text DEFAULT 'Contact',
  footer_privacy text DEFAULT 'Privacy',
  auto_approve_balance_requests boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.members (
  id integer PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  membership text,
  sessions integer DEFAULT 0,
  remaining_sessions integer DEFAULT 0,
  status text DEFAULT 'Active',
  birthday text,
  can_be_edited_by_trainers boolean DEFAULT false,
  gender text,
  total_sessions integer DEFAULT 0,
  password integer,
  count_credit boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ---------- SEQUENCES for integer ids ----------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['members','classes','payments','trainers','membership_types','membership_requests']
  LOOP
    EXECUTE format('CREATE SEQUENCE IF NOT EXISTS public.%I_id_seq OWNED BY public.%I.id', t, t);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN id SET DEFAULT nextval(''public.%I_id_seq'')', t, t);
  END LOOP;
END$$;

-- ---------- RLS (temporary permissive — will tighten after import) ----------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'payments','membership_types','notification_logs','webhook_delivery_logs',
    'notification_settings','membership_requests','classes','profiles','bookings',
    'activity_logs','trainers','session_history','admin_notification_settings',
    'admin_settings','members'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "temp_all_authenticated" ON public.%I', t);
    EXECUTE format('CREATE POLICY "temp_all_authenticated" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
    EXECUTE format('DROP POLICY IF EXISTS "temp_read_public" ON public.%I', t);
    EXECUTE format('CREATE POLICY "temp_read_public" ON public.%I FOR SELECT TO anon USING (true)', t);
  END LOOP;
END$$;