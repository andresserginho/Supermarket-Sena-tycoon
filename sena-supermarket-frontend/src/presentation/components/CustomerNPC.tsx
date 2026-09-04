// src/presentation/components/CustomerNPC.tsx
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CustomerNPCProps {
  state?: 'entering' | 'shopping' | 'queuing' | 'leaving';
}

const npcData = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  initialX: (i % 3) * 1.5 - 1.5,
  initialZ: -1.5 - Math.floor(i / 3) * 1.2,
  color: [
    '#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea', 
    '#0284c7', '#db2777', '#65a30d', '#ea580c', '#4f46e5'
  ][i],
}));

const SingleNPC: React.FC<{ initialX: number; initialZ: number; color: string }> = ({ initialX, initialZ, color }) => {
  const npcRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime() + initialX * 2;
    if (npcRef.current) {
      npcRef.current.position.x = initialX + Math.sin(time * 0.5) * 0.6;
      npcRef.current.position.z = initialZ + Math.cos(time * 0.3) * 0.4;
    }
  });

  return (
    <group ref={npcRef} position={[initialX, 0.6, initialZ]}>
      <mesh castShadow position={[0, 0.4, 0]}>
        <capsuleGeometry args={[0.2, 0.8, 4, 8]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      <mesh castShadow position={[0, 1.0, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#f5d0b1" roughness={0.6} />
      </mesh>
    </group>
  );
};

export const CustomerNPC: React.FC<CustomerNPCProps> = () => {
  return (
    <group>
      {npcData.map((npc) => (
        <SingleNPC key={npc.id} initialX={npc.initialX} initialZ={npc.initialZ} color={npc.color} />
      ))}
    </group>
  );
};

export default CustomerNPC;