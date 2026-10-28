'use client';

import React, { useState } from 'react';
import { 
  Camera, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ShieldAlert, 
  RotateCcw,
  Send,
  Eye
} from 'lucide-react';
import { QAResult } from '@/lib/vision/qaValidator';

interface VisionValidationProps {
  orderId?: string;
  onValidationSuccess?: () => void;
}

export const VisionValidationUploader: React.FC<VisionValidationProps> = ({
  orderId = 'ORD-2026-9812',
  onValidationSuccess,
}) => {
  const [photo1, setPhoto1] = useState<string | null>(null);
  const [photo2, setPhoto2] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [qaResult, setQaResult] = useState<QAResult | null>(null);

  // Demo sample photos for quick testing
  const loadDemoPhotos = (withDefects = false) => {
    if (withDefects) {
      setPhoto1('https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600');
      setPhoto2('https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600');
    } else {
      setPhoto1('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600');
      setPhoto2('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600');
    }
    setQaResult(null);
  };

  const handleSimulateScan = (simulateDefect = false) => {
    if (!photo1 || !photo2) {
      alert('Devi scattare o caricare entrambe le 2 foto prima di avviare il controllo qualità!');
      return;
    }

    setIsScanning(true);
    setQaResult(null);

    setTimeout(() => {
      setIsScanning(false);
      if (simulateDefect) {
        setQaResult({
          approved: false,
          confidenceScore: 68,
          defectsDetected: [
            {
              type: 'delamination',
              severity: 'severe',
              description: 'Delaminazione severa visibile sui layer intermedi (altezza Z ~45mm). Rischio di cedimento strutturale.',
            },
            {
              type: 'stringing',
              severity: 'moderate',
              description: 'Presenza di fili di estrusione non rimossi tra i fori passanti.',
            },
          ],
          summaryFeedback: 'La stampa non ha superato i requisiti minimi di coesione tra i layer. Spedizione bloccata: ristampa necessaria.',
          reprintRequired: true,
        });
      } else {
        const approvedResult: QAResult = {
          approved: true,
          confidenceScore: 94,
          defectsDetected: [],
          summaryFeedback: 'Geometria perfetta, layer uniformi senza delaminazione né warping alla base. Tolleranze visive rispettate.',
          reprintRequired: false,
        };
        setQaResult(approvedResult);
        if (onValidationSuccess) onValidationSuccess();
      }
    }, 2000);
  };

  return (
    <div className="w-full bg-slate-950 rounded-2xl border border-slate-800 p-6 shadow-2xl text-white">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Controllo Qualità AI (Vision Validation)
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-mono uppercase">
                Pre-Spedizione
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Scatta 2 foto del manufatto per validare l&apos;assenza di difetti tipici (delaminazione, warping, stringing)
            </p>
          </div>
        </div>

        {/* Demo Quick Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadDemoPhotos(false)}
            className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
          >
            Carica Foto Conforme
          </button>
          <button
            onClick={() => loadDemoPhotos(true)}
            className="text-[11px] bg-slate-800 hover:bg-slate-700 text-amber-300 px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
          >
            Carica Foto Difettosa
          </button>
        </div>
      </div>

      {/* 2-Photo Mobile-Friendly Upload Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
        {/* Photo 1: Angolo Frontale & Base */}
        <div className="border border-dashed border-slate-800 rounded-xl p-4 bg-slate-900/60 flex flex-col items-center justify-center min-h-[200px] relative overflow-hidden group">
          {photo1 ? (
            <div className="relative w-full h-44 rounded-lg overflow-hidden">
              <img src={photo1} alt="Foto 1 Frontale" className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 bg-slate-950/80 text-cyan-400 text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/30">
                Foto 1: Angolo Frontale & Base
              </div>
              <button
                onClick={() => setPhoto1(null)}
                className="absolute top-2 right-2 bg-slate-950/80 text-rose-400 p-1 rounded hover:bg-slate-900"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <Camera className="w-8 h-8 text-slate-500 mx-auto" />
              <div className="text-xs font-semibold text-slate-300">Foto 1: Angolo Frontale & Base</div>
              <p className="text-[11px] text-slate-500 max-w-xs">
                Inquadra la base del pezzo per verificare l&apos;adesione e l&apos;assenza di warping.
              </p>
              <button
                onClick={() => setPhoto1('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600')}
                className="mt-2 text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 font-medium"
              >
                Scatta o Carica Foto
              </button>
            </div>
          )}
        </div>

        {/* Photo 2: Dettaglio Macro & Layer */}
        <div className="border border-dashed border-slate-800 rounded-xl p-4 bg-slate-900/60 flex flex-col items-center justify-center min-h-[200px] relative overflow-hidden group">
          {photo2 ? (
            <div className="relative w-full h-44 rounded-lg overflow-hidden">
              <img src={photo2} alt="Foto 2 Dettaglio" className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 bg-slate-950/80 text-amber-400 text-[10px] font-mono px-2 py-0.5 rounded border border-amber-500/30">
                Foto 2: Macro Layer & Dettagli
              </div>
              <button
                onClick={() => setPhoto2(null)}
                className="absolute top-2 right-2 bg-slate-950/80 text-rose-400 p-1 rounded hover:bg-slate-900"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <Camera className="w-8 h-8 text-slate-500 mx-auto" />
              <div className="text-xs font-semibold text-slate-300">Foto 2: Macro Layer & Dettagli</div>
              <p className="text-[11px] text-slate-500 max-w-xs">
                Primo piano delle pareti verticali per verificare l&apos;assenza di delaminazione o stringing.
              </p>
              <button
                onClick={() => setPhoto2('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600')}
                className="mt-2 text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 font-medium"
              >
                Scatta o Carica Foto
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AI Analysis Diagnostic Results Card */}
      {qaResult && (
        <div
          className={`p-5 rounded-xl border mb-6 transition-all ${
            qaResult.approved
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {qaResult.approved ? (
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              )}
              <div>
                <h3 className="text-sm font-bold text-white">
                  {qaResult.approved
                    ? 'Qualità Approvata dall’AI (Spedizione Sbloccata)'
                    : 'Anomalia Rilevata: Spedizione Bloccata'}
                </h3>
                <p className="text-xs mt-0.5 text-slate-300">
                  {qaResult.summaryFeedback}
                </p>
              </div>
            </div>

            {/* Confidence Score Meter */}
            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-400 block">AI Confidence Score</span>
              <span
                className={`text-lg font-mono font-bold ${
                  qaResult.confidenceScore > 85 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {qaResult.confidenceScore}%
              </span>
              <span className="text-[9px] text-slate-400 block font-mono">Soglia minima: &gt;85%</span>
            </div>
          </div>

          {/* Defect list if any */}
          {qaResult.defectsDetected.length > 0 && (
            <div className="mt-4 pt-3 border-t border-rose-500/20 space-y-2">
              <span className="text-xs font-bold text-rose-300 block uppercase tracking-wider">
                Difetti Rilevati:
              </span>
              {qaResult.defectsDetected.map((d, i) => (
                <div key={i} className="text-xs bg-rose-950/40 p-2.5 rounded-lg border border-rose-500/30 text-rose-200 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold uppercase text-[11px] text-rose-300">
                      [{d.severity}] {d.type}:
                    </span>{' '}
                    {d.description}
                  </div>
                </div>
              ))}
              <p className="text-[11px] text-rose-300/80 italic mt-2">
                ⚠️ L&apos;anomalia è stata inviata automaticamente alla dashboard di amministrazione per revisione.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-800">
        <button
          onClick={() => handleSimulateScan(false)}
          disabled={!photo1 || !photo2 || isScanning}
          className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-900/30 flex items-center gap-2 transition"
        >
          <Sparkles className="w-4 h-4" />
          {isScanning ? 'Scansione Vision in corso...' : 'Valida Foto con AI Vision (Test Conforme)'}
        </button>

        <button
          onClick={() => handleSimulateScan(true)}
          disabled={!photo1 || !photo2 || isScanning}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-900/30 flex items-center gap-2 transition"
        >
          <AlertTriangle className="w-4 h-4" />
          Simula Rilevamento Difetto
        </button>

        {/* Shipping Action Button - strictly disabled until approval */}
        <button
          disabled={!qaResult?.approved}
          onClick={() => alert('Spedizione confermata e codice di tracking generato!')}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          Conferma & Spedisci Ordine
        </button>
      </div>
    </div>
  );
};
