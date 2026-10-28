'use server';

import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/admin';

export interface AuditTrailPayload {
  tosAccepted: boolean;
  ipWarrantyAccepted: boolean;
  liabilityWaiverAccepted: boolean;
  fileName: string;
  fileSizeBytes: number;
  fileFormat: string;
}

/**
 * Server Action for Intellectual Property Consent & Legal Audit Trail (Skill C)
 * Extracts Client IP address and User-Agent from incoming headers.
 * Blocks execution if any mandatory checkbox is missing.
 */
export async function recordLegalAuditTrail(payload: AuditTrailPayload) {
  const { tosAccepted, ipWarrantyAccepted, liabilityWaiverAccepted, fileName, fileSizeBytes, fileFormat } = payload;

  // Strict blocking validation
  if (!tosAccepted || !ipWarrantyAccepted || !liabilityWaiverAccepted) {
    return {
      success: false,
      error: 'Tutte le 3 dichiarazioni legali di proprietà intellettuale e privacy sono obbligatorie per legge.',
    };
  }

  // Extract IP & User Agent from request headers
  const headerList = headers();
  const rawIp = headerList.get('x-forwarded-for') || headerList.get('x-real-ip') || '127.0.0.1';
  const clientIp = rawIp.split(',')[0].trim();
  const userAgent = headerList.get('user-agent') || 'Browser/Unknown';
  const timestamp = new Date().toISOString();

  console.log(`[Legal Audit Trail] IP: ${clientIp} accepted TOS & Copyright indemnity for "${fileName}" at ${timestamp}`);

  return {
    success: true,
    auditRecord: {
      user_ip_address: clientIp,
      user_agent: userAgent,
      tos_accepted_at: timestamp,
      ip_warranty_accepted_at: timestamp,
      liability_waiver_accepted_at: timestamp,
    },
  };
}
