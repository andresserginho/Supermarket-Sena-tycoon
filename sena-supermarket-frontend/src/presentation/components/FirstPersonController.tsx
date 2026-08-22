import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';

const BUILDING_BOXES = [
  { minX: -2.5, maxX: 5.5, minZ: 42, maxZ: 54 },
  { minX: -22.5, maxX: -8.5, minZ: -74, maxZ: -60 },
  { minX: -22.5, maxX: -8.5, minZ: -52, maxZ: -38 },
  { minX: -22.5, maxX: -8.5, minZ: -38, maxZ: -28 },
  { minX: -22.5, maxX: -8.5, minZ: -28, maxZ: -16 },
  { minX: -22.5, maxX: -8.5, minZ: 16, maxZ: 31 },
  { minX: -22.5, maxX: -8.5, minZ: 31, maxZ: 43 },
  { minX: -22.5, maxX: -8.5, minZ: 43, maxZ: 55 },
  { minX: -22.5, maxX: -8.5, minZ: 55, maxZ: 68 },
  { minX: -22.5, maxX: -6.5, minZ: 74, maxZ: 89 },
  { minX: 8.5, maxX: 25.5, minZ: -67, maxZ: -53 },
  { minX: 8.5, maxX: 25.5, minZ: -52, maxZ: -39 },
  { minX: 8.5, maxX: 25.5, minZ: -38, maxZ: -22 },
  { minX: 8.5, maxX: 25.5, minZ: -21, maxZ: -8 },
  { minX: 8.5, maxX: 25.5, minZ: -8, maxZ: 7 },
  { minX: 8.5, maxX: 25.5, minZ: 4, maxZ: 16 },
  { minX: 8.5, maxX: 25.5, minZ: 16, maxZ: 29 },
  { minX: 8.5, maxX: 25.5, minZ: 29, maxZ: 41 },
  { minX: 8.5, maxX: 25.5, minZ: 41, maxZ: 55 },
];

function isPositionBlocked(x: number, z: number): boolean {
  if (x <= -22.5 || x >= 25.5) return true;
  if (z <= -78 || z >= 88) return true;

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
  
  // Guardamos la rotación de la cámara para que no choque con PointerLockControls
  const rotationRef = useRef({ yaw: 0, pitch: 0 });

  useEffect(() => {
    rotationRef.current.yaw = camera.rotation.y;
    rotationRef.current.pitch = camera.rotation.x;

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
  }, [camera]);

  useFrame((_, delta) => {
    const speed = 10 * delta;
    const lookSpeed = 2.5 * delta; // Sensibilidad de la cámara
    const DEADZONE = 0.15;

    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    let gamepadX = 0;
    let gamepadZ = 0;
    let gamepadLookX = 0;
    let gamepadLookY = 0;

    for (const gp of gamepads) {
      if (gp && gp.connected) {
        const leftStickX = gp.axes[0]; 
        const leftStickY = gp.axes[1]; 
        const rightStickX = gp.axes[2]; 
        const rightStickY = gp.axes[3]; 

        if (leftStickX < -DEADZONE || leftStickX > DEADZONE) gamepadX = leftStickX;
        if (leftStickY < -DEADZONE || leftStickY > DEADZONE) gamepadZ = leftStickY;

        if (rightStickX < -DEADZONE || rightStickX > DEADZONE) gamepadLookX = rightStickX;
        if (rightStickY < -DEADZONE || rightStickY > DEADZONE) gamepadLookY = rightStickY;

        break;
      }
    }

    // ===================================================
    //  ROTACIÓN SOLUCIONADA DEL STICK DERECHO (R)
    // ===================================================
    if (gamepadLookX === 0 && gamepadLookY === 0) {
      // Si el usuario usa el mouse, mantenemos sincronizadas las variables
      rotationRef.current.yaw = camera.rotation.y;
      rotationRef.current.pitch = camera.rotation.x;
    } else {
      // gamepadLookX (Eje Horizontal del Stick R) va al YAW (Mover a los lados)
      rotationRef.current.yaw -= gamepadLookX * lookSpeed;
      
      // gamepadLookY (Eje Vertical del Stick R) va al PITCH (Mirar arriba y abajo)
      rotationRef.current.pitch -= gamepadLookY * lookSpeed;

      // Límite de 90 grados para que la cabeza del personaje no gire 360 grados verticalmente
      const maxPitch = Math.PI / 2.0 - 0.05;
      rotationRef.current.pitch = Math.max(-maxPitch, Math.min(maxPitch, rotationRef.current.pitch));

      // Aplicamos la rotación con quaterniones en orden YXZ para desvincular el bloqueo
      const euler = new THREE.Euler(0, 0, 0, 'YXZ');
      euler.x = rotationRef.current.pitch;
      euler.y = rotationRef.current.yaw;
      camera.quaternion.setFromEuler(euler);
    }

    // ===================================================
    //  MOVIMIENTO DE TRASLACIÓN DEL JUGADOR
    // ===================================================
    const moveForward = (moveState.current.forward ? 1 : 0) - (moveState.current.backward ? 1 : 0) - gamepadZ;
    const moveSide = (moveState.current.right ? 1 : 0) - (moveState.current.left ? 1 : 0) + gamepadX;

    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0; 
    cameraDirection.normalize();

    const cameraSide = new THREE.Vector3();
    cameraSide.crossVectors(cameraDirection, camera.up).normalize();

    const direction = new THREE.Vector3();
    direction.addScaledVector(cameraDirection, moveForward);
    direction.addScaledVector(cameraSide, moveSide);

    direction.clampLength(0, 1).multiplyScalar(speed);

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