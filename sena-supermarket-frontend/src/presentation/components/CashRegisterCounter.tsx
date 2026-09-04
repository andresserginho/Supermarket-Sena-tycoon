// src/presentation/components/CashRegisterCounter.tsx
import React from 'react';
import { useGLTF } from '@react-three/drei';

interface CashRegisterCounterProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export const CashRegisterCounter: React.FC<CashRegisterCounterProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}) => {
  const { scene } = useGLTF('/models/mesa caja registradora.glb');

  return (
    <group position={position} rotation={rotation}>
      <primitive object={scene.clone()} />
    </group>
  );
};

useGLTF.preload('/models/mesa caja registradora.glb');