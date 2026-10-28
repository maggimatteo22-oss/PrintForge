# 🖨️ PrintForge 3D - P2P 3D Printing Marketplace

Piattaforma di mediazione e marketplace decentralizzato per la stampa 3D locale ad alta precisione, sviluppata con **Next.js (App Router, TypeScript)**, **Tailwind CSS**, **Three.js & React Three Fiber (R3F)**, **Supabase (PostgreSQL, PostGIS, Auth, Storage)** e **Stripe Connect Express (Destination Charges & Escrow)**.

---

## 🏛️ Architettura Completa del Sistema

```
printforge/
├── app/
│   ├── layout.tsx                     # Root Layout con font e dark theme
│   ├── globals.css                    # Direttive Tailwind e stili custom
│   ├── page.tsx                       # Dashboard Hub unificata con tutte le 8 Skill
│   ├── actions/
│   │   ├── makers.ts                  # PostGIS RPC spatial query & Geocoding
│   │   ├── matching.ts                # Server action per Smart Matching
│   │   ├── pricing.ts                 # Calcolo preventivo matematico lato server
│   │   └── uploadAudit.ts             # Registrazione IP, User Agent e Timestamp TOS/GDPR
│   └── api/
│       ├── stripe/
│       │   ├── connect/route.ts       # Onboarding KYC Stripe Express per Makers
│       │   └── checkout/route.ts      # Destination Charges & trattenuta Escrow
│       └── webhooks/
│           ├── stripe/route.ts        # Rilascio Escrow al completamento & fee 15%
│           └── qstash/route.ts        # Ricezione code asincrone Upstash QStash
├── components/
│   ├── viewer/
│   │   ├── ThreeViewer.tsx            # Skill 1: Canvas 3D, OrbitControls, scala 50-200%
│   │   ├── BoundingBoxCage.tsx        # Bounding box trasparente con quote live XYZ (mm)
│   │   └── fdmShader.ts               # Custom GLSL Shader per simulazione layer FDM
│   ├── map/
│   │   └── MakerDiscoveryMap.tsx      # Skill 2: Mapbox / PostGIS 30km discovery & clustering
│   ├── tracker/
│   │   └── ProductionTracker.tsx      # Skill 3: Pizza Tracker a 5 step & Escrow release
│   ├── matching/
│   │   └── SmartMatchingSimulator.tsx # Skill 4: Simulatore score 1-100 & cascata 4h
│   ├── qa/
│   │   └── VisionValidationUploader.tsx # Skill 5: AI Vision QC pre-spedizione (soglia >85%)
│   ├── quote/
│   │   └── PriceCalculator.tsx        # Skill D: Calcolatore matematico di preventivo
│   ├── upload/
│   │   └── FileUploaderWithConsent.tsx# Skill C: Upload STL con 3 checkbox legali bloccanti
│   └── billing/
│       └── InvoicesList.tsx           # Skill B: Storico ricevute hobbista (art. 67) vs P.IVA
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  # Client Supabase browser
│   │   └── admin.ts                   # Client Supabase Service Role privilegiato
│   ├── stripe/
│   │   └── stripeClient.ts            # Client Stripe ufficiale
│   ├── matching/
│   │   └── smartMatcher.ts            # Algoritmo matematico ponderato (40/30/20/10)
│   ├── vision/
│   │   └── qaValidator.ts             # Ispettore Vision AI (OpenAI / Gemini)
│   ├── notifications/
│   │   ├── queue.ts                   # Upstash QStash publisher & Rate Limiter
│   │   └── emailTemplates.ts          # Template transazionali per cliente e maker
│   ├── pricing/
│   │   └── quoteEngine.ts             # Motore matematico volume, densità e tempo macchina
│   └── billing/
│       └── taxAndInvoicing.ts         # Regime fiscale hobbista vs professionista e Stripe Tax
├── supabase/
│   ├── migrations/
│   │   └── 20261009_init_schema.sql   # DDL completo: profiles, printers, orders, reviews, PostGIS & RLS
│   └── storage_policies.sql           # Policy restrittive bucket privato 3d-models (tutela IP)
├── public/
│   └── index.html                     # Suite di test interattiva standalone a zero dipendenze
├── .env.example                       # Variabili d'ambiente documentate
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---

## ⚡ Guida Rapida all'Uso

### 1. Anteprima Immediata (Senza installazioni)
È disponibile un'interfaccia interattiva completa e autonoma con Three.js WebGL:
* Apri direttamente il file **`public/index.html`** in qualsiasi browser (Google Chrome, Microsoft Edge, Firefox).
* Potrai testare immediatamente:
  * Il visualizzatore 3D con scala interattiva, quote dinamiche e preview shader FDM.
  * La mappa di geolocalizzazione nel raggio di 30 km.
  * Il Pizza Tracker con sblocco dell'Escrow.
  * L'algoritmo di Smart Matching e la simulazione del timeout a cascata di 4 ore.
  * Il controllo qualità visivo con AI Vision (difetti di delaminazione, warping, stringing).
  * Il calcolo matematico del preventivo.

### 2. Esecuzione del Progetto Next.js
Quando Node.js è disponibile nel tuo ambiente:
```bash
cd "C:\Users\matteo maggi\.gemini\antigravity\scratch\printforge"
npm install
npm run dev
```
Apri [http://localhost:3000](http://localhost:3000) per navigare l'applicazione Next.js completa.

---

## 🛠️ Dettaglio delle Funzionalità Implementate

### Skill Visive
1. **Visualizzatore 3D Interattivo & Configurator (R3F & Three.js)**:
   * Drag-and-drop di file `.stl`, `.step`, `.obj`.
   * Controlli orbitali fluidi con damping inerziale (rotazione, pan, zoom).
   * **Bounding Box dinamico** con quote in millimetri (**X**, **Y**, **Z**) aggiornate in tempo reale in base allo slider di scala (**50% – 200%**).
   * **Preview FDM**: Custom GLSL Shader con modulazione della coordinata Y dello spazio mondo (`fract(vWorldPosition.y / uLayerHeight)`) per simulare realisticamente i cordoli e le striature orizzontali del filamento estruso.

2. **Mappa Discovery Locale (Geolocalizzazione PostGIS)**:
   * Barra di ricerca per CAP e città italiane.
   * Visualizzazione grafica del perimetro dei **30 km**.
   * Clustering dei Maker vicini con espansione su zoom.
   * Scheda Maker in sovrimpressione: nome, rating a stelle, badge materiali (`PLA`, `PETG`, `Resina`, `ABS`, `TPU`), tariffa oraria e bottone di richiesta preventivo.
   * Query database ottimizzata con funzione PostGIS `ST_DWithin` e `ST_Distance`.

3. **Tracker di Produzione Visivo (Pizza Tracker)**:
   * 5 step di avanzamento: *Approvato*, *In Coda*, *In Stampa* (con barra ore stimate vs trascorse), *Pulizia/Post-produzione*, *Pronto per Ritiro/Spedizione*.
   * Transizioni animate fluide realizzate con Framer Motion.
   * Animazione di successo e sblocco del pulsante per **rilasciare i fondi in Escrow** al Maker trattenendo la commissione della piattaforma.

---

### Skill Non-Visive & Backend
4. **Algoritmo di Smart Matching (Routing Ordini)**:
   * Formula pesata su scala 1-100:
     $$\text{Match Score} = (\text{Vicinanza} \times 0.40) + (\text{Rating} \times 0.30) + (\text{Completamento} \times 0.20) + (\text{Coda Libera} \times 0.10)$$
   * **Protezione Overbooking**: Esclusione preventiva dei Maker che hanno raggiunto la soglia `active_orders >= max_active_orders`.
   * **Routing a cascata**: Notifica al Maker #1; in caso di mancata risposta o rifiuto entro **4 ore**, l'ordine viene riassegnato in automatico al Maker #2.

5. **Controllo Qualità AI (Vision Validation)**:
   * Upload obbligatorio pre-spedizione di 2 foto (angolo frontale/base e dettaglio macro layer).
   * Analisi difetti tipici della stampa 3D: *delaminazione severa*, *warping*, *stringing*, *supporti non rimossi*, *sottoestrusione*.
   * Approvazione automatica se **Confidence > 85%** e nessun difetto critico; in caso contrario, blocco della spedizione, alert al Maker per ristampa e segnalazione alla dashboard di amministrazione.

6. **Sistema di Notifiche Asincrone & Code**:
   * Code asincrone non bloccanti con Upstash QStash.
   * Invio email transazionali formattate via Resend per cambi di stato e alert Maker (inattività > 2h).
   * Rate-limiting integrato (max 5 email/ora per utente) contro loop di notifica.

---

### Skill Burocratiche e Finanziarie
* **Skill A (Stripe Connect Express & Escrow)**:
  * Flusso KYC ospitato su Stripe per verifica identità Maker.
  * Destination Charges per trattenere i fondi in pending sul conto della piattaforma fino alla conferma di conformità del pezzo.
  * Trattenuta automatica della **commissione del 15% (application_fee)** al rilascio.
* **Skill B (Gestione Fiscale & Fatturazione)**:
  * Riconoscimento Maker **Hobbista** (prestazione occasionale art. 67 DPR 917/86 senza IVA) vs **Professionista** (Partita IVA ordinaria).
  * Ricevuta/fattura automatica con evidenziazione separata della fee di piattaforma e calcolo Stripe Tax.
* **Skill C (Proprietà Intellettuale & Consenso)**:
  * Upload su Supabase Storage privato con 3 spunte bloccanti obbligatorie (GDPR, titolarità diritti/licenza commerciale e divieto di riutilizzo).
  * Registrazione indelebile dell'**Audit Trail**: data, ora, indirizzo IP e User Agent nel record dell'ordine.
* **Skill D (Motore di Preventivazione 3D)**:
  * Calcolo volumetrico matematico del modello con stima infill (default 20%).
  * Prezzo calcolato via Server Action:
    $$\text{Prezzo} = (\text{Grammi} \times \text{Costo/g}) + (\text{Ore Macchina} \times \text{Tariffa Oraria}) + \text{Markup Avvio}$$
