import React, { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { SupermarketEnvironment } from '../components/SupermarketEnvironment';
import { FirstPersonController } from '../components/FirstPersonController';
import { Crosshair } from '../components/Crosshair';
import { HUD } from '../components/HUD';
import { useSimulationStore } from '../../application/store/useSimulationStore';
import { recoverHealth } from '../../infrastructure/api/progressApi';

export const SupermarketScene: React.FC = () => {
  const [hitDamage, setHitDamage] = useState<number | null>(null);
  const [healthDepleted, setHealthDepleted] = useState(false);
  const [recoveringHealth, setRecoveringHealth] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const hitTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  useEffect(() => () => {
    if (hitTimeoutRef.current) window.clearTimeout(hitTimeoutRef.current);
  }, []);

  const handlePlayerHit = (damage: number) => {
    console.log(`¡Atropellado! Daño recibido: ${damage}`);
    useSimulationStore.getState().handleCarImpact(damage);
    const health = useSimulationStore.getState().playerState.health;
    if (health <= 0) setHealthDepleted(true);
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
      {healthDepleted && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0, 0, 0, 0.78)', pointerEvents: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '420px', padding: '28px', border: '1px solid rgba(248, 113, 113, 0.7)', borderRadius: '16px', background: '#020617', color: '#fff', textAlign: 'center', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)' }}>
            <h2 style={{ margin: 0, color: '#fca5a5', fontSize: '24px', fontWeight: 700 }}>VIDA AGOTADA</h2>
            <p style={{ margin: '12px 0 0', color: '#e2e8f0' }}>Debes pagar $10.000 COP para recuperar toda tu vida y continuar con tu progreso.</p>
            <button
              style={{ marginTop: '24px', padding: '12px 24px', border: 0, borderRadius: '12px', background: recoveringHealth ? '#475569' : '#059669', color: '#fff', fontWeight: 700, cursor: recoveringHealth ? 'wait' : 'pointer' }}
              disabled={recoveringHealth}
              onClick={async () => {
                const savedUser = localStorage.getItem('sena_current_user');
                if (!savedUser) return;
                if (!window.confirm('¿Pagar $10.000 COP para recuperar toda tu vida?')) return;
                setRecoveringHealth(true);
                setRecoveryError('');
                try {
                  const result = await recoverHealth(JSON.parse(savedUser).id);
                  useSimulationStore.setState({ money: result.money });
                  useSimulationStore.getState().engine.setPlayerState({ health: result.health });
                  useSimulationStore.setState({ playerState: useSimulationStore.getState().engine.getPlayerState() });
                  setHealthDepleted(false);
                } catch (error) {
                  setRecoveryError(error instanceof Error ? error.message : 'No se pudo procesar la recuperación.');
                } finally {
                  setRecoveringHealth(false);
                }
              }}
            >{recoveringHealth ? 'PROCESANDO...' : 'RECUPERAR VIDA'}</button>
            {recoveryError && <p style={{ marginTop: '12px', color: '#fca5a5', fontSize: '14px' }}>{recoveryError}</p>}
          </div>
        </div>
      )}
    </div>
  );
};