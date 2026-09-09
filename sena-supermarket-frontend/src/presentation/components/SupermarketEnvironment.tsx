// src/presentation/components/SupermarketEnvironment.tsx
import React, { Suspense, useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { CarTraffic } from './CarTraffic';
import { SupermarketExpansions } from './SupermarketExpansions';
import { SupermarketStructure } from './SupermarketStructure';
import { addColliderFromMesh, addGroundCollider, clearColliders } from '../utils/colliders';
import { MODELOS_3D } from '../../application/data/modelosUrls';

const SUPERMARKET_CONFIG = {
  position: [-16, 0, 0] as [number, number, number],
  dimensions: { width: 14, height: 10, depth: 30 },
  colors: {
    header: '#15803d',
    glass: '#93c5fd',
    floor: '#f8fafc',
  },
};

const BUILDING_MODELS = {
  edificio3: MODELOS_3D.edificio3,
  caricaturesco: MODELOS_3D.edificio1,   
  abandonado: MODELOS_3D.edificiosAbandonados,
  adxo: MODELOS_3D.tiendaAdxo,
  cafe: MODELOS_3D.tienda3,
};

Object.values(BUILDING_MODELS).forEach((path) => useGLTF.preload(path));

// Componente para registrar el andén/acera en worldColliders
function Sidewalk({ position, args }: { position: [number, number, number]; args: [number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.updateMatrixWorld(true);
      addGroundCollider(meshRef.current);
    }
  }, []);

  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={args} />
      <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
    </mesh>
  );
}

function ExternalBuilding({ modelPath, position, scale = 1, rotationY = 0 }: { modelPath: string; position: [number, number, number]; scale?: number; rotationY?: number }) {
  const { scene } = useGLTF(modelPath);

  useEffect(() => {
    const clonedScene = scene.clone();
    clonedScene.position.set(...position);
    clonedScene.scale.set(scale, scale, scale);
    clonedScene.rotation.set(0, rotationY, 0);
    clonedScene.updateMatrixWorld(true);

    clonedScene.traverse((child: any) => {
      if (child.isMesh) {
        addColliderFromMesh(child);
      }
    });
  }, [scene, position, scale, rotationY]);

  return (
    <primitive 
      object={scene.clone()} 
      position={position} 
      scale={[scale, scale, scale]} 
      rotation={[0, rotationY, 0]} 
    />
  );
}

interface SupermarketEnvironmentProps {
  level?: number;
  onPlayerHit?: (damage: number) => void;
}

export const SupermarketEnvironment: React.FC<SupermarketEnvironmentProps> = ({ 
  level = 1, 
  onPlayerHit 
}) => {
  useEffect(() => {
    return () => {
      clearColliders();
    };
  }, []);

  const { position } = SUPERMARKET_CONFIG;

  const buildingsData = [
    { model: BUILDING_MODELS.edificio3,     x: 13, y: 8.2,  z: -60, scale: 1.5, rotY: -Math.PI / 2 },
    { model: BUILDING_MODELS.caricaturesco, x: 11.9, y: 0.08, z: -45, scale: 1.5, rotY: Math.PI },
    { model: BUILDING_MODELS.edificio3,     x: 15, y: 10.9,  z: -30, scale: 2.0, rotY: -Math.PI / 2 },
    { model: BUILDING_MODELS.caricaturesco, x: 11.9, y: 0.08, z: -15, scale: 1.5, rotY: Math.PI },
    { model: BUILDING_MODELS.edificio3,     x: 13.50, y: 8.2,  z: 0,   scale: 1.5, rotY: -Math.PI / 2 },
    { model: BUILDING_MODELS.caricaturesco, x: 11.9, y: 0.08, z: 10,  scale: 1.5, rotY: Math.PI },
    { model: BUILDING_MODELS.edificio3,     x: 14.38, y: 9.9,  z: 23,  scale: 1.8, rotY: -Math.PI / 2 },
    { model: BUILDING_MODELS.caricaturesco, x: 11.9, y: 0.08, z: 35,  scale: 1.5, rotY: Math.PI },
    { model: BUILDING_MODELS.edificio3,     x: 14.38, y: 9.9,  z: 48,  scale: 1.8, rotY: -Math.PI / 2 },
    { model: BUILDING_MODELS.adxo,          x: 1, y: 0.08, z: 48, scale: 1.0, rotY: -Math.PI / 2 },

    { model: BUILDING_MODELS.edificio3,     x: -13.70, y: 7.4,  z: -67, scale: 1.5, rotY: Math.PI / 2 },
    { model: BUILDING_MODELS.cafe,          x: -14.35, y: 0, z: -45,  scale: 1.0, rotY: Math.PI / 2 },
    { model: BUILDING_MODELS.caricaturesco, x: -12.50, y: 0.08, z: -33, scale: 1.5, rotY: 0 },
    { model: BUILDING_MODELS.edificio3,     x: -14, y: 8.3,  z: -23, scale: 1.5, rotY: Math.PI / 2 },
    { model: BUILDING_MODELS.edificio3,     x: -14.30, y: 9.9,  z: 25,  scale: 1.8, rotY: Math.PI / 2 },
    { model: BUILDING_MODELS.caricaturesco, x: -12, y: 0.08, z: 38,  scale: 1.5, rotY: 0 },
    { model: BUILDING_MODELS.edificio3,     x: -14.30, y: 9.9,  z: 49,  scale: 1.8, rotY: Math.PI / 2 },
    { model: BUILDING_MODELS.caricaturesco, x: -12, y: 0.08, z: 62,  scale: 1.5, rotY: 0 },
    { model: BUILDING_MODELS.abandonado,   x: -10.80, y: 2.0, z: 83,  scale: 1.5, rotY: -Math.PI / 2 },
  ];

  return (
    <group>
      {/* Carretera Principal */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 180]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>

      {/* Líneas de carretera */}
      <mesh position={[-0.1, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.15, 180]} />
        <meshStandardMaterial color="#eab308" />
      </mesh>
      <mesh position={[0.1, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.15, 180]} />
        <meshStandardMaterial color="#eab308" />
      </mesh>

      {/* Paso Peatonal */}
      <group position={[0, 0.06, 5]}>
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={i} position={[-3.5 + i * 1.0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.5, 5.0]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        ))}
      </group>

      {/* Andenes Blancos con Colisionadores Físicos */}
      <Sidewalk position={[-14.90, 0.08, 0]} args={[20, 180]} />
      <Sidewalk position={[15.85, 0.08, 4]} args={[22, 180]} />

      <SupermarketStructure 
        position={position} 
        unlockedZones={1} 
      />

      <Suspense fallback={null}>
        {buildingsData.map((b, index) => (
          <ExternalBuilding 
            key={index}
            modelPath={b.model} 
            position={[b.x, b.y, b.z]} 
            scale={b.scale} 
            rotationY={b.rotY} 
          />
        ))}
      </Suspense>

      <BoundaryWall position={[26.20, 2.5, 0]} args={[0.5, 5, 180]} />
      <BoundaryWall position={[-24, 2.5, 0]} args={[0.5, 5, 180]} />

      <group position={[0, 0, -80]}>
        <mesh position={[0, 2.5, 0]}>
          <planeGeometry args={[60, 5]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
        <mesh position={[0, 2.50, 170]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[60, 5]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
      </group>

      <CarTraffic onPlayerHit={onPlayerHit} />
      <SupermarketExpansions level={level} />
    </group>
  );
};

function BoundaryWall({ position, args }: { position: [number, number, number]; args: [number, number, number] }) {
  const meshRef = React.useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (meshRef.current) {
      addColliderFromMesh(meshRef.current);
    }
  }, []);

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={args} />
      <meshStandardMaterial color="#475569" roughness={0.7} />
    </mesh>
  );
}