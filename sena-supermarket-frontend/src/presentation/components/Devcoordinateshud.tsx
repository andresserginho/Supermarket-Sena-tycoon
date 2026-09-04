// src/presentation/components/DevCoordinatesHUD.tsx
import React, { useState } from 'react';
import { useFrame } from '@react-three/fiber';

export const DevCoordinatesHUD: React.FC = () => {
  const [pos, setPos] = useState({ x: 0, y: 0, z: 0 });

  useFrame((state) => {
    const { x, y, z } = state.camera.position;
    setPos({ 
      x: Number(x.toFixed(2)), 
      y: Number(y.toFixed(2)), 
      z: Number(z.toFixed(2)) 
    });
  });

  return (
    <div style={{
      position: 'fixed',
      top: '12px',
      left: '12px',
      background: 'rgba(15, 23, 42, 0.9)',
      color: '#38bdf8',
      padding: '10px 14px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '13px',
      zIndex: 9999,
      pointerEvents: 'none',
      border: '1px solid #0284c7',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
    }}>
      📍 <b>Coordenadas Cámara / Jugador:</b><br />
      X: {pos.x} | Y: {pos.y} | Z: {pos.z}
    </div>
  );
};