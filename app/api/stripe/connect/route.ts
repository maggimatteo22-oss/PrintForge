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

    let accountId: string | null = null;

    // 1. Check if maker already has a Stripe Express account in profiles
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('stripe_account_id')
        .eq('id', makerId)
        .single();
      accountId = profile?.stripe_account_id || null;
    } catch (err) {
      console.warn('Could not read stripe_account_id from profiles:', err);
    }

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

      // Save to Supabase profile if possible
      try {
        await supabaseAdmin
          .from('profiles')
          .update({ stripe_account_id: accountId })
          .eq('id', makerId);
      } catch (err) {
        console.warn('Could not update stripe_account_id in profiles:', err);
      }
    }

    // 3. Create Stripe-hosted KYC onboarding link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://print-forge-seven.vercel.app';
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
