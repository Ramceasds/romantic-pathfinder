CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- First signed-in user may claim admin only while no admin exists.
CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RETURN false;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin');
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.claim_first_admin() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
$$;
GRANT EXECUTE ON FUNCTION public.admin_exists() TO authenticated;

ALTER TABLE public.reports ADD COLUMN status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved','dismissed'));
GRANT SELECT, UPDATE ON public.reports TO authenticated;
CREATE POLICY "Admins read reports" ON public.reports FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update reports" ON public.reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.profiles ADD COLUMN suspended boolean NOT NULL DEFAULT false;

CREATE TABLE public.moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES public.reports(id) ON DELETE SET NULL,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  moderator uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('dismiss','warn','suspend','unsuspend','note')),
  note text NOT NULL DEFAULT '' CHECK (char_length(note) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.moderation_actions TO authenticated;
GRANT ALL ON public.moderation_actions TO service_role;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read actions" ON public.moderation_actions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins add actions" ON public.moderation_actions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') AND moderator = auth.uid());

-- Apply suspend/unsuspend to the profile when an action is recorded
CREATE OR REPLACE FUNCTION public.apply_moderation_action()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.action = 'suspend' THEN UPDATE public.profiles SET suspended = true WHERE id = NEW.profile_id;
  ELSIF NEW.action = 'unsuspend' THEN UPDATE public.profiles SET suspended = false WHERE id = NEW.profile_id;
  END IF;
  IF NEW.report_id IS NOT NULL AND NEW.action <> 'note' THEN
    UPDATE public.reports SET status = CASE WHEN NEW.action = 'dismiss' THEN 'dismissed' ELSE 'resolved' END WHERE id = NEW.report_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_moderation_action AFTER INSERT ON public.moderation_actions FOR EACH ROW EXECUTE FUNCTION public.apply_moderation_action();

-- Users cannot change their own suspension flag
CREATE OR REPLACE FUNCTION public.protect_suspended()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.suspended IS DISTINCT FROM OLD.suspended AND current_user = 'authenticated' THEN
    NEW.suspended := OLD.suspended;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER protect_suspended BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_suspended();
CREATE OR REPLACE FUNCTION public.protect_suspended_insert()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user = 'authenticated' THEN NEW.suspended := false; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER protect_suspended_insert BEFORE INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_suspended_insert();

-- Admins can read chats tied to reports
CREATE POLICY "Admins read matches" ON public.matches FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins read messages" ON public.messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Suspended users can't send messages
DROP POLICY "Match members send messages" ON public.messages;
CREATE POLICY "Match members send messages" ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  sender = public.my_profile_id()
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = messages.sender AND p.suspended)
  AND EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = messages.match_id
      AND (m.profile_a = messages.sender OR m.profile_b = messages.sender)
      AND NOT public.is_blocked_between(m.profile_a, m.profile_b)
  )
);