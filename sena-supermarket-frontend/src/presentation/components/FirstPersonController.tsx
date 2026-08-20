import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';

// Cajas de colisión AABB ajustadas a las fachadas de cristal externas
const BUILDING_BOXES = [
  // Supermercado SENA
  { minX: -23, maxX: -9, minZ: -15, maxZ: 15 },

  // Tienda ADXO
  { minX: -2.5, maxX: 5.5, minZ: 42, maxZ: 54 },

  // ACERA IZQUIERDA (Fachadas bloqueadas en X = -8.5 para no entrar al Café)
  { minX: -22.5, maxX: -8.5, minZ: -74, maxZ: -60 }, // Edificio 3
  { minX: -22.5, maxX: -8.5, minZ: -52, maxZ: -38 }, // Café (tienda_3)
  { minX: -22.5, maxX: -8.5, minZ: -38, maxZ: -28 }, // Caricaturesco
  { minX: -22.5, maxX: -8.5, minZ: -28, maxZ: -16 }, // Edificio 3
  { minX: -22.5, maxX: -8.5, minZ: 16, maxZ: 31 },  // Edificio 3
  { minX: -22.5, maxX: -8.5, minZ: 31, maxZ: 43 },  // Caricaturesco
  { minX: -22.5, maxX: -8.5, minZ: 43, maxZ: 55 },  // Edificio 3
  { minX: -22.5, maxX: -8.5, minZ: 55, maxZ: 68 },  // Caricaturesco
  { minX: -22.5, maxX: -6.5, minZ: 74, maxZ: 89 },  // Abandonado

  // ACERA DERECHA (Fachadas bloqueadas en X = +8.5)
  { minX: 8.5, maxX: 25.5, minZ: -67, maxZ: -53 }, // Edificio 3
  { minX: 8.5, maxX: 25.5, minZ: -52, maxZ: -39 }, // Caricaturesco
  { minX: 8.5, maxX: 25.5, minZ: -38, maxZ: -22 }, // Edificio 3
  { minX: 8.5, maxX: 25.5, minZ: -21, maxZ: -8 },  // Caricaturesco
  { minX: 8.5, maxX: 25.5, minZ: -8, maxZ: 7 },    // Edificio 3
  { minX: 8.5, maxX: 25.5, minZ: 4, maxZ: 16 },    // Caricaturesco
  { minX: 8.5, maxX: 25.5, minZ: 16, maxZ: 29 },   // Edificio 3
  { minX: 8.5, maxX: 25.5, minZ: 29, maxZ: 41 },   // Caricaturesco
  { minX: 8.5, maxX: 25.5, minZ: 41, maxZ: 55 },   // Edificio 3
];

function isPositionBlocked(x: number, z: number): boolean {
  // Muros de límite del mapa
  if (x <= -22.5 || x >= 25.5) return true;
  if (z <= -78 || z >= 88) return true;

  // Verificación de colisión contra edificaciones
  for (const box of BUILDING_BOXES) {
    if (x >= box.minX && x <= box.maxX && z >= box.minZ && z <= box.maxZ) {
      return true;
    }
  }

  return false;
}

export const FirstPersonController: React.FC = () => {
  const { camera } = useThree();
  const moveState = useRef({ forward: false, backward: false, left: false, right: false });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') moveState.current.forward = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') moveState.current.backward = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') moveState.current.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') moveState.current.right = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') moveState.current.forward = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') moveState.current.backward = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') moveState.current.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') moveState.current.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((_, delta) => {
    const speed = 10 * delta;
    const frontVector = new THREE.Vector3(
      0,
      0,
      (moveState.current.backward ? 1 : 0) - (moveState.current.forward ? 1 : 0)
    );
    const sideVector = new THREE.Vector3(
      (moveState.current.left ? 1 : 0) - (moveState.current.right ? 1 : 0),
      0,
      0
    );

    const direction = new THREE.Vector3()
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(speed)
      .applyEuler(camera.rotation);

    const nextX = camera.position.x + direction.x;
    const nextZ = camera.position.z + direction.z;

    if (!isPositionBlocked(nextX, camera.position.z)) {
      camera.position.x = nextX;
    }
    if (!isPositionBlocked(camera.position.x, nextZ)) {
      camera.position.z = nextZ;
    }

    camera.position.y = 1.6;
  });

  return <PointerLockControls />;
};