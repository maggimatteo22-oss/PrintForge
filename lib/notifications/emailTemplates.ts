export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export function generateOrderStatusEmail(params: {
  clientName: string;
  orderId: string;
  newStatusTitle: string;
  statusDescription: string;
  estimatedFinish?: string;
}): EmailPayload {
  const { clientName, orderId, newStatusTitle, statusDescription, estimatedFinish } = params;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f8fafc; margin: 0; padding: 32px 16px; }
          .container { max-width: 580px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 32px; }
          .header { text-align: center; border-bottom: 1px solid #1f2937; padding-bottom: 24px; margin-bottom: 24px; }
          .logo { font-size: 20px; font-weight: 800; color: #10b981; letter-spacing: -0.5px; }
          .badge { display: inline-block; background-color: rgba(16, 185, 129, 0.15); color: #34d399; font-weight: 700; font-size: 13px; padding: 6px 14px; border-radius: 999px; margin-bottom: 12px; }
          h1 { font-size: 22px; color: #ffffff; margin: 0 0 12px; }
          p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 16px; }
          .info-box { background-color: #030712; border: 1px solid #1f2937; border-radius: 12px; padding: 16px; margin: 20px 0; }
          .info-row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; }
          .info-label { color: #64748b; }
          .info-value { color: #e2e8f0; font-family: monospace; font-weight: 600; }
          .cta { display: block; text-align: center; background-color: #059669; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 14px; margin-top: 24px; }
          .footer { text-align: center; font-size: 11px; color: #64748b; margin-top: 32px; border-top: 1px solid #1f2937; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">PRINTFORGE 3D</div>
          </div>
          <span class="badge">Aggiornamento Ordine #${orderId}</span>
          <h1>Nuovo stato: ${newStatusTitle}</h1>
          <p>Ciao ${clientName},</p>
          <p>${statusDescription}</p>

          <div class="info-box">
            <div class="info-row">
              <span class="info-label">ID Ordine:</span>
              <span class="info-value">#${orderId}</span>
            </div>
            ${estimatedFinish ? `
            <div class="info-row">
              <span class="info-label">Stima Completamento:</span>
              <span class="info-value">${estimatedFinish}</span>
            </div>` : ''}
          </div>

          <a href="http://localhost:3000/orders/${orderId}" class="cta">Visualizza Pizza Tracker</a>

          <div class="footer">
            Ricevi questa email transazionale perché hai un ordine attivo su PrintForge Marketplace.<br>
            Tutti i pagamenti sono protetti da Escrow Stripe.
          </div>
        </div>
      </body>
    </html>
  `;

  return {
    to: params.clientName,
    subject: `[PrintForge] Aggiornamento Ordine #${orderId}: ${newStatusTitle}`,
    html,
  };
}

export function generateMakerInactivityAlertEmail(params: {
  makerName: string;
  orderId: string;
  hoursWaiting: number;
  priceTotal: number;
}): EmailPayload {
  const { makerName, orderId, hoursWaiting, priceTotal } = params;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: sans-serif; background-color: #0b0f19; color: #f8fafc; padding: 24px;">
        <div style="max-width: 540px; margin: 0 auto; background-color: #111827; border: 1px solid #374151; border-radius: 16px; padding: 28px;">
          <h2 style="color: #f59e0b; margin-top: 0;">⚠️ Alert Accettazione Ordine in Scadenza</h2>
          <p>Ciao ${makerName},</p>
          <p>Hai una nuova richiesta di stampa 3D (<strong>Ordine #${orderId}</strong> da <strong>€${priceTotal.toFixed(2)}</strong>) in attesa di accettazione da oltre <strong>${hoursWaiting} ore</strong>.</p>
          <p style="color: #94a3b8; font-size: 13px;">
            Ricorda che per garantire un'esperienza ottimale ai clienti, il nostro algoritmo di Smart Matching inoltrerà automaticamente l'ordine al Maker successivo della coda se non confermi entro 4 ore.
          </p>
          <a href="http://localhost:3000/maker/dashboard" style="display: inline-block; background-color: #f59e0b; color: #000; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; margin-top: 16px;">
            Accetta Ordine Adesso
          </a>
        </div>
      </body>
    </html>
  `;

  return {
    to: params.makerName,
    subject: `⚠️ [Alert Urgente] Ordine #${orderId} in attesa di accettazione da ${hoursWaiting}h`,
    html,
  };
}
