import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/stripeClient';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') || '';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: any;

  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body); // For local simulator testing
    }
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: 'Firma webhook non valida' }, { status: 400 });
  }

  try {
    switch (event.type) {
      // 1. Checkout session completed -> Hold funds in Escrow, move order to 'queued'
      case 'checkout.session.completed': {
        const session = event.data.object;
        const orderId = session.metadata?.orderId;

        if (orderId) {
          await supabaseAdmin
            .from('orders')
            .update({
              status: 'queued',
              stripe_payment_intent_id: session.payment_intent,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);

          console.log(`[Stripe Webhook] Fondi trattenuti in Escrow per Ordine #${orderId}`);
        }
        break;
      }

      // 2. Custom action / webhook: Client confirms order received & compliant -> Release Escrow
      case 'order.release_escrow': {
        const { orderId } = event.data.object;

        const { data: order } = await supabaseAdmin
          .from('orders')
          .select('*, profiles!maker_id(stripe_account_id, is_business)')
          .eq('id', orderId)
          .single();

        if (order && order.profiles?.stripe_account_id) {
          const payoutAmountCents = order.price_maker_cents;

          // Execute transfer to connected Express account if not already destination charged
          const transfer = await stripe.transfers.create({
            amount: payoutAmountCents,
            currency: 'eur',
            destination: order.profiles.stripe_account_id,
            description: `Rilascio Escrow per Ordine #${order.id}`,
            metadata: { orderId: order.id },
          });

          // Mark order as completed
          await supabaseAdmin
            .from('orders')
            .update({
              status: 'completed',
              stripe_transfer_id: transfer.id,
              escrow_released_at: new Date().toISOString(),
            })
            .eq('id', orderId);

          console.log(`[Stripe Escrow] Rilasciati €${(payoutAmountCents / 100).toFixed(2)} al Maker ${order.profiles.stripe_account_id}`);
        }
        break;
      }

      // 3. Refund management
      case 'charge.refunded': {
        const charge = event.data.object;
        const paymentIntentId = charge.payment_intent;

        if (paymentIntentId) {
          await supabaseAdmin
            .from('orders')
            .update({
              status: 'cancelled',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_payment_intent_id', paymentIntentId);

          console.log(`[Stripe Refund] Ordine rimborsato con successo: ${paymentIntentId}`);
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing Stripe webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
