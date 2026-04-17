
-- Extend listing_type enum with rental-info
ALTER TYPE public.listing_type ADD VALUE IF NOT EXISTS 'rental-info';

-- Profiles: onboarding, verification, role
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarded boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS interests text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS user_role text NOT NULL DEFAULT 'both',
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS school_id_path text,
  ADD COLUMN IF NOT EXISTS is_verified_seller boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS seller_agreed_at timestamptz;

-- Listings: negotiable, videos, rental fields
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS negotiable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS videos text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS monthly_rent numeric,
  ADD COLUMN IF NOT EXISTS deposit numeric,
  ADD COLUMN IF NOT EXISTS amenities text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS distance_from_campus text;

-- Reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reporters can insert reports" ON public.reports;
CREATE POLICY "Reporters can insert reports"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Reporters view own reports" ON public.reports;
CREATE POLICY "Reporters view own reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public)
  VALUES ('school-ids', 'school-ids', false)
  ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
  VALUES ('listing-videos', 'listing-videos', true)
  ON CONFLICT (id) DO NOTHING;

-- school-ids policies (private, owner-only)
DROP POLICY IF EXISTS "Users read own school id" ON storage.objects;
CREATE POLICY "Users read own school id"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'school-ids' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users upload own school id" ON storage.objects;
CREATE POLICY "Users upload own school id"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'school-ids' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users update own school id" ON storage.objects;
CREATE POLICY "Users update own school id"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'school-ids' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users delete own school id" ON storage.objects;
CREATE POLICY "Users delete own school id"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'school-ids' AND auth.uid()::text = (storage.foldername(name))[1]);

-- listing-videos policies (public read, owner write)
DROP POLICY IF EXISTS "Listing videos public read" ON storage.objects;
CREATE POLICY "Listing videos public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-videos');

DROP POLICY IF EXISTS "Users upload own listing videos" ON storage.objects;
CREATE POLICY "Users upload own listing videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'listing-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users update own listing videos" ON storage.objects;
CREATE POLICY "Users update own listing videos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'listing-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users delete own listing videos" ON storage.objects;
CREATE POLICY "Users delete own listing videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'listing-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
