CREATE TABLE public.blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker, blocked),
  CHECK (blocker <> blocked)
);
GRANT SELECT, INSERT, DELETE ON public.blocks TO authenticated;
GRANT ALL ON public.blocks TO service_role;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own blocks" ON public.blocks FOR SELECT TO authenticated USING (blocker = public.my_profile_id());
CREATE POLICY "Users add own blocks" ON public.blocks FOR INSERT TO authenticated WITH CHECK (blocker = public.my_profile_id());
CREATE POLICY "Users remove own blocks" ON public.blocks FOR DELETE TO authenticated USING (blocker = public.my_profile_id());

CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 60),
  details text NOT NULL DEFAULT '' CHECK (char_length(details) <= 1000),
  match_id uuid REFERENCES public.matches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (reporter <> reported)
);
GRANT INSERT ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users file reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (reporter = public.my_profile_id());

-- Profiles hidden from me in either direction
CREATE OR REPLACE FUNCTION public.blocked_profile_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT blocked FROM public.blocks WHERE blocker = public.my_profile_id()
  UNION
  SELECT blocker FROM public.blocks WHERE blocked = public.my_profile_id()
$$;
GRANT EXECUTE ON FUNCTION public.blocked_profile_ids() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_blocked_between(a uuid, b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.blocks WHERE (blocker = a AND blocked = b) OR (blocker = b AND blocked = a))
$$;

DROP POLICY "Match members send messages" ON public.messages;
CREATE POLICY "Match members send messages" ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  sender = public.my_profile_id() AND EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = messages.match_id
      AND (m.profile_a = messages.sender OR m.profile_b = messages.sender)
      AND NOT public.is_blocked_between(m.profile_a, m.profile_b)
  )
);