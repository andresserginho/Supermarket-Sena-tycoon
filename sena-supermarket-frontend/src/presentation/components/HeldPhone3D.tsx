// src/presentation/components/HeldPhone3D.tsx


//**********PUEDO BORRARLO NO PASA NADA**********//
//En SupermarketScene.tsx, elimina la línea <HeldPhone3D/>//

import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { usePhoneStore } from '../../application/store/usePhoneStore';
import { PhoneUI } from './PhoneUI';

export const HeldPhone3D: React.FC = () => {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const isOpen = usePhoneStore((s) => s.isOpen);

  useFrame((_, delta) => {
    if (!groupRef.current || !isOpen) return;

    // Sincronización fina con el campo de visión de la cámara
    const targetPos = camera.position.clone();
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);

    // El teléfono queda elevado y separado para que la carcasa no recorte la interfaz.
    targetPos.addScaledVector(right, 0.08);
    targetPos.addScaledVector(up, 0.02);
    targetPos.addScaledVector(forward, 0.21);

    const smoothFactor = 1 - Math.exp(-delta * 12);
    groupRef.current.position.lerp(targetPos, smoothFactor);
    const targetQuaternion = camera.quaternion.clone();
    targetQuaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.08, -0.1, 0)));
    groupRef.current.quaternion.slerp(targetQuaternion, smoothFactor);
  });

  if (!isOpen) return null;

  return (
    <group ref={groupRef}>
      {/* Carcasa trasera compacta */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.07, 0.14, 0.006]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Pantalla frontal encendida */}
      <mesh position={[0, 0, 0.0035]}>
        <planeGeometry args={[0.065, 0.13]} />
        <meshBasicMaterial color="#1e293b" />
      </mesh>

      <Html transform position={[0, 0, 0.007]} distanceFactor={0.16} zIndexRange={[1, 2]}>
        <div style={{ width: 300, height: 600, pointerEvents: 'auto', userSelect: 'none' }}>
          <PhoneUI embedded />
        </div>
      </Html>

      {/* Bisel del Módulo de Cámara */}
      <mesh position={[0.017, 0.05, -0.0035]}>
        <boxGeometry args={[0.02, 0.025, 0.002]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
    </group>
  );
};