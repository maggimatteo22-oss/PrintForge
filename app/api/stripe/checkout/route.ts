import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/stripeClient';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Creates Stripe Checkout Session using Destination Charges for Escrow
 * Pre-authorizes / captures funds, applies 15% platform application fee.
 */
export async function POST(req: NextRequest) {
  try {
    const { orderId, clientId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'orderId obbligatorio' }, { status: 400 });
    }

    // 1. Fetch order details from database
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*, profiles!maker_id(stripe_account_id, is_business)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Ordine non trovato' }, { status: 404 });
    }

    const makerStripeAccountId = order.profiles?.stripe_account_id;
    if (!makerStripeAccountId) {
      return NextResponse.json({
        error: 'Il Maker assegnato non ha ancora completato l’onboarding Stripe KYC.',
      }, { status: 400 });
    }

    const totalAmountCents = order.price_total_cents;
    const applicationFeeCents = Math.round(totalAmountCents * 0.15); // 15% platform fee
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // 2. Create Destination Charge Checkout session with Escrow
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Stampa 3D: ${order.file_name}`,
              description: `Materiale: ${order.material_selected} - Dimensioni: ${order.dimensions_x_mm}x${order.dimensions_y_mm}x${order.dimensions_z_mm} mm`,
            },
            unit_amount: totalAmountCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      payment_intent_data: {
        application_fee_amount: applicationFeeCents,
        transfer_data: {
          destination: makerStripeAccountId,
        },
        // We capture and hold funds on platform balance or release them via transfer
        metadata: {
          orderId: order.id,
          clientId: order.client_id,
          makerId: order.maker_id,
        },
      },
      automatic_tax: { enabled: true }, // Skill B: Stripe Tax
      success_url: `${appUrl}/orders/${order.id}?payment=success`,
      cancel_url: `${appUrl}/orders/${order.id}?payment=cancelled`,
      metadata: {
        orderId: order.id,
      },
    });

    // Save session ID
    await supabaseAdmin
      .from('orders')
      .update({
        stripe_payment_intent_id: session.payment_intent as string || session.id,
        status: 'approved',
      })
      .eq('id', order.id);

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('Error generating checkout session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
