// src/presentation/components/FurnitureSystem.tsx
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useXRInputSourceState } from '@react-three/xr';
import * as THREE from 'three';
import { useSimulationStore } from '../../application/store/useSimulationStore';
import { supermarketFloorColliders, worldColliders } from '../utils/colliders';
import { MODELOS_3D } from '../../application/data/modelosUrls';
import { SUPERMARKET_BOUNDS } from '../../application/data/supermarketBounds';

interface PlacedFurniture {
  uid: string;
  catalogId: string;
  model: string;
  color?: string;
  position: [number, number, number];
  rotation: [number, number, number];
}

const getModelConfig = (modelPath: string) => {
  if (modelPath.includes('mesa%20caja%20registradora') || modelPath.includes('mesa caja registradora')) {
    return { desiredHeight: 1.05, yOffset: 0 };
  }
  return { desiredHeight: 1.35, yOffset: 0 };
};

const getModelScale = (scene: THREE.Object3D, desiredHeight: number) => {
  const bounds = new THREE.Box3().setFromObject(scene);
  const sourceHeight = bounds.getSize(new THREE.Vector3()).y;
  return sourceHeight > 0.001 ? desiredHeight / sourceHeight : 1;
};

const FLOOR_Y = 0.081;
const STORE_BOUNDS = SUPERMARKET_BOUNDS;

const SpawningFurniture: React.FC<{ holdingData: any, onPlace: (pos: [number, number, number], rotation: [number, number, number]) => void, onCancel: () => void }> = ({ holdingData, onPlace, onCancel }) => {
  const gltf = useGLTF(holdingData.model) as any;
  const scene = gltf.scene;
  const clone = useMemo(() => scene.clone(true), [scene]);
  
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const rightController = useXRInputSourceState('controller', 'right');
  const [isValidPos, setIsValidPos] = useState(true);
  const isValidPosRef = useRef(true);
  const rotationY = useRef(0);
  const rotationCooldown = useRef(0);

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
    const hit = raycaster.ray.intersectPlane(plane, target);

    if (!hit) {
      target.copy(camera.position).add(cameraDir.multiplyScalar(2));
      target.y = 0;
    }

    if (target) {
      rotationCooldown.current -= 1 / 60;
      const stick = rightController?.gamepad?.['xr-standard-thumbstick'];
      if (stick && Math.abs(stick.xAxis ?? 0) > 0.65 && rotationCooldown.current <= 0) {
        rotationY.current += Math.sign(stick.xAxis ?? 0) * Math.PI / 8;
        rotationCooldown.current = 0.25;
      }
      const distance = camera.position.distanceTo(target);
      if (distance > 5) {
        target.copy(camera.position).add(cameraDir.multiplyScalar(5));
        target.y = 0;
      }
      
      groupRef.current.position.set(target.x, 0, target.z);
      groupRef.current.rotation.y = rotationY.current;

      groupRef.current.updateMatrixWorld(true);
      const furnitureBox = new THREE.Box3().setFromObject(groupRef.current);
      const supportY = supermarketFloorColliders
        .filter((collider) =>
          collider.max.x > furnitureBox.min.x && collider.min.x < furnitureBox.max.x &&
          collider.max.z > furnitureBox.min.z && collider.min.z < furnitureBox.max.z
        )
        .reduce((highest, collider) => Math.max(highest, collider.max.y), FLOOR_Y);
      groupRef.current.position.y += supportY - furnitureBox.min.y + 0.001;
      groupRef.current.updateMatrixWorld(true);
      const placedBox = new THREE.Box3().setFromObject(groupRef.current);
      const insideStore =
        placedBox.min.x >= STORE_BOUNDS.minX && placedBox.max.x <= STORE_BOUNDS.maxX &&
        placedBox.min.z >= STORE_BOUNDS.minZ && placedBox.max.z <= STORE_BOUNDS.maxZ;
      let collision = !insideStore;
      for (const collider of worldColliders) {
        const isFloor = supermarketFloorColliders.includes(collider) || collider.max.y <= FLOOR_Y + 0.01;
        if (insideStore && !isFloor && placedBox.intersectsBox(collider)) {
          collision = true;
          break;
        }
      }
      const nextIsValid = !collision;
      if (isValidPosRef.current !== nextIsValid) {
        isValidPosRef.current = nextIsValid;
        setIsValidPos(nextIsValid);
      }
    }
  });

  useEffect(() => {
    const handleMouseClick = (e: MouseEvent) => {
      if (e.button === 0 && isValidPos && groupRef.current) {
        onPlace(
          [groupRef.current.position.x, groupRef.current.position.y, groupRef.current.position.z],
          [0, groupRef.current.rotation.y, 0],
        );
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'q') onCancel();
      if (e.key.toLowerCase() === 'r') rotationY.current += Math.PI / 8;
      if (e.key === 'Enter' && isValidPos && groupRef.current) {
        onPlace(
          [groupRef.current.position.x, groupRef.current.position.y, groupRef.current.position.z],
          [0, groupRef.current.rotation.y, 0],
        );
      }
    };

    window.addEventListener('mousedown', handleMouseClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleMouseClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isValidPos, onPlace, onCancel]);

  const config = getModelConfig(holdingData.model);
  const modelScale = useMemo(() => getModelScale(clone, config.desiredHeight), [clone, config.desiredHeight]);

  return (
    <group ref={groupRef}>
      <group scale={modelScale} position={[0, config.yOffset, 0]}>
        <primitive object={clone} />
      </group>
    </group>
  );
};

const PlacedItem: React.FC<{ data: PlacedFurniture, onPickUp: (uid: string) => void }> = ({ data, onPickUp }) => {
  const gltf = useGLTF(data.model) as any;
  const scene = gltf.scene;
  const clone = useMemo(() => scene.clone(true), [scene]);
  const groupRef = useRef<THREE.Group>(null);
  const heldProduct = useSimulationStore((state) => state.heldProduct);
  const dropProduct = useSimulationStore((state) => state.dropProduct);
  
  useEffect(() => {
    if (data.color) {
      clone.traverse((child: any) => {
        if (child.isMesh && child.material) {
          child.material = child.material.clone();
          child.material.color.set(data.color);
        }
      });
    }
    
    if (!groupRef.current) return;
    groupRef.current.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(groupRef.current);
    worldColliders.push(box);
    return () => {
      const idx = worldColliders.indexOf(box);
      if(idx > -1) worldColliders.splice(idx, 1);
    }
  }, [clone, data.color, data.position]);

  const config = getModelConfig(data.model);
  const modelScale = useMemo(() => getModelScale(clone, config.desiredHeight), [clone, config.desiredHeight]);

  return (
    <group
      ref={groupRef}
      position={data.position} 
      rotation={data.rotation}
      onClick={(e) => {
        e.stopPropagation();
        if (heldProduct) {
          const point = e.point;
          dropProduct([point.x, point.y + 0.1, point.z], point.y + 0.1);
        } else {
          onPickUp(data.uid);
        }
      }}
      onPointerOver={() => document.body.style.cursor = 'pointer'}
      onPointerOut={() => document.body.style.cursor = 'auto'}
    >
      <group scale={modelScale} position={[0, config.yOffset, 0]}>
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

  const handlePlace = (pos: [number, number, number], rotation: [number, number, number]) => {
    if (!holdingFurniture) return;
    
    const newPlaced: PlacedFurniture = {
      uid: holdingFurniture.uid,
      catalogId: holdingFurniture.catalogId,
      model: holdingFurniture.model,
      color: holdingFurniture.color,
      position: pos,
      rotation
    };

    setPlacedFurniture([...placedFurniture, newPlaced]);
    
    useSimulationStore.setState({ holdingFurniture: null } as any);
  };

  const handleCancel = () => {
    useSimulationStore.setState({ holdingFurniture: null } as any);
  };

  const handlePickUp = (uid: string) => {
    const item = placedFurniture.find(f => f.uid === uid);
    if (!item) return;

    const alreadyOwned = furnitureInventory.some((f: any) => f.uid === item.uid);
    if (!alreadyOwned) {
      setFurnitureInventory([...furnitureInventory, { uid: item.uid, catalogId: item.catalogId, color: item.color }]);
    }
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

useGLTF.preload(MODELOS_3D.mesaCajaRegistradora);
useGLTF.preload(MODELOS_3D.estanteIndividual);