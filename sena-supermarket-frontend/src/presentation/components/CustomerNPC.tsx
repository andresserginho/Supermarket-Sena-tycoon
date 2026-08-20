// src/presentation/components/CustomerNPC.tsx
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CustomerNPCProps {
  state?: 'entering' | 'shopping' | 'queuing' | 'leaving';
}

export const CustomerNPC: React.FC<CustomerNPCProps> = ({ state = 'shopping' }) => {
  const npcRef = useRef<THREE.Group>(null);

  // Movimiento simulado del cliente según su estado actual en la tienda
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    if (npcRef.current && state === 'shopping') {
      npcRef.current.position.x = Math.sin(time * 0.5) * 3;
    }
  });

  return (
    <group ref={npcRef} position={[0, 1, 0]}>
      {/* Cuerpo optimizado del cliente NPC, preparado para GLB PBR y animaciones de Mixamo */}
      <mesh castShadow>
        <capsuleGeometry args={[0.3, 1.2, 4, 8]} />
        <meshStandardMaterial color="#2563eb" roughness={0.5} />
      </mesh>
    </group>
  );
};