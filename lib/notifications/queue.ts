import { Resend } from 'resend';
import { Client as QStashClient } from '@upstash/qstash';
import { EmailPayload } from './emailTemplates';

// In-memory rate limiting map: email -> timestamps of sent emails in current hour
// In production, backed by Upstash Redis
const rateLimitStore = new Map<string, number[]>();
const MAX_EMAILS_PER_HOUR = 5;

export function checkRateLimit(recipientEmail: string): boolean {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  const history = rateLimitStore.get(recipientEmail) || [];
  const validHistory = history.filter((timestamp) => timestamp > oneHourAgo);

  if (validHistory.length >= MAX_EMAILS_PER_HOUR) {
    console.warn(`[RateLimit] Suppressing email to ${recipientEmail} - exceeded ${MAX_EMAILS_PER_HOUR} emails/hour.`);
    return false; // Rate limit exceeded
  }

  validHistory.push(now);
  rateLimitStore.set(recipientEmail, validHistory);
  return true; // Allowed
}

/**
 * Dispatches an email via Resend with active rate-limiting
 */
export async function sendTransactionalEmail(payload: EmailPayload): Promise<{ success: boolean; id?: string; rateLimited?: boolean }> {
  if (!checkRateLimit(payload.to)) {
    return { success: false, rateLimited: true };
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.log(`[Email Simulator] Sent email to: ${payload.to} | Subject: "${payload.subject}"`);
    return { success: true, id: 'simulated-msg-' + Date.now() };
  }

  try {
    const resend = new Resend(resendApiKey);
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'PrintForge <ordini@printforge.it>',
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error('Failed to send transactional email:', err);
    return { success: false };
  }
}

/**
 * Enqueue an asynchronous job via Upstash QStash
 */
export async function enqueueAsyncJob(endpoint: string, payload: any, delaySeconds?: number): Promise<void> {
  const qstashToken = process.env.QSTASH_TOKEN;

  if (qstashToken) {
    try {
      const qstash = new QStashClient({ token: qstashToken });
      const targetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${endpoint}`;

      await qstash.publishJSON({
        url: targetUrl,
        body: payload,
        delay: delaySeconds, // delay in seconds (e.g. 7200 for 2-hour maker alert)
      });
      return;
    } catch (err) {
      console.warn('QStash publishing failed, falling back to direct async dispatch', err);
    }
  }

  console.log(`[Queue Local] Enqueued job for ${endpoint} with delay ${delaySeconds || 0}s`);
}
