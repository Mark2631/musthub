-- Production hardening for auth, rate-limit telemetry and baseline RLS.

CREATE TABLE IF NOT EXISTS public.auth_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  status text NOT NULL CHECK (status IN ('failed', 'success')),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.auth_login_attempts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'auth_login_attempts'
      AND policyname = 'service_role_manage_login_attempts'
  ) THEN
    CREATE POLICY "service_role_manage_login_attempts"
      ON public.auth_login_attempts
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'auth_login_attempts'
      AND policyname = 'allow_anon_insert_login_attempts'
  ) THEN
    CREATE POLICY "allow_anon_insert_login_attempts"
      ON public.auth_login_attempts
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_auth_login_attempts_email_created_at
  ON public.auth_login_attempts (email, created_at DESC);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
