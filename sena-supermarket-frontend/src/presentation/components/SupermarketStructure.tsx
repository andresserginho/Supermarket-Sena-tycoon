import React from 'react';
import { useGLTF } from '@react-three/drei';

const MODEL_PATHS = {
  floor: '/models/PisoMETA.glb',
  wallBack: '/models/wall_back_14m.glb',
  wallSide: '/models/wall_side_10mA.glb',
  entrance: '/models/entradasuper.glb',
};

interface SupermarketStructureProps {
  position: [number, number, number];
  unlockedZones?: number;
}

export const SupermarketStructure: React.FC<SupermarketStructureProps> = ({ 
  position, 
  unlockedZones = 1 
}) => {
  const { scene: floor } = useGLTF(MODEL_PATHS.floor);
  const { scene: back } = useGLTF(MODEL_PATHS.wallBack);
  const { scene: side } = useGLTF(MODEL_PATHS.wallSide);
  const { scene: entry } = useGLTF(MODEL_PATHS.entrance);

  return (
    <group position={position}>
      {Array.from({ length: unlockedZones }).map((_, i) => {
        const zOffset = -i * 10;
        const isLast = i === unlockedZones - 1;

        return (
          <group key={`zone-${i}`} position={[0, 0, zOffset]}>
            {/* Piso */}
            <primitive object={floor.clone()} />

            {/* Techo (Duplicado exacto del piso elevado en el eje Y, ej: altura 4 o la que necesites) */}
            <primitive object={floor.clone()} position={[0, 3.40, 0]} />

            {/* Pared trasera */}
            <primitive object={side.clone()} position={[0, 0, 0]} />

            {/* Pared Derecha */}
            <primitive object={back.clone()} position={[0, 0, 10]} />

            {/* Pared lateral derecha */}
            <primitive object={back.clone()} position={[0, 0, 0]} />

            {/* Pared Frontal con Puerta (Solo en la última sección activa) */}
            {isLast && <primitive object={entry.clone()} position={[0, 0, 0]} />}
          </group>
        );
      })}
    </group>
  );
};