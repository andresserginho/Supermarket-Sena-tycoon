// src/presentation/components/DeliveryBox.tsx
import React, { useRef, useEffect, useState } from 'react';
import { useSimulationStore } from '../../application/store/useSimulationStore';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { worldColliders } from '../utils/colliders';

export interface DeliveryItem {
  productId: string;
  productName?: string;
  quantity: number;
}

export interface DeliveryBoxType {
  id: string;
  items: DeliveryItem[];
  position: [number, number, number];
  deliveryTimeGameHours?: number;
}

interface DeliveryBoxItemProps {
  box: DeliveryBoxType;
  onPickUpBox: (box: DeliveryBoxType) => void;
  onPickUpProduct: (productId: string) => void;
  isHandFull: boolean;
}

const getProductColor = (id: string) => {
  if (id.includes('leche')) return '#ffffff';
  if (id.includes('pan')) return '#fcd34d';
  if (id.includes('arroz')) return '#e2e8f0';
  if (id.includes('aceite')) return '#fef08a';
  if (id.includes('huevos')) return '#fef3c7';
  return '#94a3b8';
};

export const DeliveryBoxItem: React.FC<DeliveryBoxItemProps> = ({ box, onPickUpBox, onPickUpProduct, isHandFull }) => {
  const store = useSimulationStore() as any;
  const removeDeliveryBox = store.removeDeliveryBox;
  
  const [isOpened, setIsOpened] = useState(false);
  const [localItems, setLocalItems] = useState<DeliveryItem[]>(box.items);

  const boxWidth = 0.45;
  const boxHeight = 0.32;
  const boxDepth = 0.45;
  const t = 0.02;

  useEffect(() => {
    const [x, y, z] = box.position;
    const colliderBox = new THREE.Box3(
      new THREE.Vector3(x - boxWidth / 2, y, z - boxDepth / 2),
      new THREE.Vector3(x + boxWidth / 2, y + boxHeight, z + boxDepth / 2)
    );
    worldColliders.push(colliderBox);
    return () => {
      const index = worldColliders.indexOf(colliderBox);
      if (index > -1) worldColliders.splice(index, 1);
    };
  }, [box.position]);

  const handleLidClick = (e: any) => {
    e.stopPropagation();
    if (!isOpened) {
      setIsOpened(true);
    }
  };

  const handleBodyClick = (e: any) => {
    e.stopPropagation();
    if (!isOpened) {
      onPickUpBox({ ...box, items: localItems });
    } else {
      const totalItemsLeft = localItems.reduce((acc, item) => acc + item.quantity, 0);
      if (totalItemsLeft === 0) {
        if (typeof removeDeliveryBox === 'function') {
          removeDeliveryBox(box.id);
        }
      }
    }
  };

  const handleProductClick = (e: any, productId: string) => {
    e.stopPropagation();
    if (isHandFull) return;

    setLocalItems(prev => {
      const newItems = prev.map(item => {
        if (item.productId === productId && item.quantity > 0) {
          return { ...item, quantity: item.quantity - 1 };
        }
        return item;
      });
      return newItems;
    });

    onPickUpProduct(productId);
  };

  const renderProductsInside = () => {
    const meshes: React.ReactNode[] = [];
    let posIndex = 0;

    localItems.forEach((item) => {
      for (let i = 0; i < item.quantity; i++) {
        const col = posIndex % 4;
        const row = Math.floor(posIndex / 4);
        const posX = -0.15 + col * 0.1;
        const posZ = -0.12 + row * 0.12;

        meshes.push(
          <mesh 
            key={`${item.productId}-${i}`} 
            position={[posX, 0.05, posZ]} 
            onClick={(e) => handleProductClick(e, item.productId)}
          >
            <boxGeometry args={[0.08, 0.1, 0.08]} />
            <meshStandardMaterial color={getProductColor(item.productId)} roughness={0.5} />
          </mesh>
        );
        posIndex++;
      }
    });
    return meshes;
  };

  return (
    <group position={box.position}>
      <group onClick={handleBodyClick}>
        <mesh position={[0, t / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[boxWidth, t, boxDepth]} />
          <meshStandardMaterial color="#b47b48" roughness={0.8} />
        </mesh>
        <mesh position={[-boxWidth / 2 + t / 2, boxHeight / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[t, boxHeight, boxDepth]} />
          <meshStandardMaterial color="#b47b48" roughness={0.8} />
        </mesh>
        <mesh position={[boxWidth / 2 - t / 2, boxHeight / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[t, boxHeight, boxDepth]} />
          <meshStandardMaterial color="#b47b48" roughness={0.8} />
        </mesh>
        <mesh position={[0, boxHeight / 2, -boxDepth / 2 + t / 2]} castShadow receiveShadow>
          <boxGeometry args={[boxWidth, boxHeight, t]} />
          <meshStandardMaterial color="#b47b48" roughness={0.8} />
        </mesh>
        <mesh position={[0, boxHeight / 2, boxDepth / 2 - t / 2]} castShadow receiveShadow>
          <boxGeometry args={[boxWidth, boxHeight, t]} />
          <meshStandardMaterial color="#b47b48" roughness={0.8} />
        </mesh>
      </group>

      {isOpened && (
        <group position={[0, t, 0]}>
          {renderProductsInside()}
        </group>
      )}

      <group 
        position={[0, boxHeight, -boxDepth / 2]} 
        rotation-x={isOpened ? -Math.PI * 0.65 : 0}
      >
        <mesh position={[0, t / 2, boxDepth / 2]} onClick={handleLidClick}>
          <boxGeometry args={[boxWidth, t, boxDepth]} />
          <meshStandardMaterial color="#9a6435" roughness={0.7} />
        </mesh>
        
        {!isOpened && (
          <mesh position={[0, t / 2 + 0.005, boxDepth / 2]} onClick={handleLidClick}>
            <boxGeometry args={[boxWidth + 0.01, 0.002, 0.1]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.3} />
          </mesh>
        )}
      </group>
    </group>
  );
};

const HeldBox3D: React.FC<{ onDrop: () => void }> = ({ onDrop }) => {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      const dir = new THREE.Vector3(0, -0.25, -0.7).applyQuaternion(camera.quaternion);
      groupRef.current.position.copy(camera.position).add(dir);
      groupRef.current.rotation.copy(camera.rotation);
    }
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key.toLowerCase() === 'e') onDrop(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDrop]);

  return (
    <group ref={groupRef}>
      <mesh castShadow>
        <boxGeometry args={[0.38, 0.3, 0.38]} />
        <meshStandardMaterial color="#b47b48" roughness={0.8} />
      </mesh>
    </group>
  );
};

const HeldProduct3D: React.FC<{ productId: string, onDrop: () => void }> = ({ productId, onDrop }) => {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      const dir = new THREE.Vector3(0, -0.2, -0.5).applyQuaternion(camera.quaternion);
      groupRef.current.position.copy(camera.position).add(dir);
      groupRef.current.rotation.copy(camera.rotation);
    }
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { 
      if (e.key.toLowerCase() === 'e') onDrop(); 
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDrop]);

  return (
    <group ref={groupRef}>
      <mesh castShadow>
        <boxGeometry args={[0.1, 0.15, 0.1]} />
        <meshStandardMaterial color={getProductColor(productId)} roughness={0.5} />
      </mesh>
    </group>
  );
};

export const DeliveryBoxes: React.FC = () => {
  const store = useSimulationStore() as any;
  const deliveryBoxes: DeliveryBoxType[] = store.deliveryBoxes || [];
  const removeDeliveryBox = store.removeDeliveryBox;
  const addDeliveryBox = store.addDeliveryBox;

  const [carryingBox, setCarryingBox] = useState<DeliveryBoxType | null>(null);
  const [carryingProduct, setCarryingProduct] = useState<string | null>(null);
  
  const { camera } = useThree();

  const handlePickUpBox = (boxToPick: DeliveryBoxType) => {
    if (carryingBox || carryingProduct) return;
    setCarryingBox(boxToPick);
    if (typeof removeDeliveryBox === 'function') {
      removeDeliveryBox(boxToPick.id);
    }
  };

  const handlePickUpProduct = (productId: string) => {
    if (carryingBox || carryingProduct) return;
    setCarryingProduct(productId);
  };

  const handleDropBox = () => {
    if (!carryingBox) return;
    const cameraDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    cameraDir.y = 0;
    cameraDir.normalize();

    const dropPosition: [number, number, number] = [
      camera.position.x + cameraDir.x * 1.3,
      0.0,
      camera.position.z + cameraDir.z * 1.3,
    ];

    if (typeof addDeliveryBox === 'function') {
      addDeliveryBox({
        ...carryingBox,
        id: `box_dropped_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        position: dropPosition,
      });
    }
    setCarryingBox(null);
  };

  const handleDropProduct = () => {
    setCarryingProduct(null);
  };

  return (
    <group>
      {deliveryBoxes.map((box: DeliveryBoxType) => (
        <DeliveryBoxItem 
          key={box.id} 
          box={box} 
          onPickUpBox={handlePickUpBox} 
          onPickUpProduct={handlePickUpProduct}
          isHandFull={carryingBox !== null || carryingProduct !== null}
        />
      ))}
      {carryingBox && <HeldBox3D onDrop={handleDropBox} />}
      {carryingProduct && <HeldProduct3D productId={carryingProduct} onDrop={handleDropProduct} />}
    </group>
  );
};

export default DeliveryBoxes;