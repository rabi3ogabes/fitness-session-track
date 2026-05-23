
DELETE FROM public.members WHERE email IN ('admin@gym.com','trainer@gym.com');

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
  v_phone text;
  v_dob text;
  v_gender text;
BEGIN
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.email);
  v_phone := COALESCE(NEW.raw_user_meta_data->>'phone_number', NEW.raw_user_meta_data->>'phone', '');
  v_dob := NEW.raw_user_meta_data->>'date_of_birth';
  v_gender := NEW.raw_user_meta_data->>'gender';

  INSERT INTO public.profiles (id, email, name, phone_number, gender)
  VALUES (NEW.id, NEW.email, v_name, v_phone, v_gender)
  ON CONFLICT (id) DO NOTHING;

  IF NEW.email NOT IN ('admin@gym.com','trainer@gym.com')
     AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id AND role IN ('admin','trainer'))
     AND NOT EXISTS (SELECT 1 FROM public.trainers WHERE email = NEW.email) THEN
    INSERT INTO public.members (name, email, phone, birthday, membership, sessions, remaining_sessions, status, gender, count_credit)
    SELECT v_name, NEW.email, v_phone, v_dob, 'null', 0, 0, 'Active', COALESCE(v_gender, 'Not specified'), false
    WHERE NOT EXISTS (SELECT 1 FROM public.members WHERE email = NEW.email);
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;
