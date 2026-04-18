-- =========================================
-- MESSAGING
-- =========================================
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  last_message TEXT,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (listing_id, buyer_id, seller_id)
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants view conversations"
  ON public.conversations FOR SELECT TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyer can create conversation"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Participants can update last message"
  ON public.conversations FOR UPDATE TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE INDEX idx_conv_buyer ON public.conversations(buyer_id, last_message_at DESC);
CREATE INDEX idx_conv_seller ON public.conversations(seller_id, last_message_at DESC);

CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants view messages"
  ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
  ));

CREATE POLICY "Participants send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

CREATE INDEX idx_messages_conv ON public.messages(conversation_id, created_at);

-- Trigger: bump conversation last_message + last_message_at
CREATE OR REPLACE FUNCTION public.bump_conversation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.conversations
    SET last_message = NEW.body, last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_bump_conversation
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.bump_conversation();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- =========================================
-- COMMUNITY FEED
-- =========================================
CREATE TABLE public.community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 1000),
  photo_url TEXT,
  video_url TEXT,
  related_listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts viewable by everyone"
  ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "Users create own posts"
  ON public.community_posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own posts"
  ON public.community_posts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users delete own posts"
  ON public.community_posts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_posts_recent ON public.community_posts(created_at DESC);
CREATE INDEX idx_posts_user ON public.community_posts(user_id, created_at DESC);

CREATE TRIGGER trg_posts_updated
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;

-- Likes
CREATE TABLE public.post_likes (
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes viewable by everyone"
  ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Users like posts"
  ON public.post_likes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users unlike own"
  ON public.post_likes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Comments
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 280),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments viewable by everyone"
  ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Users add comments"
  ON public.post_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own comments"
  ON public.post_comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_comments_post ON public.post_comments(post_id, created_at);

-- =========================================
-- Storage bucket for community media
-- =========================================
INSERT INTO storage.buckets (id, name, public) VALUES ('community-media', 'community-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Community media public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'community-media');

CREATE POLICY "Users upload own community media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'community-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own community media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'community-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =========================================
-- Updated seed function with image URLs
-- =========================================
CREATE OR REPLACE FUNCTION public.seed_demo_listings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
      ARRAY['https://picsum.photos/id/1080/600/400','https://picsum.photos/id/292/600/400'], '{}', 'available'),
    (uid, 'service', 'Affordable braids & dreadlocks', 'Box braids, knotless braids, twists, locs maintenance. I come to your hostel.', 500, true, 'Beauty & Hair (nails, braiding, barber)', 'MUST Hostel B (mobile)', '+254712345605',
      ARRAY['https://picsum.photos/id/64/600/400','https://picsum.photos/id/251/600/400'], '{}', 'available'),
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
$$;