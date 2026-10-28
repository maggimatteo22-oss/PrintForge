-- =========================================================================
-- PRINTFORGE 3D MARKETPLACE - SETUP TABELLE SUPABASE CLOUD
-- =========================================================================
-- Esegui questo script nel "SQL Editor" del tuo progetto Supabase per creare
-- la tabella condivisa delle richieste di stampa con sincronizzazione Realtime.
-- =========================================================================

-- 1. Tabella Richieste Broadcast (RFP)
CREATE TABLE IF NOT EXISTS public.broadcast_requests (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  title TEXT NOT NULL,
  client_name TEXT,
  client_city TEXT,
  client_email TEXT,
  material TEXT,
  color TEXT,
  color_hex TEXT,
  tolerance TEXT,
  infill TEXT,
  quantity TEXT,
  dimensions TEXT,
  volume_cm3 NUMERIC,
  budget TEXT,
  notes TEXT,
  status TEXT DEFAULT 'IN ATTESA',
  file_name TEXT,
  maker_name TEXT
);

-- 2. Abilita la sicurezza RLS (Row Level Security) con policy pubbliche per il marketplace
ALTER TABLE public.broadcast_requests ENABLE ROW LEVEL SECURITY;

-- Consenti a chiunque (clienti e maker) di leggere le richieste di stampa attive
CREATE POLICY "Lettura pubblica richieste" 
ON public.broadcast_requests FOR SELECT 
USING (true);

-- Consenti a chiunque di inviare nuove richieste di stampa
CREATE POLICY "Inserimento pubblico richieste" 
ON public.broadcast_requests FOR INSERT 
WITH CHECK (true);

-- Consenti l'aggiornamento dello stato (es. maker che accetta la richiesta)
CREATE POLICY "Aggiornamento pubblico richieste" 
ON public.broadcast_requests FOR UPDATE 
USING (true);

-- 3. Abilita la replica Realtime (per aggiornamenti istantanei tra dispositivi)
ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcast_requests;

-- 4. Inserimento record di test iniziale
INSERT INTO public.broadcast_requests (id, title, client_name, client_city, client_email, material, color, color_hex, tolerance, infill, quantity, dimensions, budget, notes, status)
VALUES 
  ('RFP-3891', 'Componente Meccanico Personalizzato', 'Ing. Marco Ferraris', 'Torino (TO)', 'm.ferraris@precisionlab.it', 'PETG Tecnico', 'Arancione Meccanico', '#F97316', 'Alta Precisione ±0.05 mm', '50%', '1 pezzo (Prototipo)', '80 × 60 × 25 mm', '€ 48.00', 'Richiesta precisione sui denti dell''ingranaggio e tenuta del perno.', 'IN ATTESA')
ON CONFLICT (id) DO NOTHING;
