// src/presentation/components/SupermarketStructure.tsx
import React, { useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { addObjectColliders, addShelfCollider, npcObstacleColliders, supermarketFloorColliders, shelfColliders, worldColliders } from '../utils/colliders';
import { MODELOS_3D } from '../../application/data/modelosUrls';
import { setSupermarketBounds } from '../../application/data/supermarketBounds';

const MODEL_PATHS = {
  supermarket: MODELOS_3D.supermercado,
  floor: MODELOS_3D.pisoMETA,
  wallBack: MODELOS_3D.wallBack14m,
  wallSide: MODELOS_3D.wallSide10mA,
  entrance: MODELOS_3D.entradasuper,
};

const SUPERMARKET_MODEL_POSITION: [number, number, number] = [9, 0.081, 16];
// Si quieres sumarle 180 grados a la posición actual:
const SUPERMARKET_MODEL_ROTATION: [number, number, number] = [0, Math.PI / 2, 0];
const SUPERMARKET_MODEL_SCALE = 0.5;

interface SupermarketStructureProps {
  position: [number, number, number];
  unlockedZones?: number;
}

// Componente inteligente: Renderiza el GLB y crea la colisión física unida a él
function StructurePart({ 
  modelUrl, 
  position = [0, 0, 0], 
  rotation = [0, 0, 0],
  scale = 1,
  isWall = false 
}: { 
  modelUrl: string; 
  position?: [number, number, number]; 
  rotation?: [number, number, number];
  scale?: number;
  isWall?: boolean;
}) {
  const { scene } = useGLTF(modelUrl);
  const groupRef = useRef<THREE.Group>(null);

  const cloned = useMemo(() => {
    const clone = scene.clone(true);
    return clone;
  }, [scene, position, rotation]);

  useEffect(() => {
    if (!groupRef.current) return;
    const structureGroup = groupRef.current;
    structureGroup.updateMatrixWorld(true);
    const colliders = isWall ? addObjectColliders(structureGroup) : [];
    const floorColliders: THREE.Box3[] = [];

    if (modelUrl === MODEL_PATHS.supermarket) {
      const modelBounds = new THREE.Box3().setFromObject(structureGroup);
      setSupermarketBounds(
        modelBounds.min.x + 1.2,
        modelBounds.max.x - 1.2,
        modelBounds.min.z + 1.2,
        modelBounds.max.z - 1.2,
      );

      structureGroup.traverse((child) => {
        if (!(child as THREE.Mesh).isMesh) return;
        const nodeName = child.name.toLowerCase();
        if (nodeName.includes('shelf') || nodeName.includes('estante') || nodeName.includes('estanter')) {
          addShelfCollider(child);
        }
        const box = new THREE.Box3().setFromObject(child);
        if (!box.isEmpty() && box.max.y > 0.3) npcObstacleColliders.push(box);
        if (box.isEmpty() || box.max.y > 1.5) return;
        const floorBox = box.clone();
        floorBox.min.y = floorBox.max.y - 0.06;
        floorColliders.push(floorBox);
        supermarketFloorColliders.push(floorBox);
        worldColliders.push(floorBox);
      });
    }

    return () => {
      colliders.forEach((collider) => {
        const index = worldColliders.indexOf(collider);
        if (index >= 0) worldColliders.splice(index, 1);
      });
      floorColliders.forEach((collider) => {
        const worldIndex = worldColliders.indexOf(collider);
        if (worldIndex >= 0) worldColliders.splice(worldIndex, 1);
        const floorIndex = supermarketFloorColliders.indexOf(collider);
        if (floorIndex >= 0) supermarketFloorColliders.splice(floorIndex, 1);
      });
      structureGroup.traverse((child) => {
        const nodeName = child.name.toLowerCase();
        const obstacleBox = npcObstacleColliders.find((candidate) => candidate.equals(new THREE.Box3().setFromObject(child)));
        if (obstacleBox) npcObstacleColliders.splice(npcObstacleColliders.indexOf(obstacleBox), 1);
        if (nodeName.includes('shelf') || nodeName.includes('estante') || nodeName.includes('estanter')) {
          const shelfBox = shelfColliders.find((candidate) => candidate.equals(new THREE.Box3().setFromObject(child)));
          if (shelfBox) shelfColliders.splice(shelfColliders.indexOf(shelfBox), 1);
        }
      });
    };
  }, [isWall, modelUrl, cloned]);

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      <primitive object={cloned} />
    </group>
  );
}

export const SupermarketStructure: React.FC<SupermarketStructureProps> = ({ 
  position, 
  unlockedZones = 1 
}) => {
  return (
    <group position={position}>
      <StructurePart
        modelUrl={MODEL_PATHS.supermarket}
        position={SUPERMARKET_MODEL_POSITION}
        rotation={SUPERMARKET_MODEL_ROTATION}
        scale={SUPERMARKET_MODEL_SCALE}
      />

      <pointLight position={[9, 4, 16]} intensity={18} distance={14} color="#fff4d6" />
      <pointLight position={[9, 3, 10]} intensity={12} distance={10} color="#dcecff" />
      <pointLight position={[9, 3, 22]} intensity={12} distance={10} color="#dcecff" />
      <ambientLight intensity={0.7} color="#fff4dc" />
      <pointLight position={[5, 4, 4]} intensity={9} distance={9} color="#fff1cf" />
      <pointLight position={[13, 4, 4]} intensity={9} distance={9} color="#fff1cf" />
      <pointLight position={[5, 4, 12]} intensity={9} distance={9} color="#fff1cf" />
      <pointLight position={[13, 4, 12]} intensity={9} distance={9} color="#fff1cf" />
      <pointLight position={[5, 4, 20]} intensity={9} distance={9} color="#fff1cf" />
      <pointLight position={[13, 4, 20]} intensity={9} distance={9} color="#fff1cf" />
      <pointLight position={[5, 4, 28]} intensity={9} distance={9} color="#fff1cf" />
      <pointLight position={[13, 4, 28]} intensity={9} distance={9} color="#fff1cf" />

      {/* Estructura provisional desactivada mientras se ajusta SUPERMERCADO.glb. */}
      {false && Array.from({ length: unlockedZones }).map((_, i) => {
        const zOffset = -i * 10;
        const isLast = i === unlockedZones - 1;

        return (
          <group key={`zone-${i}`} position={[0, 0, zOffset]}>
            <StructurePart modelUrl={MODEL_PATHS.floor} />
            <StructurePart modelUrl={MODEL_PATHS.floor} position={[0, 3.30, 0]} />
            
            <StructurePart modelUrl={MODEL_PATHS.wallSide} isWall />
            <StructurePart modelUrl={MODEL_PATHS.wallBack} position={[0, 0, 10]} isWall />
            <StructurePart modelUrl={MODEL_PATHS.wallBack} position={[0, 0, 0]} />

            {isLast && <StructurePart modelUrl={MODEL_PATHS.entrance} />}
          </group>
        );
      })}
    </group>
  );
};