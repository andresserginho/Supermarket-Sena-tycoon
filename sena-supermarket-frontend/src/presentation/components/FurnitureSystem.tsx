// src/presentation/components/FurnitureSystem.tsx
import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulationStore } from '../../application/store/useSimulationStore';
import { worldColliders } from '../utils/colliders';

interface PlacedFurniture {
  uid: string;
  catalogId: string;
  model: string;
  color?: string;
  position: [number, number, number];
  rotation: [number, number, number];
}

const getModelConfig = (modelPath: string) => {
  if (modelPath.includes('mesa caja registradora')) {
    return { scale: 0.4, yOffset: -1.0 };
  }
  return { scale: 1.0, yOffset: 0 };
};

const SpawningFurniture: React.FC<{ holdingData: any, onPlace: (pos: [number, number, number]) => void, onCancel: () => void }> = ({ holdingData, onPlace, onCancel }) => {
  const gltf = useGLTF(holdingData.model) as any;
  const scene = gltf.scene;
  const clone = scene.clone();
  
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const [isValidPos, setIsValidPos] = useState(true);

  useEffect(() => {
    if (holdingData.color) {
      clone.traverse((child: any) => {
        if (child.isMesh && child.material) {
          child.material = child.material.clone();
          child.material.color.set(holdingData.color);
        }
      });
    }
  }, [clone, holdingData.color]);

  useFrame(() => {
    if (!groupRef.current) return;
    
    const raycaster = new THREE.Raycaster();
    const cameraDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    raycaster.set(camera.position, cameraDir);
    
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const target = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, target);

    if (target) {
      const distance = camera.position.distanceTo(target);
      if (distance > 5) {
        target.copy(camera.position).add(cameraDir.multiplyScalar(5));
        target.y = 0;
      }
      
      groupRef.current.position.copy(target);
      groupRef.current.rotation.y = camera.rotation.y;

      const furnitureBox = new THREE.Box3().setFromObject(groupRef.current);
      let collision = false;
      for (const collider of worldColliders) {
        if (furnitureBox.intersectsBox(collider)) {
          collision = true;
          break;
        }
      }
      setIsValidPos(!collision);
    }
  });

  useEffect(() => {
    const handleMouseClick = (e: MouseEvent) => {
      if (e.button === 0 && isValidPos && groupRef.current) {
        onPlace([groupRef.current.position.x, 0, groupRef.current.position.z]);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'q') onCancel();
    };

    window.addEventListener('mousedown', handleMouseClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleMouseClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isValidPos, onPlace, onCancel]);

  const config = getModelConfig(holdingData.model);

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.8, 32]} />
        <meshBasicMaterial color={isValidPos ? "#4ade80" : "#ef4444"} transparent opacity={0.4} />
      </mesh>
      <group scale={config.scale} position={[0, config.yOffset, 0]}>
        <primitive object={clone} />
      </group>
    </group>
  );
};

const PlacedItem: React.FC<{ data: PlacedFurniture, onPickUp: (uid: string) => void }> = ({ data, onPickUp }) => {
  const gltf = useGLTF(data.model) as any;
  const scene = gltf.scene;
  const clone = scene.clone();
  
  useEffect(() => {
    if (data.color) {
      clone.traverse((child: any) => {
        if (child.isMesh && child.material) {
          child.material = child.material.clone();
          child.material.color.set(data.color);
        }
      });
    }
    
    const box = new THREE.Box3().setFromObject(clone);
    worldColliders.push(box);
    return () => {
      const idx = worldColliders.indexOf(box);
      if(idx > -1) worldColliders.splice(idx, 1);
    }
  }, [clone, data.color, data.position]);

  const config = getModelConfig(data.model);

  return (
    <group 
      position={data.position} 
      rotation={data.rotation}
      onClick={(e) => {
        e.stopPropagation();
        onPickUp(data.uid);
      }}
      onPointerOver={() => document.body.style.cursor = 'pointer'}
      onPointerOut={() => document.body.style.cursor = 'auto'}
    >
      <group scale={config.scale} position={[0, config.yOffset, 0]}>
        <primitive object={clone} />
      </group>
    </group>
  );
};

export const FurnitureSystem: React.FC = () => {
  const store = useSimulationStore() as any;
  const holdingFurniture = store.holdingFurniture || null;
  const placedFurniture: PlacedFurniture[] = store.placedFurniture || [];
  
  const setPlacedFurniture = store.setPlacedFurniture || ((arr: any) => useSimulationStore.setState({ placedFurniture: arr } as any));
  const setFurnitureInventory = store.setFurnitureInventory || ((arr: any) => useSimulationStore.setState({ furnitureInventory: arr } as any));
  const furnitureInventory = store.furnitureInventory || [];

  const handlePlace = (pos: [number, number, number]) => {
    if (!holdingFurniture) return;
    
    const newPlaced: PlacedFurniture = {
      uid: holdingFurniture.uid,
      catalogId: holdingFurniture.catalogId,
      model: holdingFurniture.model,
      color: holdingFurniture.color,
      position: pos,
      rotation: [0, 0, 0]
    };

    const newInv = furnitureInventory.filter((f: any) => f.uid !== holdingFurniture.uid);
    setFurnitureInventory(newInv);
    setPlacedFurniture([...placedFurniture, newPlaced]);
    
    useSimulationStore.setState({ holdingFurniture: null } as any);
  };

  const handleCancel = () => {
    useSimulationStore.setState({ holdingFurniture: null } as any);
  };

  const handlePickUp = (uid: string) => {
    const item = placedFurniture.find(f => f.uid === uid);
    if (!item) return;

    const invItem = { uid: item.uid, catalogId: item.catalogId, color: item.color };
    setFurnitureInventory([...furnitureInventory, invItem]);
    setPlacedFurniture(placedFurniture.filter(f => f.uid !== uid));
    
    alert("Mueble devuelto al inventario del celular.");
  };

  return (
    <group>
      {placedFurniture.map(item => (
        <PlacedItem key={item.uid} data={item} onPickUp={handlePickUp} />
      ))}

      {holdingFurniture && (
        <SpawningFurniture 
          holdingData={holdingFurniture} 
          onPlace={handlePlace} 
          onCancel={handleCancel}
        />
      )}
    </group>
  );
};

export default FurnitureSystem;

useGLTF.preload('/models/mesa caja registradora.glb');
useGLTF.preload('/models/estante individual.glb');