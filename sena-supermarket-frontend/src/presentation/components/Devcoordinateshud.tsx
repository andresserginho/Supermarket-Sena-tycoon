import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export const DevCoordinatesHUD: React.FC = () => {
  const textRef = useRef<HTMLSpanElement>(null);

  useFrame((state) => {
    if (!textRef.current) return;
    const { x, y, z } = state.camera.position;
    textRef.current.innerText = `X: ${x.toFixed(2)} | Y: ${y.toFixed(2)} | Z: ${z.toFixed(2)}`;
  });

  return (
    <div
      style={{
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
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
      }}
    >
      📍 <b>Coordenadas Cámara / Jugador:</b>
      <br />
      <span ref={textRef}>X: 0.00 | Y: 0.00 | Z: 0.00</span>
    </div>
  );
};