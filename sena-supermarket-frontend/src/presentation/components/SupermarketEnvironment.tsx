import React, { Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import { CarTraffic } from './CarTraffic';
import { SupermarketExpansions } from './SupermarketExpansions';

const SUPERMARKET_CONFIG = {
  position: [-16, 0, 0] as [number, number, number],
  dimensions: { width: 14, height: 10, depth: 30 },
  colors: {
    wall: '#1e293b',
    header: '#15803d',
    glass: '#93c5fd',
    floor: '#f8fafc',
  },
};

const BUILDING_MODELS = {
  edificio3: '/models/edificio_3.glb',
  caricaturesco: '/models/edificio_1.glb',   
  abandonado: '/models/edificios_abandonados.glb',
  adxo: '/models/Tienda_Adxo.glb',
  cafe: '/models/tienda_3.glb',
};

Object.values(BUILDING_MODELS).forEach((path) => useGLTF.preload(path));

function ExternalBuilding({ modelPath, position, scale = 1, rotationY = 0 }: { modelPath: string; position: [number, number, number]; scale?: number; rotationY?: number }) {
  const { scene } = useGLTF(modelPath);
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
  const { position, dimensions, colors } = SUPERMARKET_CONFIG;

  const buildingsData = [
    // --- ACERA DERECHA (X Positiva) ---
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

    // --- ACERA IZQUIERDA (X Negativa) ---
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
      {/* 1. CARRETERA CENTRAL */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 180]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>

      <mesh position={[-0.1, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.15, 180]} />
        <meshStandardMaterial color="#eab308" />
      </mesh>
      <mesh position={[0.1, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.15, 180]} />
        <meshStandardMaterial color="#eab308" />
      </mesh>

      {/* Cebra Peatonal */}
      <group position={[0, 0.06, 5]}>
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={i} position={[-3.5 + i * 1.0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.5, 5.0]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        ))}
      </group>

      {/* 2. ACERAS / ANDENES */}
      <mesh position={[-13.89, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 180]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
      </mesh>
      <mesh position={[15.46, 0.08, 4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[21, 180]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
      </mesh>

      {/* 3. SUPERMERCADO MODULAR */}
      <group position={position}>
        <mesh position={[0, dimensions.height / 2, 0]}>
          <boxGeometry args={[dimensions.width, dimensions.height, dimensions.depth]} />
          <meshStandardMaterial color={colors.wall} />
        </mesh>

        <mesh position={[dimensions.width / 2 - 0.1, dimensions.height - 1.5, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[dimensions.depth - 4, 2.5]} />
          <meshStandardMaterial color={colors.header} />
        </mesh>

        <mesh position={[dimensions.width / 2 - 0.1, 3, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[dimensions.depth - 4, 4]} />
          <meshPhysicalMaterial color={colors.glass} transmission={0.7} opacity={0.8} transparent roughness={0.1} />
        </mesh>

        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[dimensions.width - 1, dimensions.depth - 1]} />
          <meshStandardMaterial color={colors.floor} roughness={0.2} />
        </mesh>
      </group>

      {/* 4. RENDERIZADO DE EDIFICIOS */}
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

      {/* 5. MUROS LÍMITE */}
      <mesh position={[26.20, 2.5, 0]}>
        <boxGeometry args={[0.5, 5, 180]} />
        <meshStandardMaterial color="#475569" roughness={0.7} />
      </mesh>
      <mesh position={[-23, 2.5, 0]}>
        <boxGeometry args={[0.5, 5, 180]} />
        <meshStandardMaterial color="#475569" roughness={0.7} />
      </mesh>

      {/* 6. TÚNEL URBANO */}
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