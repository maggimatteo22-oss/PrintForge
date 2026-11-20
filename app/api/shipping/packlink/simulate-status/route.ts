import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { shipmentId, newStatus } = await req.json();

    if (shipmentId) {
      // Map status
      const statusMap: Record<string, string> = {
        'IN_TRANSIT': 'In transito al corriere',
        'OUT_FOR_DELIVERY': 'In consegna',
        'DELIVERED': 'Consegnato'
      };
      const displayStatus = statusMap[newStatus] || newStatus;

      // Update broadcast_requests
      await supabaseAdmin
        .from('broadcast_requests')
        .update({ status: displayStatus })
        .eq('id', shipmentId);

      // Also try orders
      await supabaseAdmin
        .from('orders')
        .update({ status: displayStatus.toLowerCase() })
        .eq('id', shipmentId);
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
