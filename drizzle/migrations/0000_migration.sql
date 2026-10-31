CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  founder_profile text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.startups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  idea text NOT NULL,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX startups_user_idx ON public.startups(user_id, created_at DESC);

CREATE TABLE public.analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  startup_id uuid REFERENCES public.startups(id) ON DELETE SET NULL,
  idea text NOT NULL,
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX analyses_user_idx ON public.analyses(user_id, created_at DESC);

CREATE TABLE public.roadmaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  startup_id uuid REFERENCES public.startups(id) ON DELETE SET NULL,
  idea text NOT NULL,
  plan jsonb NOT NULL,
  completed jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX roadmaps_user_idx ON public.roadmaps(user_id, created_at DESC);

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chat_user_idx ON public.chat_messages(user_id, created_at);

CREATE TABLE public.eligibility_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  profile text NOT NULL,
  requirements text NOT NULL,
  file_path text,
  file_name text,
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX elig_user_idx ON public.eligibility_checks(user_id, created_at DESC);

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['startups','analyses','roadmaps','chat_messages','eligibility_checks'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "own select" ON public.%I FOR SELECT TO authenticated USING (auth.uid() = user_id)', t);
    EXECUTE format('CREATE POLICY "own insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)', t);
    EXECUTE format('CREATE POLICY "own update" ON public.%I FOR UPDATE TO authenticated USING (auth.uid() = user_id)', t);
    EXECUTE format('CREATE POLICY "own delete" ON public.%I FOR DELETE TO authenticated USING (auth.uid() = user_id)', t);
  END LOOP;
END $$;

CREATE POLICY "own docs select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'eligibility-docs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own docs insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'eligibility-docs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own docs delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'eligibility-docs' AND (storage.foldername(name))[1] = auth.uid()::text);