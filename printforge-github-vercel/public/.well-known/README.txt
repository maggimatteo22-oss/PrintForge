# Apple Pay Domain Verification

Per verificare il tuo dominio su Stripe per Apple Pay Web:
1. Accedi alla Dashboard di Stripe: https://dashboard.stripe.com/settings/payments/apple_pay
2. Clicca su "+ Aggiungi nuovo dominio" (es. printforge.it)
3. Scarica il file di verifica fornito da Stripe:
   "apple-developer-merchantid-domain-association"
4. Copia quel file esattamente in questa cartella:
   public/.well-known/apple-developer-merchantid-domain-association
5. Una volta pubblicato il sito (es. su Vercel), clicca "Verifica" nella Dashboard di Stripe.
