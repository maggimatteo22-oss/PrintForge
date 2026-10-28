-- ==========================================================
-- PRINTFORGE 3D MARKETPLACE - COMPLETE SUPABASE DATABASE SCHEMA
-- ==========================================================

-- 1. Enable PostGIS and UUID Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. ENUM Types
CREATE TYPE user_role AS ENUM ('client', 'maker', 'admin');
CREATE TYPE printer_technology AS ENUM ('FDM', 'SLA', 'SLS');
CREATE TYPE order_status AS ENUM (
  'pending_matching',           -- Richiesta creata, ricerca maker
  'assigned_pending_acceptance',-- Assegnato a maker (finestra 4h)
  'approved',                   -- Accettato dal maker, fondi trattenuti in Escrow
  'queued',                     -- In coda di slicing
  'printing',                   -- In fase di stampa
  'post_processing',            -- Pulizia e rimozione supporti / cura UV
  'qa_review',                  -- Foto caricate per controllo qualità AI
  'ready_for_pickup',           -- Approvato QA, pronto per ritiro o spedizione
  'completed',                  -- Confermato dal cliente, Escrow rilasciato
  'cancelled',                  -- Annullato o rimborsato
  'disputed'                    -- Segnalazione aperta
);
CREATE TYPE qa_status_type AS ENUM ('pending', 'approved', 'rejected');

-- 3. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'client',
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  
  -- Fiscal / Business Status
  is_business BOOLEAN NOT NULL DEFAULT FALSE, -- FALSE = Hobbista (art. 67 DPR 917/86), TRUE = Professionista P.IVA
  vat_number TEXT,                            -- Partita IVA
  tax_id TEXT,                                -- Codice Fiscale
  billing_address JSONB,
  
  -- Geolocation (PostGIS geography point: EPSG 4326)
  location GEOGRAPHY(POINT, 4326),
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'IT',
  
  -- Stripe Connect Escrow & KYC
  stripe_account_id TEXT UNIQUE,
  stripe_charges_enabled BOOLEAN DEFAULT FALSE,
  stripe_payouts_enabled BOOLEAN DEFAULT FALSE,
  stripe_details_submitted BOOLEAN DEFAULT FALSE,
  
  -- Maker Performance Metrics (for Smart Matching)
  rating_average NUMERIC(3, 2) DEFAULT 5.00 CHECK (rating_average >= 0 AND rating_average <= 5.00),
  rating_count INTEGER DEFAULT 0,
  completion_rate NUMERIC(5, 2) DEFAULT 100.00 CHECK (completion_rate >= 0 AND completion_rate <= 100.00),
  max_active_orders INTEGER DEFAULT 3,
  active_orders_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);

-- 4. Printers Table (Makers' Equipment)
CREATE TABLE IF NOT EXISTS public.printers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  technology printer_technology NOT NULL DEFAULT 'FDM',
  
  -- Max Build Volume in mm
  build_volume_x_mm INTEGER NOT NULL,
  build_volume_y_mm INTEGER NOT NULL,
  build_volume_z_mm INTEGER NOT NULL,
  
  -- Supported Materials
  materials TEXT[] NOT NULL DEFAULT ARRAY['PLA']::TEXT[],
  
  -- Rates
  hourly_machine_rate NUMERIC(10, 2) NOT NULL DEFAULT 3.50, -- EUR/hour
  cost_per_gram_map JSONB NOT NULL DEFAULT '{"PLA": 0.05, "PETG": 0.07, "ABS": 0.08, "TPU": 0.12, "Resina": 0.15}'::JSONB,
  base_startup_fee NUMERIC(10, 2) NOT NULL DEFAULT 5.00,
  
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_printers_maker_id ON public.printers (maker_id);

-- 5. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  maker_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status order_status NOT NULL DEFAULT 'pending_matching',
  
  -- 3D Model Specs
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_format TEXT NOT NULL CHECK (file_format IN ('.stl', '.step', '.stp', '.obj')),
  file_size_bytes BIGINT NOT NULL,
  dimensions_x_mm NUMERIC(10, 2) NOT NULL,
  dimensions_y_mm NUMERIC(10, 2) NOT NULL,
  dimensions_z_mm NUMERIC(10, 2) NOT NULL,
  volume_cm3 NUMERIC(10, 2) NOT NULL,
  scale_factor NUMERIC(4, 2) NOT NULL DEFAULT 1.00,
  infill_percentage INTEGER NOT NULL DEFAULT 20 CHECK (infill_percentage >= 5 AND infill_percentage <= 100),
  material_selected TEXT NOT NULL,
  technology printer_technology NOT NULL DEFAULT 'FDM',
  
  -- Financials & Escrow (amounts stored in cents to prevent precision loss)
  price_total_cents INTEGER NOT NULL,
  price_maker_cents INTEGER NOT NULL,
  application_fee_cents INTEGER NOT NULL, -- 15% Platform fee
  tax_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  
  -- Stripe IDs
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,
  escrow_released_at TIMESTAMPTZ,
  
  -- Time tracking
  estimated_print_hours NUMERIC(6, 2) NOT NULL DEFAULT 4.00,
  print_started_at TIMESTAMPTZ,
  print_estimated_finish_at TIMESTAMPTZ,
  
  -- Intellectual Property & Legal Audit Trail (Skill C)
  tos_accepted_at TIMESTAMPTZ NOT NULL,
  ip_warranty_accepted_at TIMESTAMPTZ NOT NULL,
  liability_waiver_accepted_at TIMESTAMPTZ NOT NULL,
  user_ip_address TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  
  -- AI Quality Control (Skill 5)
  qa_photo_url_1 TEXT,
  qa_photo_url_2 TEXT,
  qa_status qa_status_type DEFAULT 'pending',
  qa_confidence_score NUMERIC(5, 2),
  qa_defect_summary TEXT,
  qa_evaluated_at TIMESTAMPTZ,
  
  -- Smart Matching & Routing (Skill 4)
  current_maker_notified_at TIMESTAMPTZ,
  routing_history JSONB DEFAULT '[]'::JSONB, -- [{maker_id, notified_at, expired_at, status}]
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_orders_client_id ON public.orders (client_id);
CREATE INDEX IF NOT EXISTS idx_orders_maker_id ON public.orders (maker_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);

-- 6. Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  maker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_reviews_maker_id ON public.reviews (maker_id);

-- 7. PostGIS Spatial Discovery Function (Skill 2)
CREATE OR REPLACE FUNCTION public.get_makers_within_radius(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_radius_meters DOUBLE PRECISION DEFAULT 30000 -- Default 30 km
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  city TEXT,
  distance_meters DOUBLE PRECISION,
  rating_average NUMERIC(3, 2),
  rating_count INTEGER,
  completion_rate NUMERIC(5, 2),
  active_orders_count INTEGER,
  max_active_orders INTEGER,
  materials TEXT[],
  hourly_machine_rate NUMERIC(10, 2),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_geom GEOGRAPHY;
BEGIN
  target_geom := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography;
  
  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    p.city,
    ST_Distance(p.location, target_geom) AS distance_meters,
    p.rating_average,
    p.rating_count,
    p.completion_rate,
    p.active_orders_count,
    p.max_active_orders,
    ARRAY_AGG(DISTINCT m.mat) AS materials,
    MIN(pr.hourly_machine_rate) AS hourly_machine_rate,
    ST_Y(p.location::geometry) AS lat,
    ST_X(p.location::geometry) AS lng
  FROM public.profiles p
  JOIN public.printers pr ON pr.maker_id = p.id AND pr.is_active = TRUE
  CROSS JOIN LATERAL UNNEST(pr.materials) AS m(mat)
  WHERE p.role = 'maker'
    AND p.location IS NOT NULL
    AND ST_DWithin(p.location, target_geom, p_radius_meters)
    AND p.stripe_charges_enabled = TRUE
  GROUP BY p.id, p.full_name, p.avatar_url, p.city, p.location, p.rating_average, p.rating_count, p.completion_rate, p.active_orders_count, p.max_active_orders
  ORDER BY distance_meters ASC;
END;
$$;

-- 8. Row Level Security (RLS) Setup
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.printers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Printers Policies
CREATE POLICY "Active printers are viewable by all users"
  ON public.printers FOR SELECT
  USING (is_active = true OR auth.uid() = maker_id);

CREATE POLICY "Makers can insert their own printers"
  ON public.printers FOR INSERT
  WITH CHECK (auth.uid() = maker_id);

CREATE POLICY "Makers can update their own printers"
  ON public.printers FOR UPDATE
  USING (auth.uid() = maker_id);

CREATE POLICY "Makers can delete their own printers"
  ON public.printers FOR DELETE
  USING (auth.uid() = maker_id);

-- Orders Policies (CRITICAL: Strict Intellectual Property Protection)
CREATE POLICY "Clients can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Assigned makers can view assigned orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = maker_id);

CREATE POLICY "Clients can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients and assigned makers can update order status"
  ON public.orders FOR UPDATE
  USING (auth.uid() = client_id OR auth.uid() = maker_id);

-- Reviews Policies
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Verified clients can create reviews for completed orders"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.client_id = auth.uid() AND o.status = 'completed'
    )
  );

-- 9. Trigger for Updating Maker Ratings upon Review
CREATE OR REPLACE FUNCTION public.update_maker_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET 
    rating_count = (SELECT COUNT(*) FROM public.reviews WHERE maker_id = NEW.maker_id),
    rating_average = (SELECT ROUND(AVG(rating), 2) FROM public.reviews WHERE maker_id = NEW.maker_id),
    updated_at = timezone('utc'::text, now())
  WHERE id = NEW.maker_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_after_review_insert
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_maker_rating();
