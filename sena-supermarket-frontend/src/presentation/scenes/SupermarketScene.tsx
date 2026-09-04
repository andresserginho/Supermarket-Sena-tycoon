import React, { useEffect, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { SupermarketEnvironment } from '../components/SupermarketEnvironment';
import { FirstPersonController } from '../components/FirstPersonController';
import { Crosshair } from '../components/Crosshair';
import { PhoneUI } from '../components/PhoneUI';
import { HeldPhone3D } from '../components/HeldPhone3D';
import { CashRegisterCounter } from '../components/CashRegisterCounter';
import { DayNightCycle } from '../components/DayNightCycle';
import { StreetLights } from '../components/StreetLights';
import { DeliveryBoxes } from '../components/DeliveryBox';
import { useSimulationStore } from '../../application/store/useSimulationStore';
import { usePhoneStore } from '../../application/store/usePhoneStore';

export const SupermarketScene: React.FC = () => {
  const [hitDamage, setHitDamage] = useState<number | null>(null);
  const hitTimeoutRef = useRef<number | null>(null);

  // Control de apertura (M) y cierre (N) exclusivo por teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (e.target as HTMLElement)?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

      const key = e.key.toLowerCase();
      if (key === 'm') {
        usePhoneStore.setState({ isOpen: true });
      } else if (key === 'n') {
        usePhoneStore.setState({ isOpen: false });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Procesamiento de colisión con vehículos (solo descuenta salud)
  const handlePlayerHit = (damage: number) => {
    const currentHealth = useSimulationStore.getState().playerState.health;
    const newHealth = Math.max(0, currentHealth - damage);

    useSimulationStore.setState({
      playerState: {
        ...useSimulationStore.getState().playerState,
        health: newHealth,
      },
    });

    setHitDamage(damage);

    if (hitTimeoutRef.current) window.clearTimeout(hitTimeoutRef.current);
    hitTimeoutRef.current = window.setTimeout(() => setHitDamage(null), 1000);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Canvas shadows camera={{ position: [0, 1.6, 5], fov: 75 }}>
        <DayNightCycle />
        <StreetLights />
        <SupermarketEnvironment onPlayerHit={handlePlayerHit} />
        <FirstPersonController />
        <HeldPhone3D />
        <CashRegisterCounter position={[-16, 0, 5]} />

        {/* Renderizador de Cajas de Pedidos dentro del entorno 3D */}
        <DeliveryBoxes />
      </Canvas>

      <Crosshair />
      <PhoneUI />

      {/* Notificación de daño visual temporal */}
      {hitDamage !== null && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(239, 68, 68, 0.9)',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '8px',
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        >
          ¡CUIDADO! -{hitDamage} PV
        </div>
      )}
    </div>
  );
};