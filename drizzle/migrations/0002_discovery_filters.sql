ALTER TABLE public.profiles
  ADD COLUMN latitude double precision,
  ADD COLUMN longitude double precision,
  ADD COLUMN max_distance_km integer NOT NULL DEFAULT 500,
  ADD COLUMN filter_interests text[] NOT NULL DEFAULT '{}',
  ADD COLUMN sort_by_shared boolean NOT NULL DEFAULT true;