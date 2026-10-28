-- ==========================================================
-- SUPABASE STORAGE BUCKET & RLS POLICIES FOR 3D PRINTING IP PROTECTION
-- ==========================================================

-- 1. Create Private Storage Bucket for 3D Files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  '3d-models',
  '3d-models',
  false, -- STRICTLY PRIVATE: No public direct links
  104857600, -- 100 MB max file size
  ARRAY[
    'model/stl',
    'application/sla',
    'application/octet-stream',
    'application/vnd.ms-pki.stl',
    'model/step',
    'model/obj'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS Policies: Intellectual Property Access Control
CREATE POLICY "Clients can upload their 3D models"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = '3d-models'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Clients can read and download their own 3D models"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = '3d-models'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Assigned Makers can read and download model for active orders"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = '3d-models'
  AND EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.maker_id = auth.uid()
      AND o.file_url LIKE '%' || name || '%'
      AND o.status NOT IN ('cancelled', 'completed')
  )
);
