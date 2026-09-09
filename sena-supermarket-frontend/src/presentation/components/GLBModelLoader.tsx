import React, { Suspense } from 'react';
import { useGLTF } from '@react-three/drei';

interface GLBModelProps {
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

const ModelInner: React.FC<GLBModelProps> = ({ url, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1] }) => {
  const { scene } = useGLTF(url);
  return <primitive object={scene.clone()} position={position} rotation={rotation} scale={scale} />;
};

const ModelFallback: React.FC<{ position?: [number, number, number]; scale?: [number, number, number] }> = ({
  position = [0, 0, 0],
  scale = [1, 1, 1],
}) => (
  <mesh position={position} scale={scale}>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color="#334155" roughness={0.5} />
  </mesh>
);

export const GLBModelLoader: React.FC<GLBModelProps> = (props) => {
  return (
    <Suspense fallback={<ModelFallback position={props.position} scale={props.scale} />}>
      <ModelInner {...props} />
    </Suspense>
  );
};