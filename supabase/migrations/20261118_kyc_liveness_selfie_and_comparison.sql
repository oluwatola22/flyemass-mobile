-- ============================================================================
-- FlyeMass Enterprise KYC Liveness & Circular Selfie Verification Schema
-- Tables: public.profiles, public.kyc_submissions
-- Storage: kyc-documents (Private Bucket with Owner/Admin RLS)
-- ============================================================================

-- 1. Extend public.profiles and public.kyc_submissions with selfie_photo_url
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS kyc_selfie_photo_url text,
  ADD COLUMN IF NOT EXISTS kyc_selfie_captured_at timestamptz;

ALTER TABLE public.kyc_submissions
  ADD COLUMN IF NOT EXISTS id_document_url text,
  ADD COLUMN IF NOT EXISTS selfie_photo_url text,
  ADD COLUMN IF NOT EXISTS selfie_captured_at timestamptz DEFAULT now();

-- Ensure id_document_url syncs with document_front_url
UPDATE public.kyc_submissions
SET id_document_url = document_front_url
WHERE id_document_url IS NULL AND document_front_url IS NOT NULL;

-- 2. Storage Bucket Creation for Secure KYC Documents & Live Selfies
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents',
  'kyc-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- 3. Storage RLS Policies for kyc-documents
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can upload own KYC documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload own KYC documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'kyc-documents' AND
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "Authenticated users can view own KYC documents" ON storage.objects;
CREATE POLICY "Authenticated users can view own KYC documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'kyc-documents' AND
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- 4. Constraint Enforcement: Require both ID document and Live Selfie for submission
CREATE OR REPLACE FUNCTION public.check_kyc_submission_assets()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (NEW.document_front_url IS NULL AND NEW.id_document_url IS NULL) THEN
    RAISE EXCEPTION 'KYC submission requires a valid government-issued ID document photo';
  END IF;

  IF NEW.selfie_photo_url IS NULL OR length(trim(NEW.selfie_photo_url)) = 0 THEN
    RAISE EXCEPTION 'KYC submission requires a live circular facial selfie snapshot';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_kyc_submission_assets ON public.kyc_submissions;
CREATE TRIGGER trg_validate_kyc_submission_assets
  BEFORE INSERT OR UPDATE ON public.kyc_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_kyc_submission_assets();
