# Guida Rapida di Deploy su Vercel & GitHub

Questo archivio contiene l'intero codice sorgente ottimizzato di **PrintForge** pronto per GitHub e Vercel con fix anti-schermo nero / redirect loop.

---

## 🚀 Caricamento su GitHub

1. Vai sul tuo repository GitHub (es. `printforge`).
2. Trascina i file di questo ZIP (estratti) nel repository per aggiornarlo, oppure fai un nuovo commit/push.
3. Clicca **Commit changes**.

---

## ⚡ Deploy su Vercel (Automatico)

1. Una volta fatto il push su GitHub, Vercel avvierà automaticamente una nuova build di produzione.
2. In meno di 30 secondi il deploy sarà completato!
3. Aprendo il link del tuo progetto (es. `https://printforge-github-vercel.vercel.app`), il sito si aprirà **immediatamente** senza schermata nera e senza redirect loop!

---

## 🛠️ Cosa è stato risolto:
- **Risolto conflitto Vercel Clean URLs**: eliminato il loop di redirect 307/308 permanente tra Next.js ed Edge Router.
- **Root Route Handler ultra-affidabile**: `app/route.ts` serve direttamente l'applicazione HTML con Status 200 OK istantaneo.
- **Fallback bundle in-memory**: include `lib/indexHtml.ts` con tracing garantito per serverless e edge functions.
- **Configurazione Vercel zero-conflict**: `vercel.json` con `cleanUrls: false` per impedire redirect indesiderati sui file statici.
