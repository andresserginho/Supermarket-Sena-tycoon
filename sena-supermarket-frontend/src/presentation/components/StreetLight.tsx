import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { worldColliders } from '../utils/colliders';

export interface StreetLightProps {
  position: [number, number, number];
  height?: number;
  rotationY?: number;
  isNight: boolean;
}

export const StreetLight: React.FC<StreetLightProps> = ({
  position,
  height = 3.5,
  rotationY = 0,
  isNight,
}) => {
  const spotLightRef = useRef<THREE.SpotLight>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);

  const poleRadius = 0.06;
  const armLength = 0.6;
  const armY = height - 0.12;
  const headX = armLength;
  const headY = height - 0.18;

  // Registrar la caja de colisión física del poste en el sistema de colisionadores globales
  useEffect(() => {
    // Incrementado a 0.35 para asegurar que la colisión del jugador detecte el poste y no lo traspase
    const padding = 0.35;
    const colliderBox = new THREE.Box3(
      new THREE.Vector3(position[0] - padding, position[1], position[2] - padding),
      new THREE.Vector3(position[0] + padding, position[1] + height, position[2] + padding)
    );

    worldColliders.push(colliderBox);

    return () => {
      const index = worldColliders.indexOf(colliderBox);
      if (index > -1) {
        worldColliders.splice(index, 1);
      }
    };
  }, [position, height]);

  // Objetivo focal en el suelo
  const targetObject = useMemo(() => {
    const obj = new THREE.Object3D();
    obj.position.set(headX, 0, 0);
    return obj;
  }, [headX]);

  // Transición suave de intensidad de luz día / noche
  useFrame(() => {
    const targetSpot = isNight ? 18 : 0;
    const targetPoint = isNight ? 4 : 0;

    if (spotLightRef.current) {
      spotLightRef.current.intensity = THREE.MathUtils.lerp(
        spotLightRef.current.intensity,
        targetSpot,
        0.05
      );
    }
    if (pointLightRef.current) {
      pointLightRef.current.intensity = THREE.MathUtils.lerp(
        pointLightRef.current.intensity,
        targetPoint,
        0.05
      );
    }
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <primitive object={targetObject} />

      {/* Base de la Farola */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 0.2, 12]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Poste Principal */}
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[poleRadius * 0.8, poleRadius, height, 12]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Brazo Horizontal Superior */}
      <mesh position={[armLength / 2, armY, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, armLength, 8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Cabeza de la Luminaria */}
      <mesh position={[headX, headY, 0]}>
        <boxGeometry args={[0.22, 0.08, 0.18]} />
        <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Cristal Emisivo del Foco */}
      <mesh position={[headX, headY - 0.041, 0]}>
        <boxGeometry args={[0.18, 0.015, 0.14]} />
        <meshStandardMaterial
          color="#fef08a"
          emissive="#fef08a"
          emissiveIntensity={isNight ? 3 : 0}
        />
      </mesh>

      {/* Haz Volumétrico Difuminado en el Aire (Efecto niebla/atmósfera) */}
      {isNight && (
        <mesh position={[headX, headY / 2, 0]}>
          <coneGeometry args={[2.8, headY, 32, 1, true]} />
          <meshBasicMaterial
            color="#fbbf24"
            transparent
            opacity={0.07}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Luz Focal Difuminada hacia el Suelo */}
      <spotLight
        ref={spotLightRef}
        position={[headX, headY - 0.05, 0]}
        target={targetObject}
        color="#fef08a"
        angle={0.85}
        penumbra={1.0}
        decay={1.8}
        intensity={0}
        distance={16}
        castShadow
      />

      {/* Luz Puntual para Resplandor Cercano en la Cabeza */}
      <pointLight
        ref={pointLightRef}
        position={[headX, headY - 0.1, 0]}
        color="#fef08a"
        intensity={0}
        distance={6}
        decay={2}
      />
    </group>
  );
};

export default StreetLight;