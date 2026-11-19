-- ============================================================================
-- FlyeMass Firebase Cloud Messaging (FCM) & Push Notifications Engine
-- Tables: public.user_push_tokens, public.notifications
-- RPCs:   public.register_user_push_token, public.mark_notification_as_read,
--         public.mark_all_notifications_as_read
-- ============================================================================

-- 1. Push Tokens Registry for Multi-Platform Terminals (iOS, Android, Web)
CREATE TABLE IF NOT EXISTS public.user_push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  token text NOT NULL,
  platform text NOT NULL DEFAULT 'web' CHECK (platform IN ('ios', 'android', 'web')),
  device_info jsonb DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_push_tokens_user_token_unique UNIQUE (user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id ON public.user_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_token ON public.user_push_tokens(token);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_active ON public.user_push_tokens(is_active) WHERE is_active = true;

ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own push tokens" ON public.user_push_tokens;
CREATE POLICY "Users can view own push tokens" ON public.user_push_tokens
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid())::text = user_id);

DROP POLICY IF EXISTS "Users can insert own push tokens" ON public.user_push_tokens;
CREATE POLICY "Users can insert own push tokens" ON public.user_push_tokens
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid())::text = user_id);

DROP POLICY IF EXISTS "Users can update own push tokens" ON public.user_push_tokens;
CREATE POLICY "Users can update own push tokens" ON public.user_push_tokens
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid())::text = user_id)
  WITH CHECK ((SELECT auth.uid())::text = user_id);

DROP POLICY IF EXISTS "Users can delete own push tokens" ON public.user_push_tokens;
CREATE POLICY "Users can delete own push tokens" ON public.user_push_tokens
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid())::text = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_push_tokens TO authenticated;
GRANT ALL ON public.user_push_tokens TO service_role;

-- 2. In-App Notifications Feed & Event Store
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text, -- NULL or 'all' denotes general broadcast to all registered users
  title text NOT NULL,
  body text NOT NULL,
  type text NOT NULL DEFAULT 'system',
  metadata jsonb DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own and broadcast notifications" ON public.notifications;
CREATE POLICY "Users can read own and broadcast notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id IS NULL OR user_id = 'all' OR user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Users can update read status on own notifications" ON public.notifications;
CREATE POLICY "Users can update read status on own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

-- 3. Stored RPC: Register / Upsert User FCM Token
CREATE OR REPLACE FUNCTION public.register_user_push_token(
  p_user_id text,
  p_token text,
  p_platform text DEFAULT 'web',
  p_device_info jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF p_user_id IS NULL OR p_token IS NULL OR trim(p_token) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid user ID or token');
  END IF;

  INSERT INTO public.user_push_tokens (user_id, token, platform, device_info, is_active, updated_at)
  VALUES (p_user_id, trim(p_token), COALESCE(p_platform, 'web'), COALESCE(p_device_info, '{}'::jsonb), true, now())
  ON CONFLICT (user_id, token)
  DO UPDATE SET
    platform = EXCLUDED.platform,
    device_info = EXCLUDED.device_info,
    is_active = true,
    updated_at = now();

  RETURN jsonb_build_object('success', true, 'user_id', p_user_id, 'token', p_token);
END;
$$;

-- 4. Stored RPC: Mark Single Notification As Read
CREATE OR REPLACE FUNCTION public.mark_notification_as_read(
  p_notification_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = true, updated_at = now()
  WHERE id = p_notification_id
    AND (user_id = (SELECT auth.uid())::text OR user_id IS NULL OR user_id = 'all');

  RETURN jsonb_build_object('success', true, 'id', p_notification_id);
END;
$$;

-- 5. Stored RPC: Mark All Notifications As Read For Current User
CREATE OR REPLACE FUNCTION public.mark_all_notifications_as_read(
  p_user_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.notifications
  SET is_read = true, updated_at = now()
  WHERE is_read = false
    AND (user_id = p_user_id OR user_id = 'all' OR user_id IS NULL);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN jsonb_build_object('success', true, 'marked_count', v_count);
END;
$$;
