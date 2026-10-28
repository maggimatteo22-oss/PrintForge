'use client';

import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  MapPin, 
  Star, 
  CheckCircle2, 
  Users, 
  AlertTriangle, 
  Clock, 
  ShieldAlert,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { calculateSmartMatches, ScoredMakerCandidate } from '@/lib/matching/smartMatcher';

export const SmartMatchingSimulator: React.FC = () => {
  const [candidates, setCandidates] = useState<ScoredMakerCandidate[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('PLA');
  const [activeTab, setActiveTab] = useState<'ranking' | 'routing'>('ranking');
  const [isExecutingCascade, setIsExecutingCascade] = useState<boolean>(false);
  const [cascadeState, setCascadeState] = useState<{
    currentMakerIndex: number;
    hoursLeft: number;
    log: string[];
  }>({
    currentMakerIndex: 0,
    hoursLeft: 4,
    log: [],
  });

  useEffect(() => {
    async function load() {
      const results = await calculateSmartMatches({
        clientLat: 45.4642,
        clientLng: 9.1900,
        requiredMaterial: selectedMaterial,
        partDimensions: { x: 50, y: 35, z: 50 },
      });
      setCandidates(results);
    }
    load();
  }, [selectedMaterial]);

  const simulateCascadeTimeout = () => {
    if (candidates.length < 2) return;
    setIsExecutingCascade(true);

    const logs = [
      `[14:00] Ordine assegnato al Maker #1: ${candidates[0].makerName} (Match Score: ${candidates[0].matchScore}/100)`,
      `[16:00] Alert inattività 2h inviato al Maker #1 via Resend email transazionale.`,
      `[18:00] TIMEOUT 4h SCADUTO: Maker #1 non ha risposto. Assegnazione revocata automaticamente.`,
      `[18:01] Ordine riassegnato a cascata al Maker #2: ${candidates[1].makerName} (Match Score: ${candidates[1].matchScore}/100)`
    ];

    setCascadeState({
      currentMakerIndex: 1,
      hoursLeft: 4,
      log: logs,
    });
    setIsExecutingCascade(false);
  };

  return (
    <div className="w-full bg-slate-950 rounded-2xl border border-slate-800 p-6 shadow-2xl text-white">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Algoritmo di Smart Matching & Routing a Cascata
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono uppercase">
                Score Ponderato (1-100)
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Pesi: Vicinanza Geografica (40%), Valutazione Recensioni (30%), Tasso di Completamento (20%), Coda di Lavoro (10%)
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('ranking')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'ranking' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            Classifica Maker Ponderata
          </button>
          <button
            onClick={() => setActiveTab('routing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'routing' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            Simulatore Routing Cascata (4h)
          </button>
        </div>
      </div>

      {activeTab === 'ranking' ? (
        <div className="mt-6 space-y-4">
          {/* Diagnostic Note */}
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Protezione Overbooking attiva: Makers con <strong>active_orders &gt;= max_active_orders</strong> esclusi a monte.
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">
              {candidates.length} Maker idonei trovati
            </span>
          </div>

          {/* Maker Candidates Ranking Cards */}
          <div className="space-y-3">
            {candidates.map((maker, idx) => (
              <div
                key={maker.makerId}
                className={`p-4 rounded-xl border transition-all ${
                  idx === 0
                    ? 'bg-emerald-950/20 border-emerald-500/50 shadow-lg shadow-emerald-950/50'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${
                        idx === 0
                          ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400/50'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{maker.makerName}</h4>
                        {idx === 0 && (
                          <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-mono border border-emerald-500/30">
                            Miglior Match
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        {maker.city} • <span className="font-mono">{maker.breakdown.distanceKm} km</span>
                      </p>
                    </div>
                  </div>

                  {/* Total Score Badge */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">
                        Match Score Finale
                      </span>
                      <span className="text-xl font-mono font-bold text-emerald-400">
                        {maker.matchScore}
                        <span className="text-xs text-slate-500">/100</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score Factor Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs">
                  <div className="bg-slate-950/60 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Vicinanza (40%)</span>
                    <span className="font-mono font-bold text-slate-200">{maker.breakdown.proximityScore} pt</span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Rating (30%)</span>
                    <span className="font-mono font-bold text-slate-200">{maker.breakdown.ratingScore} pt</span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Completamento (20%)</span>
                    <span className="font-mono font-bold text-slate-200">{maker.breakdown.completionScore} pt</span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Disponibilità Coda (10%)</span>
                    <span className="font-mono font-bold text-slate-200">{maker.breakdown.queueScore} pt</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Cascading Routing Simulator View */
        <div className="mt-6 space-y-5">
          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Logica di Routing a Cascata con Finestra di 4 Ore
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              L&apos;algoritmo notifica prima il Maker con il Match Score più elevato (#1). Se il Maker non risponde o declina entro 4 ore, la proposta viene automaticamente revocata e passata al Maker #2, garantendo tempi certi al cliente.
            </p>

            <button
              onClick={simulateCascadeTimeout}
              disabled={isExecutingCascade}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Simula Scadenza 4 Ore (Timeout Maker #1 &rarr; Routing a Maker #2)
            </button>
          </div>

          {cascadeState.log.length > 0 && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs space-y-2">
              <span className="text-[11px] text-emerald-400 font-bold uppercase block tracking-wider mb-2">
                Audit Trail Routing Real-Time:
              </span>
              {cascadeState.log.map((line, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded ${
                    idx === cascadeState.log.length - 1
                      ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400'
                  }`}
                >
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
