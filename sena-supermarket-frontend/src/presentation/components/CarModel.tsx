import React, { useMemo, Component, type ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Soporte para archivos .glb comprimidos con Draco desde Blender
useGLTF.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');

interface CarModelProps {
  modelPath: string;
  targetLength?: number;
  rotationOffset?: number;
}

function GLTFVehicle({ modelPath, targetLength = 4.2, rotationOffset = 0 }: CarModelProps) {
  const { scene } = useGLTF(modelPath);

  const centeredAndScaledScene = useMemo(() => {
    if (!scene) return null;

    // 1. Clonar profundamente la escena
    const clone = scene.clone(true);

    // 2. Calcular límites (bounding box) y centro real de la malla
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // 3. Crear contenedor para corregir pivotes desalineados en Blender
    const wrapper = new THREE.Group();

    // Fuerza que el centro X/Z sea 0 y que la base del auto (llantas) quede sobre Y = 0
    clone.position.set(-center.x, -box.min.y, -center.z);
    wrapper.add(clone);

    // 4. Calcular escala uniforme basada en la dimensión mayor
    const maxDim = Math.max(size.x, size.y, size.z);
    const currentLength = maxDim > 0.001 ? maxDim : 1;
    const scaleFactor = targetLength / currentLength;

    wrapper.scale.set(scaleFactor, scaleFactor, scaleFactor);

    return wrapper;
  }, [scene, targetLength]);

  if (!centeredAndScaledScene) return null;

  return (
    <group rotation={[0, rotationOffset, 0]}>
      <primitive object={centeredAndScaledScene} />
    </group>
  );
}

// Representación visual en caso de fallo (Caja Roja de emergencia)
function FallbackCarMesh() {
  return (
    <mesh position={[0, 0.75, 0]}>
      <boxGeometry args={[1.8, 1.2, 4]} />
      <meshStandardMaterial color="#ef4444" roughness={0.3} />
    </mesh>
  );
}

class CarErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.error('Error cargando el modelo 3D:', error);
  }

  render() {
    if (this.state.hasError) return <FallbackCarMesh />;
    return this.props.children;
  }
}

export const CarModel: React.FC<CarModelProps> = (props) => (
  <CarErrorBoundary>
    <GLTFVehicle {...props} />
  </CarErrorBoundary>
);