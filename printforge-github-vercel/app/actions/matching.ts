'use server';

import { calculateSmartMatches, routeOrderCascading, MatchCriteria } from '@/lib/matching/smartMatcher';

export async function findBestMakerAction(criteria: MatchCriteria, orderId = 'ORD-DEMO-1001') {
  try {
    const candidates = await calculateSmartMatches(criteria);

    if (candidates.length === 0) {
      return {
        success: false,
        error: 'Nessun Maker disponibile nel raggio selezionato con la capacità necessaria.',
        candidates: [],
      };
    }

    const routing = await routeOrderCascading(orderId, candidates);

    return {
      success: true,
      bestMatch: routing.assignedMaker,
      allCandidates: candidates,
      cascadeQueue: routing.cascadeQueue,
      timeoutHours: routing.timeoutHours,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Errore durante il calcolo dello Smart Matching.',
      candidates: [],
    };
  }
}
