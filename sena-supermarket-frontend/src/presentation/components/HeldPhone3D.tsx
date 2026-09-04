// src/presentation/components/HeldPhone3D.tsx


//**********PUEDO BORRARLO NO PASA NADA**********//
//En SupermarketScene.tsx, elimina la línea <HeldPhone3D/>//

import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { usePhoneStore } from '../../application/store/usePhoneStore';

export const HeldPhone3D: React.FC = () => {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const isOpen = usePhoneStore((s) => s.isOpen);

  useFrame(() => {
    if (!groupRef.current || !isOpen) return;

    // Sincronización fina con el campo de visión de la cámara
    const targetPos = camera.position.clone();
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);

    // Ajuste compacto: a la derecha abajo
    targetPos.addScaledVector(right, 0.14);
    targetPos.addScaledVector(up, -0.12);
    targetPos.addScaledVector(forward, 0.28);

    groupRef.current.position.copy(targetPos);
    groupRef.current.quaternion.copy(camera.quaternion);
    
    // Inclinación natural en la mano
    groupRef.current.rotateX(-0.15);
    groupRef.current.rotateY(-0.2);
  });

  if (!isOpen) return null;

  return (
    <group ref={groupRef}>
      {/* Carcasa trasera compacta */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.075, 0.15, 0.006]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Pantalla frontal encendida */}
      <mesh position={[0, 0, 0.0035]}>
        <planeGeometry args={[0.07, 0.142]} />
        <meshBasicMaterial color="#1e293b" />
      </mesh>

      {/* Bisel del Módulo de Cámara */}
      <mesh position={[0.02, 0.055, -0.0035]}>
        <boxGeometry args={[0.02, 0.025, 0.002]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
    </group>
  );
};