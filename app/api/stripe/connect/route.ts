import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/stripeClient';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Initiates Stripe Connect Express onboarding for Makers (KYC verification)
 */
export async function POST(req: NextRequest) {
  try {
    const { makerId, email, businessType } = await req.json();

    if (!makerId || !email) {
      return NextResponse.json({ error: 'makerId ed email sono obbligatori' }, { status: 400 });
    }

    // 1. Check if maker already has a Stripe Express account in profiles
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', makerId)
      .single();

    let accountId = profile?.stripe_account_id;

    // 2. If not, create a new Stripe Express Account
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'IT',
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: businessType === 'business' ? 'company' : 'individual',
      });

      accountId = account.id;

      // Save to Supabase profile
      await supabaseAdmin
        .from('profiles')
        .update({ stripe_account_id: accountId })
        .eq('id', makerId);
    }

    // 3. Create Stripe-hosted KYC onboarding link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/maker/onboarding?retry=true`,
      return_url: `${appUrl}/maker/dashboard?onboarding=success`,
      type: 'account_onboarding',
    });

    return NextResponse.json({
      success: true,
      url: accountLink.url,
      accountId,
    });
  } catch (error: any) {
    console.error('Error creating Stripe Connect onboarding link:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
