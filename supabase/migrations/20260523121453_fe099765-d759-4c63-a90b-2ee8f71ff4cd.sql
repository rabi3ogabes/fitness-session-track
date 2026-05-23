
-- =====================================================================
-- 1. Roles infrastructure
-- =====================================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'trainer', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_role(auth.uid(), 'admin') $$;

CREATE OR REPLACE FUNCTION public.is_trainer()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_role(auth.uid(), 'trainer') $$;

-- Seed roles from existing auth metadata
INSERT INTO public.user_roles (user_id, role)
SELECT u.id,
       CASE
         WHEN (u.raw_user_meta_data->>'role') = 'admin' THEN 'admin'::public.app_role
         WHEN (u.raw_user_meta_data->>'role') = 'trainer' THEN 'trainer'::public.app_role
         ELSE 'user'::public.app_role
       END
FROM auth.users u
ON CONFLICT (user_id, role) DO NOTHING;

-- user_roles policies
DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =====================================================================
-- 2. Drop all temp policies
-- =====================================================================
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname IN ('temp_all_authenticated','temp_read_public')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- =====================================================================
-- 3. admin_settings - public read, admin write
-- =====================================================================
CREATE POLICY "admin_settings public read" ON public.admin_settings
  FOR SELECT USING (true);
CREATE POLICY "admin_settings admin write" ON public.admin_settings
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =====================================================================
-- 4. admin_notification_settings - admin only
-- =====================================================================
CREATE POLICY "admin_notif admin all" ON public.admin_notification_settings
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =====================================================================
-- 5. members - admin full, members read own row by email
-- =====================================================================
CREATE POLICY "members admin all" ON public.members
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "members trainer read" ON public.members
  FOR SELECT TO authenticated USING (public.is_trainer());
CREATE POLICY "members self read" ON public.members
  FOR SELECT TO authenticated USING (email = (auth.jwt() ->> 'email'));

-- =====================================================================
-- 6. classes - public read, admin write, trainer write
-- =====================================================================
CREATE POLICY "classes read all" ON public.classes
  FOR SELECT USING (true);
CREATE POLICY "classes admin write" ON public.classes
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "classes trainer update" ON public.classes
  FOR UPDATE TO authenticated USING (public.is_trainer()) WITH CHECK (public.is_trainer());

-- =====================================================================
-- 7. bookings - admins/trainers full, users own
-- =====================================================================
CREATE POLICY "bookings admin all" ON public.bookings
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "bookings trainer read" ON public.bookings
  FOR SELECT TO authenticated USING (public.is_trainer());
CREATE POLICY "bookings trainer update" ON public.bookings
  FOR UPDATE TO authenticated USING (public.is_trainer()) WITH CHECK (public.is_trainer());
CREATE POLICY "bookings user select own" ON public.bookings
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "bookings user insert own" ON public.bookings
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "bookings user update own" ON public.bookings
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "bookings user delete own" ON public.bookings
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- =====================================================================
-- 8. payments - admin only, member can read own
-- =====================================================================
CREATE POLICY "payments admin all" ON public.payments
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "payments member read own" ON public.payments
  FOR SELECT TO authenticated USING (
    member IN (SELECT name FROM public.members WHERE email = (auth.jwt() ->> 'email'))
  );

-- =====================================================================
-- 9. membership_requests - admin all, member own
-- =====================================================================
CREATE POLICY "memreq admin all" ON public.membership_requests
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "memreq member read own" ON public.membership_requests
  FOR SELECT TO authenticated USING (email = (auth.jwt() ->> 'email'));
CREATE POLICY "memreq member insert own" ON public.membership_requests
  FOR INSERT TO authenticated WITH CHECK (email = (auth.jwt() ->> 'email'));

-- =====================================================================
-- 10. membership_types - public read, admin write
-- =====================================================================
CREATE POLICY "memtypes read all" ON public.membership_types
  FOR SELECT USING (true);
CREATE POLICY "memtypes admin write" ON public.membership_types
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =====================================================================
-- 11. session_history - admin all, member read own
-- =====================================================================
CREATE POLICY "sesshist admin all" ON public.session_history
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "sesshist trainer read" ON public.session_history
  FOR SELECT TO authenticated USING (public.is_trainer());
CREATE POLICY "sesshist member read own" ON public.session_history
  FOR SELECT TO authenticated USING (
    member_id IN (SELECT id FROM public.members WHERE email = (auth.jwt() ->> 'email'))
  );

-- =====================================================================
-- 12. profiles - users manage own, admin all
-- =====================================================================
CREATE POLICY "profiles admin all" ON public.profiles
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "profiles self select" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles self insert" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles self update" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- =====================================================================
-- 13. notification_settings - users manage own, admin all
-- =====================================================================
CREATE POLICY "notifset admin all" ON public.notification_settings
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "notifset self all" ON public.notification_settings
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- =====================================================================
-- 14. trainers - public read, admin write, trainer self update
-- =====================================================================
CREATE POLICY "trainers read all" ON public.trainers
  FOR SELECT USING (true);
CREATE POLICY "trainers admin write" ON public.trainers
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "trainers self update" ON public.trainers
  FOR UPDATE TO authenticated USING (auth_id = auth.uid()) WITH CHECK (auth_id = auth.uid());

-- =====================================================================
-- 15. logs - admin only (inserts often from edge functions w/ service role - bypasses RLS)
-- =====================================================================
CREATE POLICY "actlog admin read" ON public.activity_logs
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "actlog insert any" ON public.activity_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "notiflog admin read" ON public.notification_logs
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "notiflog insert auth" ON public.notification_logs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "webhooklog admin read" ON public.webhook_delivery_logs
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "webhooklog insert auth" ON public.webhook_delivery_logs
  FOR INSERT TO authenticated WITH CHECK (true);
