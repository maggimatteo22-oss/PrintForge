'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Clock, 
  Layers, 
  Sparkles, 
  PackageCheck, 
  ShieldCheck, 
  AlertCircle,
  ArrowRight,
  DollarSign,
  Play,
  RotateCw
} from 'lucide-react';

export type ProductionStepId = 1 | 2 | 3 | 4 | 5;

interface ProductionTrackerProps {
  orderId?: string;
  initialStep?: ProductionStepId;
  totalPrintHours?: number;
  priceTotal?: number;
  onReleaseEscrow?: (orderId: string) => void;
}

const STEPS_DATA = [
  {
    id: 1,
    title: 'Approvato',
    subtitle: 'Fondi in Escrow',
    description: 'Ordine confermato dal Maker e fondi trattenuti in sicurezza nel conto Escrow di Stripe.',
    icon: ShieldCheck,
  },
  {
    id: 2,
    title: 'In Coda',
    subtitle: 'Slicing & Preparazione',
    description: 'File STL processato dallo slicer, gcode caricato sul piatto e filamento essiccato.',
    icon: Clock,
  },
  {
    id: 3,
    title: 'In Stampa',
    subtitle: 'Estrusione strati',
    description: 'Macchina in funzione. Calcolo dinamico dello stato di avanzamento della stampa.',
    icon: Layers,
  },
  {
    id: 4,
    title: 'Pulizia / Post-prod.',
    subtitle: 'Rimozione supporti',
    description: 'Raffreddamento, rimozione supporti manuale, cura UV e rifinitura della superficie.',
    icon: Sparkles,
  },
  {
    id: 5,
    title: 'Pronto per Ritiro',
    subtitle: 'Controllo Qualità OK',
    description: 'Ispezione AI superata. Il pezzo è pronto per il ritiro diretto o la spedizione tracciata.',
    icon: PackageCheck,
  },
];

export const ProductionTracker: React.FC<ProductionTrackerProps> = ({
  orderId = 'ORD-2026-9812',
  initialStep = 3,
  totalPrintHours = 6.5,
  priceTotal = 48.50,
  onReleaseEscrow,
}) => {
  const [currentStep, setCurrentStep] = useState<ProductionStepId>(initialStep);
  const [elapsedHours, setElapsedHours] = useState<number>(3.8);
  const [isEscrowReleased, setIsEscrowReleased] = useState<boolean>(false);
  const [isReleasing, setIsReleasing] = useState<boolean>(false);

  // Calculate live print progress percentage for Step 3
  const printProgressPercentage = Math.min(100, Math.round((elapsedHours / totalPrintHours) * 100));

  const handleNextStep = () => {
    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as ProductionStepId);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as ProductionStepId);
      setIsEscrowReleased(false);
    }
  };

  const handleReleaseEscrowClick = () => {
    setIsReleasing(true);
    setTimeout(() => {
      setIsEscrowReleased(true);
      setIsReleasing(false);
      if (onReleaseEscrow) {
        onReleaseEscrow(orderId);
      }
    }, 1200);
  };

  return (
    <div className="w-full bg-slate-950 rounded-2xl border border-slate-800 p-6 shadow-2xl text-white">
      {/* Tracker Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Tracker di Produzione dal Vivo
            </h2>
            <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
              #{orderId}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Stato dell&apos;ordine sincronizzato in tempo reale con il Maker locale
          </p>
        </div>

        {/* Step Testing Simulator Bar */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
          <span className="text-[11px] text-slate-400 font-medium">Simula Step:</span>
          <div className="flex items-center gap-1">
            {([1, 2, 3, 4, 5] as ProductionStepId[]).map((stepNum) => (
              <button
                key={stepNum}
                onClick={() => {
                  setCurrentStep(stepNum);
                  if (stepNum < 5) setIsEscrowReleased(false);
                }}
                className={`w-6 h-6 rounded-md text-xs font-mono font-bold transition ${
                  currentStep === stepNum
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {stepNum}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Horizontal 5-Step Timeline (Pizza Tracker) */}
      <div className="py-10 px-2 sm:px-6">
        <div className="relative">
          {/* Background Connecting Line */}
          <div className="absolute top-6 left-6 right-6 h-1 bg-slate-800 -translate-y-1/2 z-0" />

          {/* Animated Active Progress Line */}
          <motion.div
            className="absolute top-6 left-6 h-1 bg-emerald-500 -translate-y-1/2 z-0 shadow-lg shadow-emerald-500/50"
            initial={false}
            animate={{
              width: `${((currentStep - 1) / (STEPS_DATA.length - 1)) * 100}%`,
            }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />

          {/* Steps Nodes */}
          <div className="relative z-10 flex justify-between">
            {STEPS_DATA.map((step) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              const isPending = currentStep < step.id;

              return (
                <div key={step.id} className="flex flex-col items-center max-w-[120px] text-center">
                  <motion.div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl ${
                      isCompleted
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/20'
                        : isCurrent
                        ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-400/40 shadow-emerald-500/30 font-bold scale-110'
                        : 'bg-slate-900 border border-slate-800 text-slate-500'
                    }`}
                    animate={isCurrent ? { scale: [1, 1.08, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 2.5 }}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </motion.div>

                  <h3
                    className={`mt-3 text-xs font-bold leading-tight ${
                      isCurrent
                        ? 'text-emerald-400'
                        : isCompleted
                        ? 'text-slate-200'
                        : 'text-slate-500'
                    }`}
                  >
                    {step.title}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 hidden sm:block">
                    {step.subtitle}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dynamic Detail Card Based on Active Step */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
          className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 relative overflow-hidden"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-bold text-emerald-400">
                  Fase Attuale: Step {currentStep} di 5
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-slate-300 font-semibold">
                  {STEPS_DATA[currentStep - 1].title}
                </span>
              </div>
              <p className="text-sm text-slate-300">
                {STEPS_DATA[currentStep - 1].description}
              </p>
            </div>

            {/* Special Sub-Card for Step 3: Printing Progress Bar */}
            {currentStep === 3 && (
              <div className="w-full md:w-80 bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Tempo Stampa:</span>
                  <span className="text-emerald-400 font-bold">
                    {elapsedHours}h / {totalPrintHours}h ({printProgressPercentage}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${printProgressPercentage}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Inizio: 11:30</span>
                  <span>Fine stimata: 18:00</span>
                </div>
              </div>
            )}

            {/* Special Celebration Card for Step 5: Ready for Pickup & Escrow Release */}
            {currentStep === 5 && (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                {isEscrowReleased ? (
                  <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl text-xs font-semibold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div>Fondi Escrow Rilasciati con Successo!</div>
                      <div className="text-[10px] text-emerald-400/80 font-mono">
                        €{(priceTotal * 0.85).toFixed(2)} accreditati al Maker (15% platform fee trattenuta)
                      </div>
                    </div>
                  </div>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleReleaseEscrowClick}
                    disabled={isReleasing}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-xl shadow-emerald-900/50 flex items-center gap-2 border border-emerald-400/30"
                  >
                    <DollarSign className="w-4 h-4 text-emerald-200" />
                    {isReleasing ? 'Rilascio fondi in corso...' : 'Conferma Ricezione & Sblocca Escrow (€' + priceTotal.toFixed(2) + ')'}
                  </motion.button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
