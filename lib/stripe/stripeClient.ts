import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-04-10' as any,
  appInfo: {
    name: 'PrintForge 3D Marketplace',
    version: '1.0.0',
  },
});
