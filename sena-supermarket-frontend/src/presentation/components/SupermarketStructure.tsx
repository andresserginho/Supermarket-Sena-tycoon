// src/presentation/components/SupermarketStructure.tsx
import React, { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { addColliderFromMesh } from '../utils/colliders';

const MODEL_PATHS = {
  floor: '/models/PisoMETA.glb',
  wallBack: '/models/wall_back_14m.glb',
  wallSide: '/models/wall_side_10mA.glb',
  entrance: '/models/entradasuper.glb',
};

interface SupermarketStructureProps {
  position: [number, number, number];
  unlockedZones?: number;
  wallColor?: string;
}

export const SupermarketStructure: React.FC<SupermarketStructureProps> = ({ 
  position, 
  unlockedZones = 1,
  wallColor = '#ffffff'
}) => {
  const { scene: floor } = useGLTF(MODEL_PATHS.floor);
  const { scene: back } = useGLTF(MODEL_PATHS.wallBack);
  const { scene: side } = useGLTF(MODEL_PATHS.wallSide);
  const { scene: entry } = useGLTF(MODEL_PATHS.entrance);

  useEffect(() => {
    // Aplicar color personalizado a muros y extraer colisiones de geometría real
    [back, side, entry].forEach((sceneModel) => {
      sceneModel.traverse((child: any) => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({
            color: wallColor,
            roughness: 0.5,
          });
          // Registrar la caja delimitadora real de la malla
          addColliderFromMesh(child);
        }
      });
    });
  }, [back, side, entry, wallColor]);

  return (
    <group position={position}>
      {Array.from({ length: unlockedZones }).map((_, i) => {
        const zOffset = -i * 10;
        const isLast = i === unlockedZones - 1;

        return (
          <group key={`zone-${i}`} position={[0, 0, zOffset]}>
            <primitive object={floor.clone()} />
            <primitive object={floor.clone()} position={[0, 3.40, 0]} />
            <primitive object={side.clone()} position={[0, 0, 0]} />
            <primitive object={back.clone()} position={[0, 0, 10]} />
            <primitive object={back.clone()} position={[0, 0, 0]} />
            {isLast && <primitive object={entry.clone()} position={[0, 0, 0]} />}
          </group>
        );
      })}
    </group>
  );
};