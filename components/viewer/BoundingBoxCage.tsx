'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';

interface BoundingBoxCageProps {
  geometry: THREE.BufferGeometry | null;
  scale: number; // scale multiplier e.g. 0.5 to 2.0
}

export const BoundingBoxCage: React.FC<BoundingBoxCageProps> = ({ geometry, scale }) => {
  const { size, center, boxGeometry } = useMemo(() => {
    if (!geometry) {
      return {
        size: new THREE.Vector3(50, 50, 50),
        center: new THREE.Vector3(0, 25, 0),
        boxGeometry: new THREE.BoxGeometry(50, 50, 50),
      };
    }

    geometry.computeBoundingBox();
    const box = geometry.boundingBox || new THREE.Box3();
    const originalSize = new THREE.Vector3();
    box.getSize(originalSize);

    const originalCenter = new THREE.Vector3();
    box.getCenter(originalCenter);

    // Apply scale factor
    const scaledSize = originalSize.clone().multiplyScalar(scale);
    const scaledCenter = originalCenter.clone().multiplyScalar(scale);

    return {
      size: scaledSize,
      center: scaledCenter,
      boxGeometry: new THREE.BoxGeometry(scaledSize.x, scaledSize.y, scaledSize.z),
    };
  }, [geometry, scale]);

  return (
    <group position={[center.x, center.y, center.z]}>
      {/* Translucent Cage */}
      <mesh geometry={boxGeometry}>
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.07}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Wireframe edges */}
      <lineSegments>
        <edgesGeometry args={[boxGeometry]} />
        <lineBasicMaterial color="#38bdf8" transparent opacity={0.65} linewidth={1.5} />
      </lineSegments>

      {/* Dimension Tag: X Axis (Bottom front width) */}
      <Html position={[0, -size.y / 2 - 4, size.z / 2]} center distanceFactor={15}>
        <div className="bg-slate-900/90 text-cyan-300 text-[11px] font-mono px-2 py-0.5 rounded border border-cyan-500/40 shadow-lg pointer-events-none whitespace-nowrap">
          X: {size.x.toFixed(1)} mm
        </div>
      </Html>

      {/* Dimension Tag: Y Axis (Height) */}
      <Html position={[size.x / 2 + 4, 0, size.z / 2]} center distanceFactor={15}>
        <div className="bg-slate-900/90 text-amber-300 text-[11px] font-mono px-2 py-0.5 rounded border border-amber-500/40 shadow-lg pointer-events-none whitespace-nowrap">
          Z (Alt.): {size.y.toFixed(1)} mm
        </div>
      </Html>

      {/* Dimension Tag: Z Axis (Depth) */}
      <Html position={[size.x / 2 + 4, -size.y / 2 - 4, 0]} center distanceFactor={15}>
        <div className="bg-slate-900/90 text-emerald-300 text-[11px] font-mono px-2 py-0.5 rounded border border-emerald-500/40 shadow-lg pointer-events-none whitespace-nowrap">
          Y (Prof.): {size.z.toFixed(1)} mm
        </div>
      </Html>
    </group>
  );
};
