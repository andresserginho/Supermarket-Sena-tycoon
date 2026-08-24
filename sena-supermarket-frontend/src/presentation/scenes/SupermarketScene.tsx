import React from 'react';
import { Canvas } from '@react-three/fiber';
import { SupermarketEnvironment } from '../components/SupermarketEnvironment';
import { FirstPersonController } from '../components/FirstPersonController';
import { Crosshair } from '../components/Crosshair';
import { HUD } from '../components/HUD';
import { useSimulationStore } from '../../application/store/useSimulationStore';

export const SupermarketScene: React.FC = () => {
  const handlePlayerHit = (damage: number) => {
    console.log(`¡Atropellado! Daño recibido: ${damage}`);
    useSimulationStore.getState().handleCarImpact(damage);
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
    </div>
  );
};