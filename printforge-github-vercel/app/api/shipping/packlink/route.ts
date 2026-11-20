import { NextRequest, NextResponse } from 'next/server';
import { packlinkClient, PacklinkAddress, PacklinkParcel } from '@/lib/shipping/packlinkClient';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, orderId, shipmentData, shipmentReference, senderAddress } = body;

    // =========================================================================
    // 1. ACTION: get_or_create_label (Production Flow with Escrow Verification)
    // =========================================================================
    if (action === 'get_or_create_label') {
      if (!orderId) {
        return NextResponse.json({ success: false, error: 'orderId obbligatorio' }, { status: 400 });
      }

      // A. Query Supabase for the order (check broadcast_requests first, then orders)
      let table = 'broadcast_requests';
      let { data: order, error: orderErr } = await supabaseAdmin
        .from('broadcast_requests')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (!order) {
        table = 'orders';
        const res = await supabaseAdmin
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .maybeSingle();
        order = res.data;
      }

      // B. Idempotency Check 1: If order already has an official label PDF URL, return immediately!
      if (order?.shipping_label_url) {
        return NextResponse.json({
          success: true,
          labelUrl: order.shipping_label_url,
          trackingNumber: order.tracking_number || order.packlink_reference,
          carrier: order.shipping_carrier || 'UPS Standard',
          reference: order.packlink_reference,
          cached: true
        });
      }

      let reference = order?.packlink_reference;

      // C. If NO packlink_reference exists yet, create the shipment draft
      if (!reference) {
        // Build Maker / Sender Address
        const fromAddr: PacklinkAddress = {
          name: senderAddress?.makerName || order?.maker_name || 'Maker Hub 3D',
          surname: 'PrintForge Partner',
          company: 'PrintForge Network',
          street1: senderAddress?.street || 'Via dell’Artigianato 12',
          city: senderAddress?.city || 'Milano',
          postal_code: senderAddress?.cap || senderAddress?.postal_code || '20121',
          country: (senderAddress?.country || 'IT').toUpperCase(),
          email: senderAddress?.email || 'maker-dispatch@printforge.it',
          phone: senderAddress?.phone || '+39028900123'
        };

        // Build Client / Recipient Address
        const toAddr: PacklinkAddress = {
          name: order?.client_name || 'Cliente PrintForge',
          surname: 'Ricevente',
          street1: order?.shipping_address?.street || order?.shipping_street || 'Via Dante 18',
          city: order?.client_city || order?.shipping_address?.city || 'Milano',
          postal_code: order?.shipping_address?.cap || order?.shipping_cap || '20121',
          country: (order?.shipping_address?.country || 'IT').toUpperCase(),
          email: order?.client_email || 'cliente@printforge.it',
          phone: order?.shipping_address?.phone || '+393331234567'
        };

        // Standard 3D print parcel specifications
        const packages: PacklinkParcel[] = [
          {
            weight: 1.0,  // 1 kg standard protective packaging
            length: 22.0, // 22 cm
            width: 22.0,  // 22 cm
            height: 16.0  // 16 cm
          }
        ];

        // Call Packlink PRO Production API to create shipment draft
        const shipmentResponse = await packlinkClient.createShipment({
          shipment_custom_reference: orderId,
          from: fromAddr,
          to: toAddr,
          packages,
          content: `Stampa 3D / Componente Tecnico #${orderId}`
        });

        reference = shipmentResponse?.reference;
        if (!reference) {
          throw new Error('Packlink PRO API did not return a valid shipment reference.');
        }

        // ACCORGIMENTO 2: Salva IMMEDIATAMENTE packlink_reference su Supabase prima del pagamento/download
        if (order) {
          await supabaseAdmin
            .from(table)
            .update({
              packlink_reference: reference,
              shipping_carrier: 'UPS Standard'
            })
            .eq('id', orderId);
        }
      }

      // D. ACCORGIMENTO 1: Acquisto/conferma addebito su Packlink PRO
      await packlinkClient.payShipment(reference);

      // E. ACCORGIMENTO 1: Polling breve (4 tentativi a 2s di distanza) per PDF etichetta e tracking corriere
      const pollResult = await packlinkClient.pollForLabelAndTracking(reference, 4, 2000);

      // F. Salva i risultati definitivi su Supabase (PDF URL e codice di tracciamento reale)
      if (order && pollResult.labelUrl) {
        await supabaseAdmin
          .from(table)
          .update({
            packlink_reference: reference,
            shipping_label_url: pollResult.labelUrl,
            tracking_number: pollResult.trackingNumber,
            shipping_carrier: pollResult.carrier || 'UPS Standard'
          })
          .eq('id', orderId);
      }

      return NextResponse.json({
        success: true,
        reference,
        labelUrl: pollResult.labelUrl,
        trackingNumber: pollResult.trackingNumber,
        carrier: pollResult.carrier,
        status: pollResult.status
      });
    }

    // =========================================================================
    // 2. ACTION: get_labels
    // =========================================================================
    if (action === 'get_labels' && shipmentReference) {
      const labels = await packlinkClient.getLabels(shipmentReference);
      return NextResponse.json({ success: true, labels, labelUrl: labels[0] || null });
    }

    // =========================================================================
    // 3. ACTION: track
    // =========================================================================
    if (action === 'track' && shipmentReference) {
      const tracking = await packlinkClient.trackShipment(shipmentReference);
      return NextResponse.json({ success: true, tracking });
    }

    // =========================================================================
    // 4. ACTION: create_shipment
    // =========================================================================
    if (action === 'create_shipment' && shipmentData) {
      const created = await packlinkClient.createShipment(shipmentData);
      return NextResponse.json({ success: true, shipment: created });
    }

    // Default status check
    return NextResponse.json({
      success: true,
      service: 'Packlink PRO Shipping Engine',
      environment: 'production',
      endpoint: 'https://api.packlink.com/v1',
      configured: Boolean(process.env.PACKLINK_API_KEY)
    });
  } catch (error: any) {
    console.error('Packlink API Route Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal shipping error' },
      { status: 500 }
    );
  }
}
