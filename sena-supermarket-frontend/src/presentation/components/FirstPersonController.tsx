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
  const { camera, gl } = useThree();
  const moveState = useRef({ forward: false, backward: false, left: false, right: false });
  const rotationRef = useRef({ yaw: 0, pitch: 0 });

  useEffect(() => {
    const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
    rotationRef.current.yaw = euler.y;
    rotationRef.current.pitch = euler.x;

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
    // Si estamos en sesión VR (Oculus Rift S), dejamos que WebXR gestione la posición y rotación del HMD
    if (gl.xr.isPresenting) return;

    const speed = 10 * delta;
    const lookSpeed = 2.0 * delta; 
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
        
        // Ejes estándar del stick derecho en controles de Xbox (2 = X, 3 = Y)
        const rawLookX = gp.axes[2]; 
        const rawLookY = gp.axes[3] !== undefined ? gp.axes[3] : gp.axes[5];

        if (Math.abs(leftStickX) > DEADZONE) gamepadX = leftStickX;
        if (Math.abs(leftStickY) > DEADZONE) gamepadZ = leftStickY;

        if (rawLookX !== undefined && Math.abs(rawLookX) > DEADZONE) gamepadLookX = rawLookX;
        if (rawLookY !== undefined && Math.abs(rawLookY) > DEADZONE) gamepadLookY = rawLookY;

        break;
      }
    }

    // Sincronizamos con la rotación actual por si el usuario movió el mouse con PointerLockControls
    const currentEuler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
    rotationRef.current.yaw = currentEuler.y;
    rotationRef.current.pitch = currentEuler.x;

    // Si se usa el stick derecho del control de Xbox, aplicamos el movimiento estilo Minecraft de forma limpia
    if (gamepadLookX !== 0 || gamepadLookY !== 0) {
      rotationRef.current.yaw -= gamepadLookX * lookSpeed;   // Derecha/Izquierda del stick R
      rotationRef.current.pitch -= gamepadLookY * lookSpeed; // Arriba/Abajo del stick R

      const maxPitch = Math.PI / 2.0 - 0.05;
      rotationRef.current.pitch = Math.max(-maxPitch, Math.min(maxPitch, rotationRef.current.pitch));

      const targetEuler = new THREE.Euler(rotationRef.current.pitch, rotationRef.current.yaw, 0, 'YXZ');
      camera.quaternion.setFromEuler(targetEuler);
    }

    // ===================================================
    //  MOVIMIENTO DE TRASLACIÓN (Teclado + Stick Izquierdo)
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

  // Devolvemos PointerLockControls para que el mouse vuelva a funcionar al hacer clic en la pantalla
  return <PointerLockControls />;
};