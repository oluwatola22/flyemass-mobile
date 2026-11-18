-- ============================================================================
-- FlyeMass Native Biometrics & Live Device Switching Migration Engine
-- Tables: public.user_devices, public.device_migration_requests
-- RPC:    public.authorize_new_device
-- ============================================================================

-- 1. Real-Time Device Registry & Active Terminal Tracking
CREATE TABLE IF NOT EXISTS public.user_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  device_id text NOT NULL,
  device_name text NOT NULL,
  platform text NOT NULL DEFAULT 'web',
  biometric_type text NOT NULL DEFAULT 'none',
  ip_address text,
  user_agent text,
  hardware_key_id text,
  last_active_at timestamptz NOT NULL DEFAULT now(),
  is_primary boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_devices_user_device_unique UNIQUE (user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_user_devices_user_primary
  ON public.user_devices (user_id, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_user_devices_user_status
  ON public.user_devices (user_id, status);

ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own devices" ON public.user_devices;
CREATE POLICY "Users can view own devices" ON public.user_devices
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid())::text = user_id);

DROP POLICY IF EXISTS "Users can register own devices" ON public.user_devices;
CREATE POLICY "Users can register own devices" ON public.user_devices
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid())::text = user_id);

DROP POLICY IF EXISTS "Users can update own devices" ON public.user_devices;
CREATE POLICY "Users can update own devices" ON public.user_devices
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid())::text = user_id)
  WITH CHECK ((SELECT auth.uid())::text = user_id);

DROP POLICY IF EXISTS "Users can delete own devices" ON public.user_devices;
CREATE POLICY "Users can delete own devices" ON public.user_devices
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid())::text = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_devices TO authenticated;

-- 2. Live QR Sync Device Migration Requests (60-second cryptographic tokens)
CREATE TABLE IF NOT EXISTS public.device_migration_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  user_id text NOT NULL,
  requesting_device_id text NOT NULL,
  requesting_device_name text NOT NULL,
  requesting_platform text NOT NULL DEFAULT 'web',
  requesting_ip text,
  approved_by_device_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'expired', 'rejected')),
  expires_at timestamptz NOT NULL,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_migration_token ON public.device_migration_requests (token);
CREATE INDEX IF NOT EXISTS idx_device_migration_user_status ON public.device_migration_requests (user_id, status);

ALTER TABLE public.device_migration_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own migration requests" ON public.device_migration_requests;
CREATE POLICY "Users can view own migration requests" ON public.device_migration_requests
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid())::text = user_id);

DROP POLICY IF EXISTS "Users can create own migration requests" ON public.device_migration_requests;
CREATE POLICY "Users can create own migration requests" ON public.device_migration_requests
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid())::text = user_id);

DROP POLICY IF EXISTS "Users can update own migration requests" ON public.device_migration_requests;
CREATE POLICY "Users can update own migration requests" ON public.device_migration_requests
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid())::text = user_id)
  WITH CHECK ((SELECT auth.uid())::text = user_id);

GRANT SELECT, INSERT, UPDATE ON public.device_migration_requests TO authenticated;

-- 3. Atomic RPC: authorize_new_device
CREATE OR REPLACE FUNCTION public.authorize_new_device(
  p_user_id text,
  p_device_id text,
  p_device_name text,
  p_platform text DEFAULT 'web',
  p_biometric_type text DEFAULT 'webauthn',
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_hardware_key_id text DEFAULT NULL,
  p_migration_token text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_revoked_count integer := 0;
  v_device public.user_devices;
BEGIN
  -- Enforce ownership for authenticated callers
  IF (SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid())::text <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized device migration attempt';
  END IF;

  -- Revoke previous primary/active devices for this user
  UPDATE public.user_devices
  SET is_primary = false,
      status = 'revoked',
      updated_at = now()
  WHERE user_id = p_user_id
    AND device_id <> p_device_id
    AND (is_primary = true OR status = 'active');

  GET DIAGNOSTICS v_revoked_count = ROW_COUNT;

  -- Promote or insert the new primary authorized device
  INSERT INTO public.user_devices (
    user_id,
    device_id,
    device_name,
    platform,
    biometric_type,
    ip_address,
    user_agent,
    hardware_key_id,
    last_active_at,
    is_primary,
    status,
    updated_at
  )
  VALUES (
    p_user_id,
    p_device_id,
    p_device_name,
    COALESCE(p_platform, 'web'),
    COALESCE(p_biometric_type, 'webauthn'),
    p_ip_address,
    p_user_agent,
    p_hardware_key_id,
    now(),
    true,
    'active',
    now()
  )
  ON CONFLICT (user_id, device_id) DO UPDATE SET
    device_name = EXCLUDED.device_name,
    platform = EXCLUDED.platform,
    biometric_type = EXCLUDED.biometric_type,
    ip_address = COALESCE(EXCLUDED.ip_address, public.user_devices.ip_address),
    user_agent = COALESCE(EXCLUDED.user_agent, public.user_devices.user_agent),
    hardware_key_id = COALESCE(EXCLUDED.hardware_key_id, public.user_devices.hardware_key_id),
    last_active_at = now(),
    is_primary = true,
    status = 'active',
    updated_at = now()
  RETURNING * INTO v_device;

  -- Mark migration request as approved if authorized via QR Sync
  IF p_migration_token IS NOT NULL THEN
    UPDATE public.device_migration_requests
    SET status = 'approved',
        approved_at = now(),
        approved_by_device_id = p_device_id
    WHERE token = p_migration_token
      AND user_id = p_user_id
      AND status = 'pending';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'revoked_count', v_revoked_count,
    'device', to_jsonb(v_device)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.authorize_new_device(text, text, text, text, text, text, text, text, text) TO authenticated;

-- 4. Enable Supabase Realtime on both tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'user_devices'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_devices;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'device_migration_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.device_migration_requests;
  END IF;
END $$;
