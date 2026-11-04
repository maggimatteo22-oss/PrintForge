import { NextRequest, NextResponse } from 'next/server';
import { packlinkClient } from '@/lib/shipping/packlinkClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, shipmentData, shipmentReference } = body;

    if (action === 'get_labels' && shipmentReference) {
      const labels = await packlinkClient.getLabels(shipmentReference);
      return NextResponse.json({ success: true, labels });
    }

    if (action === 'track' && shipmentReference) {
      const tracking = await packlinkClient.trackShipment(shipmentReference);
      return NextResponse.json({ success: true, tracking });
    }

    if (action === 'create_shipment' && shipmentData) {
      const created = await packlinkClient.createShipment(shipmentData);
      return NextResponse.json({ success: true, shipment: created });
    }

    // Default status check
    return NextResponse.json({
      success: true,
      service: 'Packlink PRO Shipping Engine',
      environment: process.env.PACKLINK_ENVIRONMENT || 'production',
      configured: true
    });
  } catch (error: any) {
    console.error('Packlink API Route Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal shipping error' },
      { status: 500 }
    );
  }
}
