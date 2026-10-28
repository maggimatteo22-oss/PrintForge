'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Building2, 
  UserCheck, 
  CheckCircle2, 
  Receipt,
  Search,
  ExternalLink
} from 'lucide-react';
import { FiscalReceipt, calculateFiscalBreakdown } from '@/lib/billing/taxAndInvoicing';

export const InvoicesList: React.FC = () => {
  const [receipts] = useState<FiscalReceipt[]>([
    calculateFiscalBreakdown({
      orderId: 'ORD-2026-9812',
      totalGrossEur: 48.50,
      clientName: 'Matteo Maggi',
      clientTaxCode: 'MGGMTT95A01F205X',
      clientAddress: 'Via Montenapoleone 12, Milano',
      makerName: 'Studio Lab Maker Sesto',
      makerIsBusiness: true,
      makerVatNumber: 'IT12345678901',
    }),
    calculateFiscalBreakdown({
      orderId: 'ORD-2026-7731',
      totalGrossEur: 24.00,
      clientName: 'Matteo Maggi',
      clientTaxCode: 'MGGMTT95A01F205X',
      clientAddress: 'Via Montenapoleone 12, Milano',
      makerName: 'Marco Rossi (Maker Hobbista)',
      makerIsBusiness: false,
      makerTaxCode: 'RSSMRC88H12F205K',
    }),
  ]);

  return (
    <div className="w-full bg-slate-950 rounded-2xl border border-slate-800 p-6 shadow-2xl text-white">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Cruscotto Fiscale & Ricevute Ordini
            </h2>
            <p className="text-xs text-slate-400">
              Gestione automatizzata Stripe Tax: Hobbisti (Prestazione occasionale) e Professionisti (Fattura P.IVA)
            </p>
          </div>
        </div>

        <span className="text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg font-mono text-slate-300">
          Totale Documenti: {receipts.length}
        </span>
      </div>

      {/* Receipts Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
              <th className="pb-3 font-semibold">N. RICEVUTA / DATA</th>
              <th className="pb-3 font-semibold">MAKER E REGIME</th>
              <th className="pb-3 font-semibold">FEE PIATTAFORMA (15%)</th>
              <th className="pb-3 font-semibold">TOTALE PAGATO</th>
              <th className="pb-3 font-semibold text-right">DOCUMENTO</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {receipts.map((r) => (
              <tr key={r.receiptNumber} className="hover:bg-slate-900/50 transition">
                <td className="py-4">
                  <div className="font-mono text-emerald-400 font-bold">{r.receiptNumber}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{r.date} • Ordine #{r.orderId}</div>
                </td>

                <td className="py-4">
                  <div className="flex items-center gap-1.5">
                    {r.makerIsBusiness ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        <Building2 className="w-3 h-3" /> P.IVA
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <UserCheck className="w-3 h-3" /> Hobbista
                      </span>
                    )}
                    <span className="text-white font-semibold">{r.makerName}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 max-w-sm">
                    {r.fiscalRegimeNote}
                  </div>
                </td>

                <td className="py-4 font-mono">
                  <div className="text-white">€{(r.platformFeeNet + r.platformVatAmount).toFixed(2)}</div>
                  <div className="text-[10px] text-slate-400">
                    Net: €{r.platformFeeNet.toFixed(2)} + IVA 22%: €{r.platformVatAmount.toFixed(2)}
                  </div>
                </td>

                <td className="py-4">
                  <div className="text-sm font-bold text-white font-mono">
                    €{r.totalPaid.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Pagato con Escrow
                  </div>
                </td>

                <td className="py-4 text-right">
                  <button
                    onClick={() => {
                      alert(`Download PDF della ricevuta ${r.receiptNumber} generato.`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    Scarica PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
