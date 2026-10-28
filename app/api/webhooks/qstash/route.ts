import { NextRequest, NextResponse } from 'next/server';
import { sendTransactionalEmail } from '@/lib/notifications/queue';
import { generateOrderStatusEmail, generateMakerInactivityAlertEmail } from '@/lib/notifications/emailTemplates';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventType, data } = body;

    switch (eventType) {
      case 'ORDER_STATUS_CHANGED': {
        const email = generateOrderStatusEmail({
          clientName: data.clientName || 'Cliente',
          orderId: data.orderId,
          newStatusTitle: data.newStatusTitle,
          statusDescription: data.statusDescription,
          estimatedFinish: data.estimatedFinish,
        });
        await sendTransactionalEmail(email);
        break;
      }

      case 'MAKER_INACTIVITY_ALERT': {
        const alertEmail = generateMakerInactivityAlertEmail({
          makerName: data.makerName || 'Maker',
          orderId: data.orderId,
          hoursWaiting: data.hoursWaiting || 2,
          priceTotal: data.priceTotal || 35.0,
        });
        await sendTransactionalEmail(alertEmail);
        break;
      }

      default:
        console.warn(`[QStash Webhook] Unhandled eventType: ${eventType}`);
    }

    return NextResponse.json({ status: 'success', received: true });
  } catch (error: any) {
    console.error('Error handling QStash webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
