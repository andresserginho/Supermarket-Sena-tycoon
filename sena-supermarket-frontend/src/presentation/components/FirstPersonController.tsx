// src/presentation/components/FirstPersonController.tsx
import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import { useXRInputSourceState } from '@react-three/xr';
import * as THREE from 'three';
import { supermarketFloorColliders, worldColliders } from '../utils/colliders';
import { usePhoneStore } from '../../application/store/usePhoneStore';

function isPositionBlocked(position: THREE.Vector3): boolean {
  if (position.x <= -22.5 || position.x >= 25.5) return true;
  if (position.z <= -78 || position.z >= 88) return true;

  const playerBox = new THREE.Box3(
    new THREE.Vector3(position.x - 0.3, position.y - 1.6, position.z - 0.3),
    new THREE.Vector3(position.x + 0.3, position.y + 0.4, position.z + 0.3)
  );

  for (const collider of worldColliders) {
    if (supermarketFloorColliders.includes(collider)) continue;
    // El andén y el piso sostienen al jugador, pero no deben comportarse como paredes.
    if (collider.max.y <= 0.16) continue;
    if (playerBox.intersectsBox(collider)) {
      return true;
    }
  }
  return false;
}

// Funciones utilitarias para disparar eventos de teclado desde VR
function fireKeyPress(code: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', { code }));
}

interface FirstPersonControllerProps {
  xrOriginRef?: React.RefObject<THREE.Group | null>;
}

export const FirstPersonController: React.FC<FirstPersonControllerProps> = ({ xrOriginRef }) => {
  const { camera, gl } = useThree();
  const moveState = useRef({ forward: false, backward: false, left: false, right: false });
  const rotationRef = useRef({ yaw: 0, pitch: 0 });
  const controlsRef = useRef<any>(null);
  const isPhoneOpen = usePhoneStore((s) => s.isOpen);

  const rightController = useXRInputSourceState('controller', 'right');
  const leftController = useXRInputSourceState('controller', 'left');

  // Referencias para evitar que los botones se disparen cientos de veces por segundo
  const triggerWasPressed = useRef(false);
  const menuWasPressed = useRef(false);
  const gripWasPressed = useRef(false);
  const buttonAWasPressed = useRef(false);
  const buttonBWasPressed = useRef(false);
  
  const snapTurnCooldown = useRef(0);

  useEffect(() => {
    if (isPhoneOpen && controlsRef.current) {
      controlsRef.current.unlock();
    }
  }, [isPhoneOpen]);

  useEffect(() => {
    camera.position.set(6, 1.6, 5);
    camera.rotation.set(0, Math.PI / 2, 0);

    const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
    rotationRef.current.yaw = euler.y;
    rotationRef.current.pitch = euler.x;

    const handleKeyDown = (e: KeyboardEvent) => {
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

  // ===================================================
  //  LÓGICA EXCLUSIVA DE VR
  // ===================================================
  function handleVRFrame(delta: number) {
    const speed = 2.2 * delta;
    
    // 1. Gatillo (Interacción Principal - Tecla E)
    const trigger = rightController?.gamepad?.['xr-standard-trigger'] ?? leftController?.gamepad?.['xr-standard-trigger'];
    const triggerPressed = trigger?.state === 'pressed';
    if (triggerPressed && !triggerWasPressed.current) fireKeyPress('KeyE');
    triggerWasPressed.current = triggerPressed;

    // 2. Menú (Abrir Celular)
    const menuButton = leftController?.gamepad?.['x-button']; 
    const menuPressed = menuButton?.state === 'pressed';
    if (menuPressed && !menuWasPressed.current) {
      usePhoneStore.setState((s) => ({ isOpen: !s.isOpen }));
    }
    menuWasPressed.current = menuPressed;

    // 3. Grip (Sujetar Cajas - Asignamos tecla 'G' temporalmente para cuando conectes la lógica)
    const grip = rightController?.gamepad?.['xr-standard-squeeze'] ?? leftController?.gamepad?.['xr-standard-squeeze'];
    const gripPressed = grip?.state === 'pressed';
    if (gripPressed && !gripWasPressed.current) fireKeyPress('KeyG'); // <-- Listo para tu sistema de cajas
    gripWasPressed.current = gripPressed;

    // 4. Botones A/X (Confirmar) y B/Y (Cancelar)
    const buttonA = rightController?.gamepad?.['a-button'];
    const buttonAPressed = buttonA?.state === 'pressed';
    if (buttonAPressed && !buttonAWasPressed.current) fireKeyPress('Enter'); // Confirmar diálogo
    buttonAWasPressed.current = buttonAPressed;

    const buttonB = rightController?.gamepad?.['b-button'];
    const buttonBPressed = buttonB?.state === 'pressed';
    if (buttonBPressed && !buttonBWasPressed.current) fireKeyPress('Escape'); // Cancelar/Cerrar diálogo
    buttonBWasPressed.current = buttonBPressed;

    if (!xrOriginRef?.current) return;

    // 5. Movimiento con Joystick Izquierdo
    const leftStick = leftController?.gamepad?.['xr-standard-thumbstick'];
    const moveX = leftStick?.xAxis ?? 0;
    const moveZ = leftStick?.yAxis ?? 0;

    if (Math.abs(moveX) > 0.15 || Math.abs(moveZ) > 0.15) {
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      const side = new THREE.Vector3().crossVectors(forward, camera.up).normalize();

      const direction = new THREE.Vector3();
      direction.addScaledVector(forward, -moveZ);
      direction.addScaledVector(side, moveX);
      direction.clampLength(0, 1).multiplyScalar(speed);

      const next = xrOriginRef.current.position.clone().add(direction);
      if (!isPositionBlocked(new THREE.Vector3(next.x, 1.6, next.z))) {
        xrOriginRef.current.position.copy(next);
      }
    }

    // 6. Giro de cámara (Snap-turn) con Joystick Derecho
    snapTurnCooldown.current -= delta;
    const rightStick = rightController?.gamepad?.['xr-standard-thumbstick'];
    const turnX = rightStick?.xAxis ?? 0;

    if (Math.abs(turnX) > 0.6 && snapTurnCooldown.current <= 0) {
      const snapAngle = Math.PI / 4; // 45 grados
      xrOriginRef.current.rotation.y -= Math.sign(turnX) * snapAngle;
      snapTurnCooldown.current = 0.35; // Cooldown de 0.35 segundos
    }
  }

  useFrame((_, delta) => {
    if (gl.xr.isPresenting) {
      handleVRFrame(delta);
      return;
    }

    // LÓGICA DE ESCRITORIO
    const speed = 10 * delta;
    const moveForward = (moveState.current.forward ? 1 : 0) - (moveState.current.backward ? 1 : 0);
    const moveSide = (moveState.current.right ? 1 : 0) - (moveState.current.left ? 1 : 0);

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