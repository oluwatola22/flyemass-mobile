-- ============================================================================
-- FlyeMass Enterprise KYC Verification & Compliance Engine
-- Tables: public.profiles (KYC columns), public.kyc_submissions
-- RPC:    public.review_kyc_submission
-- ============================================================================

-- 1. Extend public.profiles with structured KYC fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS kyc_status text NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS kyc_full_legal_name text,
  ADD COLUMN IF NOT EXISTS kyc_id_type text,
  ADD COLUMN IF NOT EXISTS kyc_id_number text,
  ADD COLUMN IF NOT EXISTS kyc_document_front_url text,
  ADD COLUMN IF NOT EXISTS kyc_document_back_url text,
  ADD COLUMN IF NOT EXISTS kyc_rejection_reason text,
  ADD COLUMN IF NOT EXISTS kyc_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS kyc_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS kyc_reviewed_by text;

-- 2. Dedicated KYC Submissions Queue Table
CREATE TABLE IF NOT EXISTS public.kyc_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  full_legal_name text NOT NULL,
  id_type text NOT NULL CHECK (id_type IN ('NIN', 'Drivers_License', 'International_Passport', 'Voters_Card')),
  id_number text NOT NULL,
  document_front_url text NOT NULL,
  document_back_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('unverified', 'pending', 'verified', 'rejected')),
  rejection_reason text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kyc_submissions_user_id ON public.kyc_submissions (user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_status ON public.kyc_submissions (status, submitted_at DESC);

ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own kyc submissions" ON public.kyc_submissions;
CREATE POLICY "Users can view own kyc submissions" ON public.kyc_submissions
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid())::text = user_id);

DROP POLICY IF EXISTS "Users can insert own kyc submissions" ON public.kyc_submissions;
CREATE POLICY "Users can insert own kyc submissions" ON public.kyc_submissions
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid())::text = user_id);

DROP POLICY IF EXISTS "Users can update own kyc submissions" ON public.kyc_submissions;
CREATE POLICY "Users can update own kyc submissions" ON public.kyc_submissions
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid())::text = user_id)
  WITH CHECK ((SELECT auth.uid())::text = user_id);

GRANT SELECT, INSERT, UPDATE ON public.kyc_submissions TO authenticated;

-- 3. Atomic Admin Review RPC: review_kyc_submission
CREATE OR REPLACE FUNCTION public.review_kyc_submission(
  p_submission_id uuid,
  p_user_id text,
  p_action text, -- 'approve' | 'reject'
  p_rejection_reason text DEFAULT NULL,
  p_admin_name text DEFAULT 'Compliance Officer'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_new_status text;
  v_sub public.kyc_submissions;
BEGIN
  IF p_action = 'approve' THEN
    v_new_status := 'verified';
  ELSIF p_action = 'reject' THEN
    v_new_status := 'rejected';
  ELSE
    v_new_status := 'unverified';
  END IF;

  UPDATE public.kyc_submissions
  SET status = v_new_status,
      rejection_reason = CASE WHEN v_new_status = 'rejected' THEN p_rejection_reason ELSE NULL END,
      reviewed_at = now(),
      reviewed_by = p_admin_name,
      updated_at = now()
  WHERE id = p_submission_id OR user_id = p_user_id
  RETURNING * INTO v_sub;

  UPDATE public.profiles
  SET kyc_status = v_new_status,
      kyc_rejection_reason = CASE WHEN v_new_status = 'rejected' THEN p_rejection_reason ELSE NULL END,
      kyc_reviewed_at = now(),
      kyc_reviewed_by = p_admin_name,
      updated_at = now()
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'kyc_status', v_new_status,
    'submission', to_jsonb(v_sub)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.review_kyc_submission(uuid, text, text, text, text) TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'kyc_submissions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kyc_submissions;
  END IF;
END $$;
