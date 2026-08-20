// src/presentation/components/SupermarketExpansions.tsx
import React from 'react';

interface SupermarketExpansionsProps {
  level: number;
}

export const SupermarketExpansions: React.FC<SupermarketExpansionsProps> = ({ level }) => {
  return (
    <group>
      {/* Expansión Nivel 2: Pasillo Adicional de Estanterías */}
      {level >= 2 && (
        <group position={[0, 0, -5]}>
          <mesh castShadow receiveShadow position={[-6, 1.2, 0]}>
            <boxGeometry args={[2, 2.4, 0.8]} />
            <meshStandardMaterial color="#6b4f4f" roughness={0.7} />
          </mesh>
          <mesh castShadow receiveShadow position={[6, 1.2, 0]}>
            <boxGeometry args={[2, 2.4, 0.8]} />
            <meshStandardMaterial color="#6b4f4f" roughness={0.7} />
          </mesh>
        </group>
      )}

      {/* Expansión Nivel 3: Zona de Almacén Trasero Ampliada */}
      {level >= 3 && (
        <mesh position={[0, 3, -15]} receiveShadow>
          <boxGeometry args={[20, 6, 0.5]} />
          <meshStandardMaterial color="#2d3748" roughness={0.8} />
        </mesh>
      )}
    </group>
  );
};