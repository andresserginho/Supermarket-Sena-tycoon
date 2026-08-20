// src/presentation/components/PlayerNeedsHUD.tsx
import React, { useState } from 'react';

export const PlayerNeedsHUD: React.FC = () => {
  const [energy] = useState<number>(100);
  const [hunger] = useState<number>(20);

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      background: 'rgba(15, 23, 42, 0.85)',
      padding: '12px 18px',
      borderRadius: '8px',
      color: '#fff',
      fontFamily: 'sans-serif',
      fontSize: '14px',
      zIndex: 9999,
      pointerEvents: 'none'
    }}>
      <div>⚡ Energía: {energy}%</div>
      <div>🍗 Hambre: {hunger}%</div>
      <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
        Sube al segundo piso para descansar
      </div>
    </div>
  );
};