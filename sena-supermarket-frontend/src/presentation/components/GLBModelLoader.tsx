// src/presentation/components/GLBModelLoader.tsx
import React from 'react';
import { useGLTF } from '@react-three/drei';

interface GLBModelProps {
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export const GLBModelLoader: React.FC<GLBModelProps> = ({ url, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1] }) => {
  try {
    const { scene } = useGLTF(url);
    return <primitive object={scene.clone()} position={position} rotation={rotation} scale={scale} />;
  } catch (e) {
    // Fallback visual si el modelo externo aún se está descargando o procesando
    return (
      <mesh position={position} scale={scale}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#334155" roughness={0.5} />
      </mesh>
    );
  }
};