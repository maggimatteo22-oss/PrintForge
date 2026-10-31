import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/stripeClient';

/**
 * Executes Stripe Connect automated transfer upon Step 4 Escrow Delivery & Release
 * Applies tiered platform take-rate:
 * - 15% for orders up to €250
 * - 10% for orders between €250 and €1500
 * - 7% for orders over €1500
 */
export async function POST(req: NextRequest) {
  try {
    const { orderId, amountCents, makerStripeAccountId } = await req.json();

    if (!orderId || !amountCents || !makerStripeAccountId) {
      return NextResponse.json(
        { error: 'Parametri mancanti: orderId, amountCents e makerStripeAccountId sono obbligatori.' },
        { status: 400 }
      );
    }

    const grossEur = Number(amountCents) / 100;

    // Calcolo Take-Rate a Scaglioni
    let takeRatePercent = 0.15;
    if (grossEur > 1500) {
      takeRatePercent = 0.07;
    } else if (grossEur > 250) {
      takeRatePercent = 0.10;
    }

    const platformFeeCents = Math.round(Number(amountCents) * takeRatePercent);
    const creatorTransferCents = Number(amountCents) - platformFeeCents;

    console.log(`[Stripe Escrow Release] Ordine: ${orderId} | Totale: €${grossEur.toFixed(2)} | Fee (${(takeRatePercent * 100).toFixed(0)}%): €${(platformFeeCents / 100).toFixed(2)} | Payout Creator: €${(creatorTransferCents / 100).toFixed(2)}`);

    // Esegue il trasferimento ufficiale con l'SDK Stripe
    const transfer = await stripe.transfers.create({
      amount: creatorTransferCents,
      currency: 'eur',
      destination: makerStripeAccountId,
      transfer_group: `ESCROW_ORDER_${orderId}`,
      metadata: {
        orderId: String(orderId),
        grossEur: grossEur.toFixed(2),
        feePercent: `${(takeRatePercent * 100).toFixed(0)}%`,
        platformFeeEur: (platformFeeCents / 100).toFixed(2),
        creatorPayoutEur: (creatorTransferCents / 100).toFixed(2),
        releaseTimestamp: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      transferId: transfer.id,
      amountReleasedCents: creatorTransferCents,
      platformFeeCents,
      feePercent: takeRatePercent * 100,
      destination: makerStripeAccountId
    });
  } catch (error: any) {
    console.error('Errore durante stripe.transfers.create:', error);
    return NextResponse.json(
      { error: error.message || 'Errore durante il rilascio dei fondi Escrow su Stripe.' },
      { status: 500 }
    );
  }
}
