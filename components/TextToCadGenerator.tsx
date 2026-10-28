'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { Sparkles, Box, RefreshCw, Send, CheckCircle2, AlertCircle, Eye, Download, Layers } from 'lucide-react';

/**
 * Componente "Generatore 3D Assistito" (Text-to-3D)
 * 
 * ISTRUZIONE TASSATIVA:
 * Interfacciato esclusivamente con la skill "cad" (earthtojake/text-to-cad)
 * che impiega build123d con decoratori parametrici @stl e @step.
 */

export interface GeneratedCadModel {
  id: string;
  name: string;
  filename: string;
  dimensions: string;
  volumeCm3: number;
  weightGrams: number;
  stlData: string;
  pythonSource: string;
  recommendedTech: 'FDM' | 'SLA' | 'SLS';
  recommendedMaterial: string;
  estimatedPrintTimeHours: number;
  estimatedCostEur: number;
}

interface TextToCadGeneratorProps {
  onPublishToBoard?: (model: GeneratedCadModel) => void;
}

type GeneratorState = 'idle' | 'loading' | 'success' | 'error';

export default function TextToCadGenerator({ onPublishToBoard }: TextToCadGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [state, setState] = useState<GeneratorState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);
  const [generatedModel, setGeneratedModel] = useState<GeneratedCadModel | null>(null);

  // 3D Canvas ref
  const canvasRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const samplePrompts = [
    { title: '🏺 Vaso esagonale', prompt: 'Un vaso esagonale moderno con base larga e pareti geometriche sottili' },
    { title: '📱 Supporto smartphone', prompt: 'Supporto da scrivania per smartphone inclinato a 60 gradi con asola passacavo' },
    { title: '⚙️ Ingranaggio 24 denti', prompt: 'Ingranaggio cilindrico a denti dritti diametro 60mm foro centrale 8mm' },
    { title: '📦 Scocca protettiva', prompt: 'Scocca per elettronica con fori di areazione laterali e bordi arrotondati' }
  ];

  const loadingStepsText = [
    'Analisi semantica del prompt e vincoli geometrici...',
    'Esecuzione modello parametrico tramite skill cad (build123d kernel)...',
    'Compilazione mesh STL watertight e calcolo volume solido...',
    'Validazione quote millimetriche ed estrazione scheda tecnica...'
  ];

  // Gestione animazione step durante la compilazione CAD
  useEffect(() => {
    let interval: any = null;
    if (state === 'loading') {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingStepsText.length - 1 ? prev + 1 : prev));
      }, 1200);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state]);

  // Inizializzazione e aggiornamento scena Three.js per anteprima STL
  useEffect(() => {
    if (state !== 'success' || !generatedModel || !canvasRef.current) return;

    const container = canvasRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 400;

    // Scena Three.js
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070709);
    sceneRef.current = scene;

    // Griglia tecnica
    const gridHelper = new THREE.GridHelper(180, 18, 0x33333d, 0x1a1a22);
    gridHelper.position.y = -20;
    scene.add(gridHelper);

    // Illuminazione da studio CAD
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xff6600, 1.2); // Luce d'accento arancione PrintForge
    dirLight1.position.set(60, 100, 60);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight2.position.set(-80, 60, -50);
    scene.add(dirLight2);

    // Telecamera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(90, 80, 130);

    // Renderer WebGL
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controlli orbita
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1; // Non scendere sotto il piano di lavoro

    // Parsing e caricamento mesh STL generata
    const loader = new STLLoader();
    try {
      const geometry = loader.parse(generatedModel.stlData);
      geometry.center();
      geometry.computeVertexNormals();

      // Materiale con finitura arancione lucida e wireframe sottile
      const material = new THREE.MeshPhysicalMaterial({
        color: 0xff6600,
        metalness: 0.15,
        roughness: 0.35,
        clearcoat: 0.3,
        clearcoatRoughness: 0.2
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      meshRef.current = mesh;

      // Animazione di rotazione e rendering
      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate);
        mesh.rotation.y += 0.005; // Rotazione lenta di presentazione
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

    } catch (e) {
      console.error('Errore parsing STL:', e);
    }

    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      renderer.dispose();
    };
  }, [state, generatedModel]);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    setState('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/cad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() })
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Errore nella generazione CAD');
      }

      setGeneratedModel(json.data);
      setState('success');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Errore durante la compilazione del modello.');
      setState('error');
    }
  };

  const handlePublishClick = () => {
    if (!generatedModel) return;
    if (onPublishToBoard) {
      onPublishToBoard(generatedModel);
    }
  };

  const handleDownloadStl = () => {
    if (!generatedModel) return;
    const blob = new Blob([generatedModel.stlData], { type: 'model/stl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = generatedModel.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 py-6">
      
      {/* Header Sezione */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0d0d10] border border-[#22222a] text-xs font-mono text-zinc-300">
          <Sparkles className="w-3.5 h-3.5 text-[#ff6600]" />
          <span>Generatore 3D Assistito • Motore CAD Parametrico</span>
        </div>
        
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Non hai il file 3D? <br />
          <span className="bg-gradient-to-r from-white via-[#ff7700] to-[#ff5500] bg-clip-text text-transparent">
            Descrivilo a parole.
          </span>
        </h2>
        <p className="text-sm text-zinc-400 max-w-xl mx-auto">
          Scrivi che cosa desideri stampare: la nostra integrazione con la <strong>skill cad</strong> genererà automaticamente la geometria solida millimetrica pronta per la bacheca.
        </p>
      </div>

      {/* Box Input Prompt (Stile ChatGPT / Midjourney Minimal) */}
      <div className="p-2 sm:p-3 rounded-2xl bg-[#09090c] border border-[#1e1e24] focus-within:border-[#ff6600] transition duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
        <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Descrivi l'oggetto che vuoi creare (es. un vaso esagonale moderno con base larga)..."
              disabled={state === 'loading'}
              className="w-full bg-transparent px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={state === 'loading' || !prompt.trim()}
            className="px-6 py-3 rounded-xl bg-[#ff6600] hover:bg-[#ff7700] text-black font-extrabold text-xs flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,102,0,0.4)]"
          >
            {state === 'loading' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generazione in corso...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Genera Modello</span>
              </>
            )}
          </button>
        </form>

        {/* Prompt Suggeriti */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3 px-2 border-t border-[#141418] text-xs">
          <span className="text-[11px] font-mono text-zinc-500 mr-1">Esempi rapidi:</span>
          {samplePrompts.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setPrompt(sample.prompt)}
              className="px-2.5 py-1 rounded-lg bg-[#101014] hover:bg-[#181820] border border-[#1e1e24] hover:border-[#ff6600]/40 text-[11px] text-zinc-300 hover:text-white transition"
            >
              {sample.title}
            </button>
          ))}
        </div>
      </div>

      {/* STATO: LOADING (Feedback visivo accattivante dei passaggi CAD) */}
      {state === 'loading' && (
        <div className="p-8 rounded-2xl bg-[#09090c] border border-[#1e1e24] text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#141418] border border-[#ff6600]/40 flex items-center justify-center text-[#ff6600] shadow-[0_0_24px_rgba(255,102,0,0.3)] animate-pulse">
            <Box className="w-8 h-8 animate-spin" />
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-white">Generazione Modello 3D con Skill CAD</h3>
            <p className="text-xs text-[#ff6600] font-mono font-medium">
              {loadingStepsText[loadingStep]}
            </p>
          </div>

          {/* Stepper di compilazione visiva */}
          <div className="max-w-md mx-auto grid grid-cols-4 gap-2 pt-2">
            {loadingStepsText.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i <= loadingStep ? 'bg-[#ff6600] shadow-[0_0_8px_#ff6600]' : 'bg-[#181820]'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* STATO: ERROR */}
      {state === 'error' && (
        <div className="p-6 rounded-2xl bg-[#1a0e0e] border border-red-500/40 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <h4 className="text-sm font-bold text-white">Impossibile completare la generazione</h4>
          <p className="text-xs text-zinc-400">{errorMessage}</p>
          <button
            onClick={() => setState('idle')}
            className="px-4 py-2 rounded-xl bg-[#221414] hover:bg-[#2e1a1a] text-xs font-semibold text-zinc-200 border border-red-500/30 transition"
          >
            Riprova con un altro prompt
          </button>
        </div>
      )}

      {/* STATO: SUCCESS (Anteprima 3D WebGL Three.js + Call to Action Bacheca) */}
      {state === 'success' && generatedModel && (
        <div className="grid lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Visualizzatore 3D Three.js (7 Colonne) */}
          <div className="lg:col-span-7 rounded-2xl bg-[#09090c] border border-[#1e1e24] overflow-hidden flex flex-col relative group min-h-[420px]">
            {/* Toolbar HUD Superiore */}
            <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
              <div className="px-3 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-[#22222a] text-[11px] font-mono text-zinc-300 flex items-center gap-1.5 pointer-events-auto">
                <Box className="w-3.5 h-3.5 text-[#ff6600]" />
                <span className="font-semibold text-white">{generatedModel.filename}</span>
              </div>

              <div className="flex items-center gap-1 pointer-events-auto">
                <button
                  onClick={handleDownloadStl}
                  className="px-2.5 py-1 rounded-lg bg-black/80 hover:bg-[#181820] backdrop-blur-md border border-[#22222a] text-[10px] font-mono text-zinc-300 hover:text-[#ff6600] flex items-center gap-1 transition"
                  title="Scarica file STL"
                >
                  <Download className="w-3 h-3" />
                  <span>Scarica STL</span>
                </button>
              </div>
            </div>

            {/* Contenitore WebGL Three.js */}
            <div ref={canvasRef} className="w-full flex-1 cursor-grab active:cursor-grabbing min-h-[380px]" />

            {/* Istruzioni Interazione Viewer */}
            <div className="p-2.5 bg-[#0e0e12] border-t border-[#18181c] flex items-center justify-between text-[10px] font-mono text-zinc-500">
              <span>Trascina per ruotare • Rotella per zoom</span>
              <span className="text-[#ff6600]">STL Watertight • Validato ISO 2768-m</span>
            </div>
          </div>

          {/* Dettagli Tecnici & Call to Action (5 Colonne) */}
          <div className="lg:col-span-5 rounded-2xl bg-[#09090c] border border-[#1e1e24] p-6 flex flex-col justify-between space-y-6">
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold text-[#ff6600] bg-[#ff6600]/10 border border-[#ff6600]/30">
                  Modello Generato
                </span>
                <span className="text-[11px] font-mono text-zinc-500">ID: {generatedModel.id}</span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">{generatedModel.name}</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Solido matematico compilato direttamente dal prompt tramite il kernel della <strong>skill cad</strong>.
                </p>
              </div>

              {/* Specifiche Tecniche Estratte */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-[#0e0e12] border border-[#1a1a20]">
                  <span className="text-[10px] font-mono text-zinc-500 block uppercase">Dimensioni XYZ</span>
                  <span className="text-xs font-mono font-semibold text-white">{generatedModel.dimensions}</span>
                </div>

                <div className="p-3 rounded-xl bg-[#0e0e12] border border-[#1a1a20]">
                  <span className="text-[10px] font-mono text-zinc-500 block uppercase">Volume Solido</span>
                  <span className="text-xs font-mono font-semibold text-[#ff6600]">{generatedModel.volumeCm3} cm³</span>
                </div>

                <div className="p-3 rounded-xl bg-[#0e0e12] border border-[#1a1a20]">
                  <span className="text-[10px] font-mono text-zinc-500 block uppercase">Massa Stimata</span>
                  <span className="text-xs font-mono font-semibold text-white">{generatedModel.weightGrams} g</span>
                </div>

                <div className="p-3 rounded-xl bg-[#0e0e12] border border-[#1a1a20]">
                  <span className="text-[10px] font-mono text-zinc-500 block uppercase">Materiale Consigliato</span>
                  <span className="text-xs font-mono font-semibold text-white">{generatedModel.recommendedMaterial}</span>
                </div>
              </div>

              {/* Preventivo e Tempo Stimato */}
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#121218] to-[#0c0c10] border border-[#ff6600]/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-zinc-400 block">Stima Costo di Stampa</span>
                  <span className="text-lg font-mono font-extrabold text-white">€ {generatedModel.estimatedCostEur.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-zinc-400 block">Tempo Macchina</span>
                  <span className="text-xs font-mono text-[#ff8833] font-semibold">~{generatedModel.estimatedPrintTimeHours}h</span>
                </div>
              </div>
            </div>

            {/* CALL TO ACTION PRINCIPALE: Pubblica questa richiesta */}
            <div className="space-y-2 pt-2 border-t border-[#18181c]">
              <button
                onClick={handlePublishClick}
                className="w-full py-3.5 px-4 rounded-xl bg-[#ff6600] hover:bg-[#ff7700] text-black font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-[0_0_24px_rgba(255,102,0,0.4)]"
              >
                <Send className="w-4 h-4" />
                <span>Pubblica questa richiesta nella Bacheca</span>
              </button>

              <button
                onClick={() => {
                  setState('idle');
                  setPrompt('');
                }}
                className="w-full py-2 px-3 rounded-xl text-xs text-zinc-400 hover:text-white transition text-center"
              >
                Modifica prompt o genera un altro pezzo
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
