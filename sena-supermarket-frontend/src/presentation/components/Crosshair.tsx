// src/presentation/components/Crosshair.tsx
import React from 'react';

export const Crosshair: React.FC<{ isInteractive?: boolean }> = ({ isInteractive = false }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '16px',
      height: '16px',
      borderRadius: '50%',
      border: `2px solid ${isInteractive ? '#ff3333' : '#ff0000'}`,
      backgroundColor: '#000000',
      boxShadow: isInteractive ? '0 0 8px #ff0000' : 'none',
      zIndex: 9999,
      pointerEvents: 'none',
      transition: 'all 0.15s ease-in-out'
    }} />
  );
};