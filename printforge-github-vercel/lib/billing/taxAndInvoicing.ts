export interface FiscalReceipt {
  receiptNumber: string;
  orderId: string;
  date: string;
  clientName: string;
  clientTaxCode?: string;
  clientBillingAddress: string;
  makerName: string;
  makerIsBusiness: boolean;
  makerVatOrFiscalCode?: string;
  fiscalRegimeNote: string;
  
  // Amounts Breakdown in EUR
  subtotalMaker: number;       // Print execution amount
  makerVatRate: number;        // 0% for hobbyist, 22% for business
  makerVatAmount: number;
  
  platformFeeNet: number;      // 15% platform intermediation fee
  platformVatRate: number;     // 22% VAT on platform fee
  platformVatAmount: number;
  
  totalPaid: number;
  pdfDownloadUrl?: string;
}

/**
 * Calculates Italian fiscal & tax profile for 3D Printing Marketplace orders
 * Distinguishes Hobbista (art. 67 DPR 917/86) vs Professionista (P.IVA)
 */
export function calculateFiscalBreakdown(params: {
  orderId: string;
  totalGrossEur: number;
  clientName: string;
  clientTaxCode?: string;
  clientAddress: string;
  makerName: string;
  makerIsBusiness: boolean;
  makerVatNumber?: string;
  makerTaxCode?: string;
}): FiscalReceipt {
  const {
    orderId,
    totalGrossEur,
    clientName,
    clientTaxCode,
    clientAddress,
    makerName,
    makerIsBusiness,
    makerVatNumber,
    makerTaxCode,
  } = params;

  // Platform Fee is 15% of gross
  const platformFeeGross = Number((totalGrossEur * 0.15).toFixed(2));
  const platformFeeNet = Number((platformFeeGross / 1.22).toFixed(2));
  const platformVatAmount = Number((platformFeeGross - platformFeeNet).toFixed(2));

  // Remainder to Maker: 85%
  const makerGross = Number((totalGrossEur * 0.85).toFixed(2));

  let makerVatRate = 0;
  let makerVatAmount = 0;
  let subtotalMaker = makerGross;
  let fiscalRegimeNote = '';

  if (makerIsBusiness) {
    makerVatRate = 22;
    subtotalMaker = Number((makerGross / 1.22).toFixed(2));
    makerVatAmount = Number((makerGross - subtotalMaker).toFixed(2));
    fiscalRegimeNote = 'Fattura Professionale con Partita IVA (Aliquota ordinaria 22%)';
  } else {
    makerVatRate = 0;
    makerVatAmount = 0;
    fiscalRegimeNote = 'Prestazione Occasionale non soggetta ad IVA ai sensi dell’art. 67 comma 1 lett. l) del D.P.R. 917/86 (Maker Hobbista)';
  }

  const receiptNum = `PF-REC-${new Date().getFullYear()}-${orderId.replace(/[^0-9]/g, '').slice(-4) || '1042'}`;

  return {
    receiptNumber: receiptNum,
    orderId,
    date: new Date().toLocaleDateString('it-IT'),
    clientName,
    clientTaxCode,
    clientBillingAddress: clientAddress,
    makerName,
    makerIsBusiness,
    makerVatOrFiscalCode: makerIsBusiness ? makerVatNumber : makerTaxCode,
    fiscalRegimeNote,
    subtotalMaker,
    makerVatRate,
    makerVatAmount,
    platformFeeNet,
    platformVatRate: 22,
    platformVatAmount,
    totalPaid: totalGrossEur,
    pdfDownloadUrl: `/api/billing/invoice/${orderId}.pdf`,
  };
}
