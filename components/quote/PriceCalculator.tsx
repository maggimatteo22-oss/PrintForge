'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Clock, 
  Layers, 
  DollarSign, 
  Cpu, 
  ShieldCheck, 
  Percent, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { QuoteBreakdown, MATERIAL_DENSITIES } from '@/lib/pricing/quoteEngine';
import { calculateQuoteServerAction } from '@/app/actions/pricing';

interface PriceCalculatorProps {
  initialVolumeCm3?: number;
  initialDimensions?: { x: number; y: number; z: number };
  onOrderProceed?: (quote: QuoteBreakdown) => void;
}

export const PriceCalculator: React.FC<PriceCalculatorProps> = ({
  initialVolumeCm3 = 42.8,
  initialDimensions = { x: 50, y: 35, z: 50 },
  onOrderProceed,
}) => {
  const [material, setMaterial] = useState<string>('PLA');
  const [infill, setInfill] = useState<number>(20);
  const [scaleFactor, setScaleFactor] = useState<number>(1.0);
  const [quote, setQuote] = useState<QuoteBreakdown | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Recalculate price on parameter changes using server action
  useEffect(() => {
    let isCancelled = false;

    async function fetchQuote() {
      setIsCalculating(true);
      const res = await calculateQuoteServerAction({
        solidVolumeCm3: initialVolumeCm3,
        dimensionsMm: initialDimensions,
        infillPercentage: infill,
        material,
        makerHourlyRateEur: 3.50,
        makerStartupFeeEur: 5.00,
        scaleFactor,
      });

      if (!isCancelled && res.success && res.quote) {
        setQuote(res.quote);
      }
      if (!isCancelled) setIsCalculating(false);
    }

    fetchQuote();
    return () => { isCancelled = true; };
  }, [material, infill, scaleFactor, initialVolumeCm3]);

  return (
    <div className="w-full bg-slate-950 rounded-2xl border border-slate-800 p-6 shadow-2xl text-white">
      {/* Header */}
      <div className="flex items-center space-x-3 pb-5 border-b border-slate-800">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
          <Calculator className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            Motore di Preventivazione 3D Matematico
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono uppercase">
              Server-Side Validated
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Formula algoritmica basata su volume effettivo, densità infill, tempo macchina e markup di avvio
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
        {/* Left Controls */}
        <div className="space-y-5">
          {/* Material Picker */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Seleziona Materiale:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.keys(MATERIAL_DENSITIES).map((mat) => (
                <button
                  key={mat}
                  onClick={() => setMaterial(mat)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition text-center ${
                    material === mat
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-lg shadow-emerald-500/20'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {mat}
                  <span className="block text-[10px] opacity-75 font-mono">
                    €{(MATERIAL_DENSITIES[mat].costPerGram * 1000).toFixed(0)}/kg
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Infill Percentage Slider */}
          <div>
            <div className="flex justify-between items-center text-xs font-medium text-slate-300 mb-2">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                Densità di Infill (Riempimento interno):
              </span>
              <span className="font-mono text-emerald-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {infill}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={infill}
              onChange={(e) => setInfill(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>10% (Leggero/Eco)</span>
              <span>20% (Consigliato FDM)</span>
              <span>100% (Solido)</span>
            </div>
          </div>

          {/* Quick Specifications */}
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs space-y-1.5 font-mono text-slate-400">
            <div className="flex justify-between">
              <span>Dimensioni Bounding Box:</span>
              <span className="text-white">
                {(initialDimensions.x * scaleFactor).toFixed(1)} x {(initialDimensions.y * scaleFactor).toFixed(1)} x {(initialDimensions.z * scaleFactor).toFixed(1)} mm
              </span>
            </div>
            <div className="flex justify-between">
              <span>Volume Solido Totale:</span>
              <span className="text-white">
                {(initialVolumeCm3 * Math.pow(scaleFactor, 3)).toFixed(1)} cm³
              </span>
            </div>
          </div>
        </div>

        {/* Right Financial Breakdown */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Dettaglio Costi di Produzione
              </span>
              {isCalculating && (
                <span className="text-[10px] text-emerald-400 font-mono animate-pulse">
                  Calcolo in corso...
                </span>
              )}
            </div>

            {quote && (
              <div className="mt-4 space-y-3 text-xs">
                {/* Filament */}
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Filamento ({quote.materialGrams}g di {material}):</span>
                  <span className="font-mono font-semibold text-white">€{quote.materialCostEur.toFixed(2)}</span>
                </div>

                {/* Machine Time */}
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Tempo macchina stimato ({quote.estimatedPrintHours} ore @ €3.50/h):</span>
                  <span className="font-mono font-semibold text-white">€{quote.machineTimeCostEur.toFixed(2)}</span>
                </div>

                {/* Startup fee */}
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Avvio macchina & pulizia piatto:</span>
                  <span className="font-mono font-semibold text-white">€{quote.startupFeeEur.toFixed(2)}</span>
                </div>

                {/* Maker Subtotal */}
                <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Spettanza Maker (85%):</span>
                  <span className="font-mono font-semibold text-emerald-400">€{quote.makerSubtotalEur.toFixed(2)}</span>
                </div>

                {/* Platform Fee */}
                <div className="flex justify-between items-center text-slate-400 text-[11px]">
                  <span>Fee Intermediazione Piattaforma & Garanzia Escrow (15%):</span>
                  <span className="font-mono font-semibold text-slate-300">€{quote.platformFeeEur.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Grand Total */}
          {quote && (
            <div className="mt-6 pt-4 border-t border-slate-800">
              <div className="flex justify-between items-baseline mb-4">
                <span className="text-sm font-semibold text-slate-200">Prezzo Finale Trasparente:</span>
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  €{quote.totalPriceEur.toFixed(2)}
                </span>
              </div>

              <button
                onClick={() => {
                  if (onOrderProceed) onOrderProceed(quote);
                  alert(`Ordine avviato con successo! Importo €${quote.totalPriceEur.toFixed(2)} bloccato in Escrow.`);
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/40 transition flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Accetta Preventivo & Paga con Escrow
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
