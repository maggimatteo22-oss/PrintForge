'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Center } from '@react-three/drei';
import * as THREE from 'three';
import { STLLoader } from 'three-stdlib';
import { BoundingBoxCage } from './BoundingBoxCage';
import { createFdmMaterial } from './fdmShader';
import { 
  Layers, 
  Maximize2, 
  RotateCcw, 
  Upload, 
  Sparkles, 
  Sliders, 
  FileCheck,
  Palette
} from 'lucide-react';

interface ModelInfo {
  name: string;
  triangleCount: number;
  originalDimensions: { x: number; y: number; z: number };
  volumeCm3: number;
}

export const ThreeViewer: React.FC = () => {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [scale, setScale] = useState<number>(1.0); // 50% to 200% (0.5 to 2.0)
  const [isFdmPreview, setIsFdmPreview] = useState<boolean>(false);
  const [filamentColor, setFilamentColor] = useState<string>('#38bdf8');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showBoundingBox, setShowBoundingBox] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate procedural sample 3D mechanical component as default model
  useEffect(() => {
    // Create an engineering bracket geometry as instant demo
    const shape = new THREE.Shape();
    shape.moveTo(-25, -25);
    shape.lineTo(25, -25);
    shape.lineTo(25, 25);
    shape.lineTo(10, 25);
    shape.lineTo(10, 5);
    shape.lineTo(-25, 5);
    shape.closePath();

    // Add mounting hole
    const holePath = new THREE.Path();
    holePath.absarc(0, -10, 7, 0, Math.PI * 2, true);
    shape.holes.push(holePath);

    const extrudeSettings = {
      steps: 2,
      depth: 35,
      bevelEnabled: true,
      bevelThickness: 2,
      bevelSize: 2,
      bevelSegments: 3,
    };

    const demoGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    demoGeometry.center();
    demoGeometry.computeVertexNormals();
    demoGeometry.computeBoundingBox();

    const box = demoGeometry.boundingBox || new THREE.Box3();
    const size = new THREE.Vector3();
    box.getSize(size);

    setGeometry(demoGeometry);
    setModelInfo({
      name: 'staffa_angolare_supporto.stl (Demo)',
      triangleCount: demoGeometry.attributes.position.count / 3,
      originalDimensions: { x: size.x, y: size.y, z: size.z },
      volumeCm3: 42.8,
    });
  }, []);

  // Material selection based on FDM preview toggle
  const material = useMemo(() => {
    if (isFdmPreview) {
      return createFdmMaterial(filamentColor, 0.4); // 0.4mm layer simulation
    }
    return new THREE.MeshStandardMaterial({
      color: filamentColor,
      roughness: 0.35,
      metalness: 0.1,
    });
  }, [isFdmPreview, filamentColor]);

  // Load and parse uploaded file (STL or OBJ)
  const processFile = (file: File) => {
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const loader = new STLLoader();
        const loadedGeometry = loader.parse(buffer);
        loadedGeometry.center();
        loadedGeometry.computeVertexNormals();
        loadedGeometry.computeBoundingBox();

        const box = loadedGeometry.boundingBox || new THREE.Box3();
        const size = new THREE.Vector3();
        box.getSize(size);

        // Calculate approximate volume (bounding box * average solid factor ~ 0.45)
        const approxVolume = (size.x * size.y * size.z * 0.45) / 1000;

        setGeometry(loadedGeometry);
        setModelInfo({
          name: file.name,
          triangleCount: loadedGeometry.attributes.position.count / 3,
          originalDimensions: { x: size.x, y: size.y, z: size.z },
          volumeCm3: Math.max(1, parseFloat(approxVolume.toFixed(2))),
        });
        setScale(1.0);
      } catch (err) {
        console.error('Error parsing 3D file:', err);
        alert('Formato file non supportato o corrotto. Carica un file STL valido.');
      } finally {
        setIsLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="relative w-full h-[650px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              Visualizzatore 3D & Configuratore
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                R3F + WebGL
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              {modelInfo ? modelInfo.name : 'Nessun file selezionato'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* FDM Layer Shader Toggle */}
          <button
            onClick={() => setIsFdmPreview(!isFdmPreview)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all shadow-sm ${
              isFdmPreview
                ? 'bg-amber-500 text-slate-950 font-bold ring-2 ring-amber-400/50 shadow-amber-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title="Simula l'effetto della superficie a strati orizzontali di stampa FDM"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isFdmPreview ? 'Preview FDM Attiva' : 'Preview FDM'}
          </button>

          {/* Bounding Box Toggle */}
          <button
            onClick={() => setShowBoundingBox(!showBoundingBox)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              showBoundingBox
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Bounding Box
          </button>

          {/* Reset Scale */}
          <button
            onClick={() => setScale(1.0)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
            title="Ripristina Scala 100%"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            Carica .STL / .STEP
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".stl,.step,.stp,.obj"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* 3D Canvas Viewport with Drag-and-Drop Dropzone */}
      <div
        className="flex-1 w-full relative"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="absolute inset-0 z-30 bg-emerald-500/20 backdrop-blur-sm border-2 border-dashed border-emerald-400 flex flex-col items-center justify-center pointer-events-none">
            <Upload className="w-12 h-12 text-emerald-300 animate-bounce mb-3" />
            <p className="text-lg font-semibold text-white">Rilascia qui il file .STL o .STEP</p>
            <p className="text-xs text-emerald-200 mt-1">Caricamento e analisi volumetrica istantanea</p>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm text-slate-300">Elaborazione mesh 3D in corso...</p>
          </div>
        )}

        <Canvas
          camera={{ position: [80, 70, 90], fov: 45 }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          <ambientLight intensity={0.65} />
          <directionalLight position={[100, 150, 100]} intensity={1.2} castShadow />
          <directionalLight position={[-100, 80, -100]} intensity={0.4} />

          {/* Infinite Ground Grid Plane */}
          <Grid
            renderOrder={-1}
            position={[0, -0.01, 0]}
            infiniteGrid
            cellSize={10}
            cellThickness={0.6}
            cellColor="#334155"
            sectionSize={50}
            sectionThickness={1.2}
            sectionColor="#64748b"
            fadeDistance={250}
          />

          <Center top>
            {geometry && (
              <group scale={[scale, scale, scale]}>
                <mesh geometry={geometry} material={material} castShadow receiveShadow />
              </group>
            )}
          </Center>

          {/* Dynamic Bounding Box Cage with Millimeters quote */}
          {showBoundingBox && <BoundingBoxCage geometry={geometry} scale={scale} />}

          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={0.05}
            minDistance={20}
            maxDistance={400}
            maxPolarAngle={Math.PI / 2 + 0.05}
          />
        </Canvas>
      </div>

      {/* Floating Bottom Control Panel */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-xl">
        {/* Scale Slider (50% to 200%) */}
        <div className="flex items-center space-x-4 min-w-[280px]">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Scala:</span>
            <span className="font-mono text-emerald-400 font-bold w-12">
              {Math.round(scale * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.05"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="w-44 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <span className="text-[10px] text-slate-400 font-mono">50% - 200%</span>
        </div>

        {/* Color Palette Selector */}
        <div className="flex items-center space-x-2">
          <Palette className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400">Filamento:</span>
          {[
            { color: '#38bdf8', label: 'Cyan' },
            { color: '#22c55e', label: 'Verde' },
            { color: '#f59e0b', label: 'Ambra' },
            { color: '#ef4444', label: 'Rosso' },
            { color: '#e2e8f0', label: 'Bianco' },
            { color: '#1e293b', label: 'Nero' },
          ].map((c) => (
            <button
              key={c.color}
              onClick={() => setFilamentColor(c.color)}
              className={`w-5 h-5 rounded-full border-2 transition ${
                filamentColor === c.color ? 'border-white scale-110 shadow' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
              style={{ backgroundColor: c.color }}
              title={c.label}
            />
          ))}
        </div>

        {/* Model Metrics */}
        {modelInfo && (
          <div className="flex items-center space-x-4 text-xs font-mono text-slate-300 border-l border-slate-800 pl-4">
            <div>
              <span className="text-slate-500">Volume:</span>{' '}
              <span className="text-white font-semibold">
                {(modelInfo.volumeCm3 * Math.pow(scale, 3)).toFixed(1)} cm³
              </span>
            </div>
            <div>
              <span className="text-slate-500">Triangoli:</span>{' '}
              <span className="text-slate-300">{modelInfo.triangleCount.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
