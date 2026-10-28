'use client';

import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  ShieldCheck, 
  CheckSquare, 
  Square, 
  Lock, 
  AlertCircle,
  FileCheck,
  CheckCircle2
} from 'lucide-react';
import { recordLegalAuditTrail } from '@/app/actions/uploadAudit';

interface FileUploaderWithConsentProps {
  onFileReady?: (file: File, auditData: any) => void;
}

export const FileUploaderWithConsent: React.FC<FileUploaderWithConsentProps> = ({ onFileReady }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successAudit, setSuccessAudit] = useState<any>(null);

  // 3 Mandatory Blocking Legal Checkboxes
  const [tosConsent, setTosConsent] = useState<boolean>(false);
  const [ipWarrantyConsent, setIpWarrantyConsent] = useState<boolean>(false);
  const [makerLimitedUseConsent, setMakerLimitedUseConsent] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const allConsentsChecked = tosConsent && ipWarrantyConsent && makerLimitedUseConsent;

  const handleFileSelect = (selectedFile: File) => {
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    if (!['.stl', '.step', '.stp', '.obj'].includes(ext)) {
      alert('Formato non supportato. Carica solo file con estensione .stl, .step o .obj');
      return;
    }
    setFile(selectedFile);
    setSuccessAudit(null);
  };

  const handleSubmit = async () => {
    if (!file) {
      alert('Carica prima un file 3D.');
      return;
    }
    if (!allConsentsChecked) {
      alert('Tutte e 3 le caselle legali devono essere obbligatoriamente spuntate.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      const res = await recordLegalAuditTrail({
        tosAccepted: tosConsent,
        ipWarrantyAccepted: ipWarrantyConsent,
        liabilityWaiverAccepted: makerLimitedUseConsent,
        fileName: file.name,
        fileSizeBytes: file.size,
        fileFormat: ext,
      });

      if (res.success) {
        setSuccessAudit(res.auditRecord);
        if (onFileReady) onFileReady(file, res.auditRecord);
      } else {
        alert(res.error || 'Errore durante la registrazione del consenso');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-slate-950 rounded-2xl border border-slate-800 p-6 shadow-2xl text-white">
      {/* Header */}
      <div className="flex items-center space-x-3 pb-5 border-b border-slate-800">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            Caricamento Protetto & Tutela Proprietà Intellettuale
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono uppercase">
              GDPR & Audit Trail
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            I tuoi modelli 3D sono crittografati in storage privato Supabase e visibili solo al Maker assegnato
          </p>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`mt-6 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
          isDragging
            ? 'border-emerald-400 bg-emerald-500/10'
            : file
            ? 'border-emerald-500/60 bg-slate-900/80'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".stl,.step,.stp,.obj"
          onChange={(e) => e.target.files && e.target.files[0] && handleFileSelect(e.target.files[0])}
          className="hidden"
        />

        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileCheck className="w-8 h-8 text-emerald-400" />
            <div className="text-left">
              <span className="font-semibold text-white text-sm block">{file.name}</span>
              <span className="text-xs text-slate-400 font-mono">
                {(file.size / (1024 * 1024)).toFixed(2)} MB • File pronto per la validazione
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-sm font-semibold text-slate-200">
              Trascina qui il file 3D oppure <span className="text-emerald-400 underline">sfoglia</span>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Formati accettati: .stl, .step, .obj (Max 100 MB)
            </p>
          </div>
        )}
      </div>

      {/* The 3 Mandatory Blocking Legal Checkboxes */}
      <div className="mt-6 space-y-3 p-4 bg-slate-900/60 rounded-xl border border-slate-800">
        <span className="text-xs font-bold text-slate-300 block uppercase tracking-wider mb-2">
          Dichiarazioni Legali Obbligatorie (Tracciamento IP & Timestamp):
        </span>

        {/* Checkbox 1 */}
        <label className="flex items-start gap-3 cursor-pointer select-none group">
          <input
            type="checkbox"
            checked={tosConsent}
            onChange={(e) => setTosConsent(e.target.checked)}
            className="hidden"
          />
          <div className="mt-0.5 shrink-0 text-emerald-400">
            {tosConsent ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />}
          </div>
          <span className="text-xs text-slate-300 leading-relaxed">
            Accetto i <strong>Termini di Servizio</strong> e l&apos;<strong>Informativa sulla Privacy (GDPR)</strong>.
          </span>
        </label>

        {/* Checkbox 2 */}
        <label className="flex items-start gap-3 cursor-pointer select-none group">
          <input
            type="checkbox"
            checked={ipWarrantyConsent}
            onChange={(e) => setIpWarrantyConsent(e.target.checked)}
            className="hidden"
          />
          <div className="mt-0.5 shrink-0 text-emerald-400">
            {ipWarrantyConsent ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />}
          </div>
          <span className="text-xs text-slate-300 leading-relaxed">
            Dichiaro sotto la mia esclusiva responsabilità di <strong>possedere i diritti di riproduzione, copyright o licenza commerciale</strong> per stampare questo modello 3D, sollevando la piattaforma e il Maker da ogni responsabilità legale.
          </span>
        </label>

        {/* Checkbox 3 */}
        <label className="flex items-start gap-3 cursor-pointer select-none group">
          <input
            type="checkbox"
            checked={makerLimitedUseConsent}
            onChange={(e) => setMakerLimitedUseConsent(e.target.checked)}
            className="hidden"
          />
          <div className="mt-0.5 shrink-0 text-emerald-400">
            {makerLimitedUseConsent ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />}
          </div>
          <span className="text-xs text-slate-300 leading-relaxed">
            Autorizzo il Maker selezionato ad accedere al file <strong>esclusivamente per l&apos;esecuzione della stampa</strong> e ne vieto ogni ulteriore divulgazione o riutilizzo commerciale.
          </span>
        </label>
      </div>

      {/* Audit Confirmation Banner */}
      {successAudit && (
        <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Audit Trail registrato: IP <strong>{successAudit.user_ip_address}</strong> • Data: <strong>{new Date(successAudit.tos_accepted_at).toLocaleString()}</strong>
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
            ID Legal Trail Salvo
          </span>
        </div>
      )}

      {/* Submit Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!file || !allConsentsChecked || isSubmitting}
          className="px-6 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white shadow-lg shadow-emerald-900/30 transition flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          <Lock className="w-3.5 h-3.5" />
          {isSubmitting ? 'Registrazione consensi in corso...' : 'Valida Consensi e Procedi al Preventivo'}
        </button>
      </div>
    </div>
  );
};
