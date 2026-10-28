'use server';

import { calculatePrintPrice, QuoteCalculationInput, QuoteBreakdown } from '@/lib/pricing/quoteEngine';

/**
 * Server Action for 3D Print Quoting Engine (Skill D)
 * Guarantees that the final payment amount cannot be tampered with by client-side inspection.
 */
export async function calculateQuoteServerAction(input: QuoteCalculationInput): Promise<{ success: boolean; quote?: QuoteBreakdown; error?: string }> {
  try {
    const quote = calculatePrintPrice(input);
    return {
      success: true,
      quote,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Errore durante il calcolo del preventivo.',
    };
  }
}
