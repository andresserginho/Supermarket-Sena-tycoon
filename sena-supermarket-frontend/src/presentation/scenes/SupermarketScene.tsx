import React, { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { SupermarketEnvironment } from '../components/SupermarketEnvironment';
import { FirstPersonController } from '../components/FirstPersonController';
import { Crosshair } from '../components/Crosshair';
import { HUD } from '../components/HUD';
import { useSimulationStore } from '../../application/store/useSimulationStore';

export const SupermarketScene: React.FC = () => {
  const [hitDamage, setHitDamage] = useState<number | null>(null);
  const hitTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  useEffect(() => () => {
    if (hitTimeoutRef.current) window.clearTimeout(hitTimeoutRef.current);
  }, []);

  const handlePlayerHit = (damage: number) => {
    console.log(`¡Atropellado! Daño recibido: ${damage}`);
    useSimulationStore.getState().handleCarImpact(damage);
    setHitDamage(damage);
    if (hitTimeoutRef.current) window.clearTimeout(hitTimeoutRef.current);
    hitTimeoutRef.current = window.setTimeout(() => {
      setHitDamage(null);
      hitTimeoutRef.current = null;
    }, 3000);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#38bdf8' }}>
      <Canvas camera={{ position: [0, 1.7, 6], fov: 65 }}>
        {/* Iluminación Diurna */}
        <ambientLight intensity={1.0} />
        <directionalLight position={[15, 25, 15]} intensity={1.5} castShadow />

        {/* Entorno 3D del supermercado */}
        <SupermarketEnvironment onPlayerHit={handlePlayerHit} />

        {/* Control del jugador en primera persona */}
        <FirstPersonController />
      </Canvas>

      {/* Interfaz de usuario (HUD) y mira central */}
      <HUD />
      <Crosshair />
      {hitDamage !== null && (
        <div style={{
          position: 'fixed',
          bottom: '76px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '12px 20px',
          border: '1px solid rgba(248, 113, 113, 0.7)',
          borderRadius: '8px',
          color: '#fecaca',
          background: 'rgba(69, 10, 10, 0.9)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
          fontWeight: 700,
          fontSize: '14px',
          zIndex: 60,
          pointerEvents: 'none',
        }}>
          ¡Atropellado! -{hitDamage} de salud
        </div>
      )}
    </div>
  );
};