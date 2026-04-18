CREATE OR REPLACE FUNCTION public.seed_demo_listings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  uid uuid := auth.uid();
  current_count int;
BEGIN
  IF uid IS NULL THEN RETURN; END IF;
  SELECT count(*) INTO current_count FROM public.listings;
  IF current_count >= 5 THEN RETURN; END IF;

  INSERT INTO public.listings (user_id, type, title, description, price, negotiable, category, location, contact_phone, photos, videos, status) VALUES
    (uid, 'marketplace', 'HP EliteBook 840 G5 — Excellent condition', 'Intel Core i5 8th Gen, 8GB RAM, 256GB SSD. Battery 90%. Comes with charger.', 32000, true, 'Laptops & Computers', 'Near MUST main gate', '+254712345601', '{}', '{}', 'available'),
    (uid, 'marketplace', 'iPhone 11 64GB — Black', 'Original, no scratches, battery 87%. Box and charger included.', 28500, true, 'Phones & Accessories', 'MUST Hostel D', '+254712345602', '{}', '{}', 'available'),
    (uid, 'marketplace', 'Single mattress 4x6 — clean', 'Used 1 semester, very clean. Selling because graduating.', 1500, false, 'Household Goods & Furniture', 'Kithoka', '+254712345603', '{}', '{}', 'available'),
    (uid, 'marketplace', 'Ramtons 2-burner gas cooker', 'Used 6 months. Includes 6kg gas cylinder.', 5800, true, 'Household Goods & Furniture', 'Gitimene', '+254712345604', '{}', '{}', 'available'),
    (uid, 'service', 'Affordable braids & dreadlocks', 'Box braids, knotless braids, twists, locs maintenance. I come to your hostel.', 500, true, 'Beauty & Hair (nails, braiding, barber)', 'MUST Hostel B (mobile)', '+254712345605', '{}', '{}', 'available'),
    (uid, 'service', 'Calculus & Physics tutoring', '4th year BSc Physics student. Tutoring 1st & 2nd years. Per hour rate.', 300, false, 'Academic Tutoring', 'MUST Library area', '+254712345606', '{}', '{}', 'available'),
    (uid, 'service', 'Phone & laptop screen repairs', 'iPhone, Samsung, Tecno, HP, Lenovo. Same-day service. Genuine parts.', NULL, true, 'Phone/Laptop Repairs', 'Nchiru shopping centre', '+254712345610', '{}', '{}', 'available'),
    (uid, 'rental-info', 'Single self-contained room — own bathroom', 'Water + electricity included. 5 min walk from MUST main gate.', 4000, false, 'Self-Contained', 'Gitimene, near MUST', '+254712345607', '{}', '{}', 'available'),
    (uid, 'rental-info', 'Bedsitter near MUST gate', 'Spacious bedsitter, kitchen area, modern bathroom. WiFi-ready building.', 6000, true, 'Bedsitter', 'Kithoka, 3 min from gate', '+254712345608', '{}', '{}', 'available'),
    (uid, 'rental-info', 'One bedroom, fully fenced', 'Secure compound, parking, water tank backup.', 9500, false, 'One Bedroom', 'Nchiru, 10 min walk to MUST', '+254712345611', '{}', '{}', 'available');
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.seed_demo_listings() TO authenticated;

DO $pol$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Listing videos public read') THEN
    CREATE POLICY "Listing videos public read" ON storage.objects FOR SELECT USING (bucket_id = 'listing-videos');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users upload own listing videos') THEN
    CREATE POLICY "Users upload own listing videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'listing-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users delete own listing videos') THEN
    CREATE POLICY "Users delete own listing videos" ON storage.objects FOR DELETE USING (bucket_id = 'listing-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $pol$;