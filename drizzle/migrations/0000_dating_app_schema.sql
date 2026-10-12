CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  age int NOT NULL,
  gender text NOT NULL DEFAULT 'woman',
  interested_in text NOT NULL DEFAULT 'everyone',
  min_age int NOT NULL DEFAULT 18,
  max_age int NOT NULL DEFAULT 60,
  bio text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  interests text[] NOT NULL DEFAULT '{}',
  photo_url text,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.my_profile_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE POLICY "Signed-in users can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users create own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND is_demo = false);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND is_demo = false);
CREATE POLICY "Users delete own profile" ON public.profiles FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.swipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  swiper uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  liked boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (swiper, target),
  CHECK (swiper <> target)
);
GRANT SELECT, INSERT, DELETE ON public.swipes TO authenticated;
GRANT ALL ON public.swipes TO service_role;
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own swipes" ON public.swipes FOR SELECT TO authenticated USING (swiper = public.my_profile_id());
CREATE POLICY "Users add own swipes" ON public.swipes FOR INSERT TO authenticated WITH CHECK (swiper = public.my_profile_id());
CREATE POLICY "Users reset own swipes" ON public.swipes FOR DELETE TO authenticated USING (swiper = public.my_profile_id());

CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_a uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_b uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_a, profile_b),
  CHECK (profile_a < profile_b)
);
GRANT SELECT ON public.matches TO authenticated;
GRANT ALL ON public.matches TO service_role;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own matches" ON public.matches FOR SELECT TO authenticated
  USING (profile_a = public.my_profile_id() OR profile_b = public.my_profile_id());

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_match_created_idx ON public.messages (match_id, created_at);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Match members read messages" ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id
    AND (m.profile_a = public.my_profile_id() OR m.profile_b = public.my_profile_id())));
CREATE POLICY "Match members send messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender = public.my_profile_id() AND EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id
    AND (m.profile_a = sender OR m.profile_b = sender)));

-- Create a match on mutual like (demo profiles always like back)
CREATE OR REPLACE FUNCTION public.handle_new_swipe()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target_demo boolean;
BEGIN
  IF NEW.liked THEN
    SELECT is_demo INTO target_demo FROM public.profiles WHERE id = NEW.target;
    IF target_demo OR EXISTS (SELECT 1 FROM public.swipes WHERE swiper = NEW.target AND target = NEW.swiper AND liked) THEN
      INSERT INTO public.matches (profile_a, profile_b)
      VALUES (LEAST(NEW.swiper, NEW.target), GREATEST(NEW.swiper, NEW.target))
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_swipe_created AFTER INSERT ON public.swipes FOR EACH ROW EXECUTE FUNCTION public.handle_new_swipe();

-- Demo profiles reply with a friendly canned message
CREATE OR REPLACE FUNCTION public.handle_demo_reply()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m record; other_id uuid; other_demo boolean;
  replies text[] := ARRAY[
    'Haha, that made me smile! Tell me more 😊',
    'Okay I like your vibe. What are you up to this weekend?',
    'Great question! I would say coffee first, adventures second ☕',
    'You seem fun. Dinner sometime?',
    'Ha! I was hoping you would say that 💛'];
BEGIN
  SELECT * INTO m FROM public.matches WHERE id = NEW.match_id;
  other_id := CASE WHEN m.profile_a = NEW.sender THEN m.profile_b ELSE m.profile_a END;
  SELECT is_demo INTO other_demo FROM public.profiles WHERE id = other_id;
  IF other_demo AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.sender AND is_demo) THEN
    INSERT INTO public.messages (match_id, sender, body)
    VALUES (NEW.match_id, other_id, replies[1 + floor(random() * array_length(replies, 1))::int]);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_message_created AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.handle_demo_reply();

REVOKE EXECUTE ON FUNCTION public.handle_new_swipe() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_demo_reply() FROM PUBLIC, anon, authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;

-- Storage policies for avatars
CREATE POLICY "Avatars are public" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own avatar" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Demo profiles
INSERT INTO public.profiles (display_name, age, gender, interested_in, bio, city, interests, photo_url, is_demo) VALUES
('Sofia', 27, 'woman', 'everyone', 'Sunset chaser and amateur ceramicist. I will absolutely beat you at mini golf.', 'Barcelona', ARRAY['Pottery','Travel','Mini golf','Wine'], 'demo:1', true),
('Daniel', 29, 'man', 'everyone', 'Weekend hiker, weekday engineer. Looking for someone to share trail snacks with.', 'New York', ARRAY['Hiking','Coffee','Cooking','Dogs'], 'demo:2', true),
('Amara', 25, 'woman', 'everyone', 'Cafe hopper with a laugh that is too loud. Ask me about my plant collection.', 'London', ARRAY['Cafes','Plants','Books','Yoga'], 'demo:3', true),
('Leo', 28, 'man', 'everyone', 'Golden hour photographer. I know every good rooftop in the city.', 'Lisbon', ARRAY['Photography','Music','Rooftops','Surfing'], 'demo:4', true),
('Mia', 26, 'woman', 'everyone', 'Farmers market regular. Will trade you my best sourdough tips for your favorite playlist.', 'Portland', ARRAY['Baking','Markets','Running','Indie music'], 'demo:5', true),
('Noah', 31, 'man', 'everyone', 'Bookshop wanderer and bad-joke collector. Strong opinions about coffee.', 'Berlin', ARRAY['Books','Coffee','Board games','Cinema'], 'demo:6', true);