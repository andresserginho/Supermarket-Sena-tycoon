import React, { useRef, useMemo, Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { CarModel } from './CarModel';

const CAR_MODELS = {
  carro1: '/models/2021_carro1.glb',
  carro2: '/models/2023_carro2.glb',
  carro3: '/models/2025_carro3.glb',
};

Object.values(CAR_MODELS).forEach((path) => useGLTF.preload(path));

interface VehicleData {
  id: number;
  laneX: number;
  initialZ: number;
  speed: number;
  direction: number;
  modelPath: string;
}

interface MovingVehicleProps extends VehicleData {
  allVehiclesRef: React.MutableRefObject<Map<number, THREE.Group>>;
  onPlayerHit?: (damage: number) => void;
}

function MovingVehicle({
  id,
  laneX,
  initialZ,
  speed,
  direction,
  modelPath,
  allVehiclesRef,
  onPlayerHit,
}: MovingVehicleProps) {
  const ref = useRef<THREE.Group>(null!);
  const { camera } = useThree();
  const currentSpeed = useRef(speed);
  const lastHitTime = useRef(0);

  const setRef = (node: THREE.Group | null) => {
    ref.current = node!;
    if (node) {
      allVehiclesRef.current.set(id, node);
    } else {
      allVehiclesRef.current.delete(id);
    }
  };

  useFrame((state, delta) => {
    if (!ref.current) return;

    const myZ = ref.current.position.z;
    let distanceToCarAhead = Infinity;

    allVehiclesRef.current.forEach((otherGroup, otherId) => {
      if (otherId === id) return;

      if (Math.abs(otherGroup.position.x - laneX) < 0.5) {
        const otherZ = otherGroup.position.z;
        const distAhead = (otherZ - myZ) * direction;

        if (distAhead > 0 && distAhead < distanceToCarAhead) {
          distanceToCarAhead = distAhead;
        }
      }
    });

    let targetSpeed = speed;
    if (distanceToCarAhead < 12) {
      targetSpeed = 0;
    } else if (distanceToCarAhead < 25) {
      targetSpeed = speed * ((distanceToCarAhead - 12) / 13);
    }

    currentSpeed.current = THREE.MathUtils.lerp(
      currentSpeed.current,
      targetSpeed,
      delta * 5
    );

    ref.current.position.z += currentSpeed.current * direction * delta;

    if (direction === -1 && ref.current.position.z < -80) {
      ref.current.position.z += 150;
    } else if (direction === 1 && ref.current.position.z > 80) {
      ref.current.position.z -= 150;
    }

    // --- DETECCIÓN DE IMPACTO Y EMPUJÓN FÍSICO AL JUGADOR ---
    const dx = camera.position.x - ref.current.position.x;
    const dz = camera.position.z - ref.current.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < 2.5) {
      const now = state.clock.getElapsedTime();
      if (now - lastHitTime.current > 0.8) {
        lastHitTime.current = now;

        // Empuja la cámara directamente hacia la acera más cercana fuera de la carretera
        const pushSide = camera.position.x >= 0 ? 4.5 : -4.5;
        camera.position.x = pushSide;

        if (onPlayerHit) {
          onPlayerHit(35);
        }
      }
    }
  });

  const rotationY = direction === -1 ? Math.PI : 0;

  return (
    <group ref={setRef} position={[laneX, 0, initialZ]} rotation={[0, rotationY, 0]}>
      <Suspense fallback={null}>
        <CarModel modelPath={modelPath} />
      </Suspense>
    </group>
  );
}

interface CarTrafficProps {
  onPlayerHit?: (damage: number) => void;
}

export const CarTraffic: React.FC<CarTrafficProps> = ({ onPlayerHit }) => {
  const allVehiclesRef = useRef<Map<number, THREE.Group>>(new Map());
  const SPEED = 14;

  const vehicles = useMemo<VehicleData[]>(() => [
    { id: 1, laneX: 2.2, initialZ: 50,  speed: SPEED, direction: -1, modelPath: CAR_MODELS.carro1 },
    { id: 2, laneX: 2.2, initialZ: 0,   speed: SPEED, direction: -1, modelPath: CAR_MODELS.carro2 },
    { id: 3, laneX: 2.2, initialZ: -50, speed: SPEED, direction: -1, modelPath: CAR_MODELS.carro3 },
    { id: 5, laneX: -2.2, initialZ: -50, speed: SPEED, direction: 1, modelPath: CAR_MODELS.carro1 },
    { id: 6, laneX: -2.2, initialZ: 0,   speed: SPEED, direction: 1, modelPath: CAR_MODELS.carro2 },
    { id: 7, laneX: -2.2, initialZ: 50,  speed: SPEED, direction: 1, modelPath: CAR_MODELS.carro3 },
  ], []);

  return (
    <group>
      {vehicles.map((v) => (
        <MovingVehicle
          key={v.id}
          {...v}
          allVehiclesRef={allVehiclesRef}
          onPlayerHit={onPlayerHit}
        />
      ))}
    </group>
  );
};