// src/presentation/components/StreetLights.tsx
import React, { useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { StreetLight, type StreetLightProps } from './StreetLight';
import { calculateGameTime } from '../hooks/useGameTime';

const STREET_LIGHTS_CONFIG: Omit<StreetLightProps, 'isNight'>[] = [
  // Acera Izquierda (Lado del Supermercado / Fachadas)
  { position: [-6, 0, -50], height: 3.5, rotationY: 0 },
  { position: [-6, 0, -25], height: 3.5, rotationY: 0 },
  { position: [-6, 0, 25],  height: 3.5, rotationY: 0 },
  { position: [-6, 0, 50],  height: 3.5, rotationY: 0 },

  // Acera Derecha (Lado opuesto de la calle)
  { position: [6, 0, -50], height: 3.5, rotationY: Math.PI },
  { position: [6, 0, -25], height: 3.5, rotationY: Math.PI },
  { position: [6, 0, 25],  height: 3.5, rotationY: Math.PI },
  { position: [6, 0, 50],  height: 3.5, rotationY: Math.PI },
];

export const StreetLights: React.FC = () => {
  const [isNight, setIsNight] = useState(false);

  useFrame(({ clock }) => {
    const { cycleProgress } = calculateGameTime(clock.getElapsedTime());
    const normalizedSunY = Math.sin(cycleProgress * Math.PI * 2);
    setIsNight(normalizedSunY <= 0.1);
  });

  return (
    <group>
      {STREET_LIGHTS_CONFIG.map((config, index) => (
        <StreetLight key={`street-light-${index}`} {...config} isNight={isNight} />
      ))}
    </group>
  );
};