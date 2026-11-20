-- =========================================================================
-- PRINTFORGE - MIGRAZIONE COLONNE SPEDIZIONE PACKLINK PRO
-- =========================================================================
-- Esegui questo script nell'SQL Editor di Supabase per abilitare il tracciamento
-- e la memorizzazione permanente delle etichette reali Packlink PRO.
-- Sicuro ed idempotente: usa IF NOT EXISTS per preservare tutti i dati esistenti.
-- =========================================================================

-- 1. Aggiornamento tabella 'broadcast_requests' (richieste e ordini marketplace)
ALTER TABLE IF EXISTS public.broadcast_requests 
  ADD COLUMN IF NOT EXISTS packlink_reference TEXT,
  ADD COLUMN IF NOT EXISTS shipping_label_url TEXT,
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS shipping_carrier TEXT DEFAULT 'UPS Standard',
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS shipping_address JSONB;

-- 2. Aggiornamento tabella 'orders' (ordini con collaudo e smart routing)
ALTER TABLE IF EXISTS public.orders 
  ADD COLUMN IF NOT EXISTS packlink_reference TEXT,
  ADD COLUMN IF NOT EXISTS shipping_label_url TEXT,
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS shipping_carrier TEXT DEFAULT 'UPS Standard',
  ADD COLUMN IF NOT EXISTS shipping_address JSONB;

-- 3. Indici per velocizzare la ricerca per tracking e riferimento Packlink
CREATE INDEX IF NOT EXISTS idx_broadcast_packlink_ref ON public.broadcast_requests (packlink_reference);
CREATE INDEX IF NOT EXISTS idx_broadcast_tracking ON public.broadcast_requests (tracking_number);
CREATE INDEX IF NOT EXISTS idx_orders_packlink_ref ON public.orders (packlink_reference);
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON public.orders (tracking_number);
