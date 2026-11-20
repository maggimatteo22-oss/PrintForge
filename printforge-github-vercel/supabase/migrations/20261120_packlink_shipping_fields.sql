-- =========================================================================
-- PRINTFORGE - MIGRAZIONE COLONNE SPEDIZIONE PACKLINK PRO (SICURA & DINAMICA)
-- =========================================================================
-- Esegui questo script nell'SQL Editor di Supabase.
-- Aggiorna la tabella broadcast_requests ed è protetta per non dare errore
-- se la tabella orders non è ancora stata creata.
-- =========================================================================

-- 1. Aggiornamento tabella 'broadcast_requests' (tabella principale marketplace & escrow)
ALTER TABLE public.broadcast_requests 
  ADD COLUMN IF NOT EXISTS packlink_reference TEXT,
  ADD COLUMN IF NOT EXISTS shipping_label_url TEXT,
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS shipping_carrier TEXT DEFAULT 'UPS Standard',
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS shipping_address JSONB;

CREATE INDEX IF NOT EXISTS idx_broadcast_packlink_ref ON public.broadcast_requests (packlink_reference);
CREATE INDEX IF NOT EXISTS idx_broadcast_tracking ON public.broadcast_requests (tracking_number);

-- 2. Aggiornamento tabella 'orders' (eseguito solo se la tabella esiste già nel DB)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    ALTER TABLE public.orders 
      ADD COLUMN IF NOT EXISTS packlink_reference TEXT,
      ADD COLUMN IF NOT EXISTS shipping_label_url TEXT,
      ADD COLUMN IF NOT EXISTS tracking_number TEXT,
      ADD COLUMN IF NOT EXISTS shipping_carrier TEXT DEFAULT 'UPS Standard',
      ADD COLUMN IF NOT EXISTS shipping_address JSONB;

    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_orders_packlink_ref ON public.orders (packlink_reference)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_orders_tracking ON public.orders (tracking_number)';
  END IF;
END $$;
