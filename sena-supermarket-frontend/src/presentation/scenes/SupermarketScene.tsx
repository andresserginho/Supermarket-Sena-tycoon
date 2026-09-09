// src/presentation/scenes/SupermarketScene.tsx
import React, { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { SupermarketEnvironment } from '../components/SupermarketEnvironment';
import { FirstPersonController } from '../components/FirstPersonController';
import { Crosshair } from '../components/Crosshair';
import { PhoneUI } from '../components/PhoneUI';
import { HeldPhone3D } from '../components/HeldPhone3D';
import { DayNightCycle } from '../components/DayNightCycle';
import { StreetLights } from '../components/StreetLights';
import { DeliveryBoxes } from '../components/DeliveryBox';
import { FurnitureSystem } from '../components/FurnitureSystem';

import { XR, XROrigin, createXRStore } from '@react-three/xr';
import { useSimulationStore } from '../../application/store/useSimulationStore';
import { usePhoneStore } from '../../application/store/usePhoneStore';
import { advanceToNextDay, useGameTime } from '../hooks/useGameTime';

// Se crea UNA sola vez, fuera del componente, no en cada render
const xrStore = createXRStore();

export const SupermarketScene: React.FC = () => {
  const [hitDamage, setHitDamage] = useState<number | null>(null);
  const hitTimeoutRef = useRef<number | null>(null);
  const xrOriginRef = useRef<THREE.Group>(null); // se mueve en VR en vez de la cámara
  const { hours, day } = useGameTime();
  const [nightDecision, setNightDecision] = useState<'pending' | 'continue' | 'sleep' | null>(null);
  const [lastNightDay, setLastNightDay] = useState(0);

  useEffect(() => {
    if (hours >= 22 && lastNightDay !== day) {
      setLastNightDay(day);
      setNightDecision('pending');
    }
  }, [hours, day, lastNightDay]);

  useEffect(() => {
    if (nightDecision === 'pending') {
      document.exitPointerLock?.();
    }
  }, [nightDecision]);

  useEffect(() => {
    const handleNightControl = (event: KeyboardEvent) => {
      if (nightDecision !== 'pending') return;
      if (event.key === 'Enter' || event.code === 'KeyA') handleSleep();
      if (event.key === 'Escape' || event.code === 'KeyB') handleContinue();
    };

    window.addEventListener('keydown', handleNightControl);
    return () => window.removeEventListener('keydown', handleNightControl);
  }, [nightDecision]);

  useEffect(() => {
    if (nightDecision !== 'continue' || hours < 22) return;
    const timer = window.setInterval(() => {
      const state = useSimulationStore.getState();
      useSimulationStore.setState({
        playerState: { ...state.playerState, health: Math.max(0, state.playerState.health - 1) },
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [nightDecision, hours]);

  const handleSleep = () => {
    const state = useSimulationStore.getState();
    const salesPercent = Math.min(100, state.totalSalesCount * 5);
    const attentionPercent = 100;
    const actionPercent = state.playerState.health > 0 ? 100 : 30;
    const average = (salesPercent + attentionPercent + actionPercent) / 3;
    const nextLevel = average >= 60 ? state.playerState.level + 1 : state.playerState.level;

    useSimulationStore.setState({
      playerState: { ...state.playerState, health: Math.min(100, state.playerState.health + 20), level: nextLevel },
    });
    advanceToNextDay();
    setNightDecision('sleep');
  };

  const handleContinue = () => setNightDecision('continue');

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
    const state = useSimulationStore.getState() as any;
    const currentHealth = state.playerState?.health ?? 100;
    const newHealth = Math.max(0, currentHealth - damage);

    useSimulationStore.setState({
      playerState: {
        ...state.playerState,
        health: newHealth,
      },
    } as any);

    setHitDamage(damage);

    if (hitTimeoutRef.current) window.clearTimeout(hitTimeoutRef.current);
    hitTimeoutRef.current = window.setTimeout(() => setHitDamage(null), 1000);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Botón para entrar en modo VR con las Oculus — solo aparece si el navegador detecta un headset */}
      <button
        onClick={() => xrStore.enterVR()}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 1000,
          background: '#059669',
          color: '#fff',
          border: 'none',
          padding: '10px 16px',
          borderRadius: '8px',
          fontFamily: 'sans-serif',
          fontWeight: 'bold',
          cursor: 'pointer',
        }}
      >
        🥽 ENTRAR EN VR
      </button>

      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        gl={{ powerPreference: 'high-performance', antialias: true }}
        camera={{ position: [6, 1.6, 5], fov: 75 }}
      >
        <XR store={xrStore}>
          <XROrigin ref={xrOriginRef}>
            <DayNightCycle />
            <StreetLights />
            <SupermarketEnvironment onPlayerHit={handlePlayerHit} />
            <FirstPersonController xrOriginRef={xrOriginRef} />
            <HeldPhone3D />

            {/* Renderizador de Cajas de Pedidos dentro del entorno 3D */}
            <DeliveryBoxes />
            <FurnitureSystem />

          </XROrigin>
        </XR>
      </Canvas>

      <Crosshair />
      <PhoneUI />

      {nightDecision === 'pending' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 12000, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.72)' }}>
          <div style={{ width: 320, padding: 20, borderRadius: 12, background: '#0f172a', color: '#fff', textAlign: 'center', fontFamily: 'sans-serif' }}>
            <h2 style={{ margin: '0 0 8px' }}>Son las 10:00 PM</h2>
            <p style={{ color: '#cbd5e1', fontSize: 14 }}>Dormir recupera salud y comienza un nuevo día. Si sigues jugando, perderás 1 punto de salud por segundo.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSleep} style={{ flex: 1, padding: 10, background: '#16a34a', color: '#fff', border: 0, borderRadius: 6, fontWeight: 'bold' }}>Dormir</button>
              <button onClick={handleContinue} style={{ flex: 1, padding: 10, background: '#475569', color: '#fff', border: 0, borderRadius: 6, fontWeight: 'bold' }}>Seguir jugando</button>
            </div>
          </div>
        </div>
      )}

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