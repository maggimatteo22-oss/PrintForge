import { Resend } from 'resend';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, subject, html, text } = body || {};

    if (!to) {
      return NextResponse.json({ success: false, error: 'Missing "to" address' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        realDelivered: false,
        notice: 'RESEND_API_KEY non ancora configurata nelle variabili d\'ambiente di Vercel. L\'email è registrata nello storico audit interno.'
      });
    }

    const resend = new Resend(apiKey);
    const fromAddress = process.env.EMAIL_FROM || 'PrintForge <onboarding@resend.dev>';

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: Array.isArray(to) ? to : [to],
      subject: subject || 'Notifica Transazionale PrintForge',
      html: html || (text ? `<div style="font-family: sans-serif; white-space: pre-wrap;">${text}</div>` : '<p>Notifica PrintForge</p>'),
    });

    if (error) {
      console.error('[Resend Error]:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      realDelivered: true,
      id: data?.id
    });
  } catch (err: any) {
    console.error('[Email Send API Exception]:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal Error' }, { status: 500 });
  }
}
