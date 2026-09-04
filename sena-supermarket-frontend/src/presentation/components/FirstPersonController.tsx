// src/presentation/components/FirstPersonController.tsx
import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { worldColliders } from '../utils/colliders';
import { usePhoneStore } from '../../application/store/usePhoneStore';

function isPositionBlocked(position: THREE.Vector3): boolean {
  if (position.x <= -22.5 || position.x >= 25.5) return true;
  if (position.z <= -78 || position.z >= 88) return true;

  const playerBox = new THREE.Box3(
    new THREE.Vector3(position.x - 0.3, position.y - 1.6, position.z - 0.3),
    new THREE.Vector3(position.x + 0.3, position.y + 0.4, position.z + 0.3)
  );

  for (const collider of worldColliders) {
    if (playerBox.intersectsBox(collider)) {
      return true;
    }
  }
  return false;
}

export const FirstPersonController: React.FC = () => {
  const { camera, gl } = useThree();
  const moveState = useRef({ forward: false, backward: false, left: false, right: false });
  const rotationRef = useRef({ yaw: 0, pitch: 0 });
  const controlsRef = useRef<any>(null);
  const isPhoneOpen = usePhoneStore((s) => s.isOpen);

  // Desbloquea el cursor del ratón cuando el celular está abierto para permitir clics
  useEffect(() => {
    if (isPhoneOpen && controlsRef.current) {
      controlsRef.current.unlock();
    }
  }, [isPhoneOpen]);

  useEffect(() => {
    camera.position.set(0, 1.6, 5);

    const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
    rotationRef.current.yaw = euler.y;
    rotationRef.current.pitch = euler.x;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Si se está escribiendo en una caja de texto del celular, no mover al personaje
      const targetTag = (e.target as HTMLElement)?.tagName;
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA') return;

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

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [camera]);

  useFrame((_, delta) => {
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
        const rawLookX = gp.axes[2]; 
        const rawLookY = gp.axes[3] !== undefined ? gp.axes[3] : gp.axes[5];

        if (Math.abs(leftStickX) > DEADZONE) gamepadX = leftStickX;
        if (Math.abs(leftStickY) > DEADZONE) gamepadZ = leftStickY;
        if (rawLookX !== undefined && Math.abs(rawLookX) > DEADZONE) gamepadLookX = rawLookX;
        if (rawLookY !== undefined && Math.abs(rawLookY) > DEADZONE) gamepadLookY = rawLookY;
        break;
      }
    }

    const currentEuler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
    rotationRef.current.yaw = currentEuler.y;
    rotationRef.current.pitch = currentEuler.x;

    if (gamepadLookX !== 0 || gamepadLookY !== 0) {
      rotationRef.current.yaw -= gamepadLookX * lookSpeed;
      rotationRef.current.pitch -= gamepadLookY * lookSpeed;

      const maxPitch = Math.PI / 2.0 - 0.05;
      rotationRef.current.pitch = Math.max(-maxPitch, Math.min(maxPitch, rotationRef.current.pitch));

      const targetEuler = new THREE.Euler(rotationRef.current.pitch, rotationRef.current.yaw, 0, 'YXZ');
      camera.quaternion.setFromEuler(targetEuler);
    }

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

    const nextPos = camera.position.clone();
    nextPos.x += direction.x;
    if (!isPositionBlocked(nextPos)) {
      camera.position.x = nextPos.x;
    }

    const nextPosZ = camera.position.clone();
    nextPosZ.z += direction.z;
    if (!isPositionBlocked(nextPosZ)) {
      camera.position.z = nextPosZ.z;
    }

    camera.position.y = 1.6;
  });

  return <PointerLockControls ref={controlsRef} />;
};