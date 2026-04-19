
-- 1. Avatar URL on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. Roles system (separate table to prevent privilege escalation)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
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

DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins view all roles" ON public.user_roles;
CREATE POLICY "Admins view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 3. Reports: allow community post reports
ALTER TABLE public.reports ALTER COLUMN listing_id DROP NOT NULL;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS post_id uuid;

DROP POLICY IF EXISTS "Admins view all reports" ON public.reports;
CREATE POLICY "Admins view all reports" ON public.reports
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete reports" ON public.reports;
CREATE POLICY "Admins delete reports" ON public.reports
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 4. Admin moderation policies on listings & community content
DROP POLICY IF EXISTS "Admins delete any listing" ON public.listings;
CREATE POLICY "Admins delete any listing" ON public.listings
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete any post" ON public.community_posts;
CREATE POLICY "Admins delete any post" ON public.community_posts
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete any comment" ON public.post_comments;
CREATE POLICY "Admins delete any comment" ON public.post_comments
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 5. Avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar images publicly readable" ON storage.objects;
CREATE POLICY "Avatar images publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
CREATE POLICY "Users upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
CREATE POLICY "Users update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users delete own avatar" ON storage.objects;
CREATE POLICY "Users delete own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 6. Refresh seed function with rich images
CREATE OR REPLACE FUNCTION public.seed_demo_listings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  uid uuid := auth.uid();
  current_count int;
BEGIN
  IF uid IS NULL THEN RETURN; END IF;
  SELECT count(*) INTO current_count FROM public.listings;
  IF current_count >= 5 THEN RETURN; END IF;

  INSERT INTO public.listings (user_id, type, title, description, price, negotiable, category, location, contact_phone, photos, videos, status) VALUES
    (uid, 'marketplace', 'HP EliteBook 840 G5 — Excellent condition', 'Intel Core i5 8th Gen, 8GB RAM, 256GB SSD. Battery 90%. Comes with charger.', 32000, true, 'Laptops & Computers', 'Near MUST main gate', '+254712345601',
      ARRAY['https://picsum.photos/id/201/600/400','https://picsum.photos/id/119/600/400'], '{}', 'available'),
    (uid, 'marketplace', 'iPhone 11 64GB — Black', 'Original, no scratches, battery 87%. Box and charger included.', 28500, true, 'Phones & Accessories', 'MUST Hostel D', '+254712345602',
      ARRAY['https://picsum.photos/id/180/600/400','https://picsum.photos/id/250/600/400'], '{}', 'available'),
    (uid, 'marketplace', 'Single mattress 4x6 — clean', 'Used 1 semester, very clean. Selling because graduating.', 1500, false, 'Household Goods & Furniture', 'Kithoka', '+254712345603',
      ARRAY['https://picsum.photos/id/1015/600/400'], '{}', 'available'),
    (uid, 'marketplace', 'Ramtons 2-burner gas cooker', 'Used 6 months. Includes 6kg gas cylinder.', 5800, true, 'Household Goods & Furniture', 'Gitimene', '+254712345604',
      ARRAY['https://picsum.photos/id/1015/600/400','https://picsum.photos/id/292/600/400'], '{}', 'available'),
    (uid, 'marketplace', 'Calculus textbook + notes bundle', 'Stewart Calculus 8th edition + my organized handwritten notes. Saved my GPA.', 1200, true, 'Books & Stationery', 'MUST Library', '+254712345609',
      ARRAY['https://picsum.photos/id/133/600/400'], '{}', 'available'),
    (uid, 'marketplace', 'Trendy hoodie & sneakers — size M/42', 'Worn twice, like new. Selling because of size.', 2200, true, 'Clothing & Shoes', 'MUST Hostel A', '+254712345612',
      ARRAY['https://picsum.photos/id/251/600/400'], '{}', 'available'),
    (uid, 'service', 'Affordable braids & dreadlocks', 'Box braids, knotless braids, twists, locs maintenance. I come to your hostel.', 500, true, 'Beauty & Hair (nails, braiding, barber)', 'MUST Hostel B (mobile)', '+254712345605',
      ARRAY['https://picsum.photos/id/64/600/400'], '{}', 'available'),
    (uid, 'service', 'Calculus & Physics tutoring', '4th year BSc Physics student. Tutoring 1st & 2nd years. Per hour rate.', 300, false, 'Academic Tutoring', 'MUST Library area', '+254712345606',
      ARRAY['https://picsum.photos/id/24/600/400'], '{}', 'available'),
    (uid, 'service', 'Phone & laptop screen repairs', 'iPhone, Samsung, Tecno, HP, Lenovo. Same-day service. Genuine parts.', NULL, true, 'Phone/Laptop Repairs', 'Nchiru shopping centre', '+254712345610',
      ARRAY['https://picsum.photos/id/0/600/400','https://picsum.photos/id/180/600/400'], '{}', 'available'),
    (uid, 'rental-info', 'Single self-contained room — own bathroom', 'Water + electricity included. 5 min walk from MUST main gate.', 4000, false, 'Self-Contained', 'Gitimene, near MUST', '+254712345607',
      ARRAY['https://picsum.photos/id/133/600/400','https://picsum.photos/id/870/600/400'], '{}', 'available'),
    (uid, 'rental-info', 'Bedsitter near MUST gate', 'Spacious bedsitter, kitchen area, modern bathroom. WiFi-ready building.', 6000, true, 'Bedsitter', 'Kithoka, 3 min from gate', '+254712345608',
      ARRAY['https://picsum.photos/id/870/600/400','https://picsum.photos/id/164/600/400'], '{}', 'available'),
    (uid, 'rental-info', 'One bedroom, fully fenced', 'Secure compound, parking, water tank backup.', 9500, false, 'One Bedroom', 'Nchiru, 10 min walk to MUST', '+254712345611',
      ARRAY['https://picsum.photos/id/164/600/400','https://picsum.photos/id/133/600/400'], '{}', 'available');
END;
$function$;
