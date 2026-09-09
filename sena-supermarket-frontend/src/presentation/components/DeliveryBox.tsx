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

interface LooseProduct {
  id: string;
  productId: string;
  position: [number, number, number];
  supportY?: number;
}

interface DeliveryBoxItemProps {
  box: DeliveryBoxType;
  onPickUpBox: (box: DeliveryBoxType) => void;
  onPickUpProduct: (productId: string) => void;
  isHandFull: boolean;
}

const getProductColor = (id: string) => {
  const lower = id.toLowerCase();
  if (lower.includes('leche')) return '#ffffff';
  if (lower.includes('pan')) return '#fcd34d';
  if (lower.includes('arroz')) return '#e2e8f0';
  if (lower.includes('aceite')) return '#fef08a';
  if (lower.includes('huevos')) return '#fef3c7';
  return '#a8a29e';
};

export const DeliveryBoxItem: React.FC<DeliveryBoxItemProps> = ({ box, onPickUpBox, onPickUpProduct, isHandFull }) => {
  if (!box || !box.items) return null;

  const store = useSimulationStore() as any;
  const removeDeliveryBox = store.removeDeliveryBox;

  const [isOpened, setIsOpened] = useState(false);
  const [localItems, setLocalItems] = useState<DeliveryItem[]>(box.items);

  const groupRef = useRef<THREE.Group>(null);
  const velocityY = useRef(0);
  const isGrounded = useRef(false);
  const colliderBoxRef = useRef<THREE.Box3>(new THREE.Box3());

  const boxWidth = 0.46;
  const boxHeight = 0.32;
  const boxDepth = 0.46;
  const t = 0.025; // Espesor del cartón
  const floorY = 0.081;

  // Actualiza los ítems locales cuando la caja cambie en el store
  useEffect(() => {
    setLocalItems(box.items || []);
  }, [box.items]);

  // Si la posición de la caja cambia (por ejemplo, al soltarla), reactiva la gravedad
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(...box.position);
      isGrounded.current = false;
      velocityY.current = 0;
    }
  }, [box.position]);

  // Registro del colisionador en el sistema global
  useEffect(() => {
    worldColliders.push(colliderBoxRef.current);
    return () => {
      const index = worldColliders.indexOf(colliderBoxRef.current);
      if (index > -1) worldColliders.splice(index, 1);
    };
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const x = groupRef.current.position.x;
    const y = groupRef.current.position.y;
    const z = groupRef.current.position.z;

    // Actualización del colisionador (pivote en Y=0)
    colliderBoxRef.current.min.set(x - boxWidth / 2, y, z - boxDepth / 2);
    colliderBoxRef.current.max.set(x + boxWidth / 2, y + boxHeight, z + boxDepth / 2);

    // Lógica de Apilamiento Automático: Cierra la caja inferior si detecta un peso/caja encima
    if (isOpened) {
      for (const collider of worldColliders) {
        if (collider === colliderBoxRef.current) continue;

        const isAbove = collider.min.y >= y + boxHeight - 0.04 && collider.min.y <= y + boxHeight + 0.3;
        const isXOverlap = collider.min.x < x + boxWidth / 2 && collider.max.x > x - boxWidth / 2;
        const isZOverlap = collider.min.z < z + boxDepth / 2 && collider.max.z > z - boxDepth / 2;

        if (isAbove && isXOverlap && isZOverlap) {
          setIsOpened(false);
          break;
        }
      }
    }

    // Gravedad dinámica con soporte para andenes y superficies elevadas
    if (isGrounded.current) return;

    velocityY.current -= 18 * delta;
    let newY = y + velocityY.current * delta;

    const testBox = new THREE.Box3(
      new THREE.Vector3(x - boxWidth / 2, newY, z - boxDepth / 2),
      new THREE.Vector3(x + boxWidth / 2, newY + boxHeight, z + boxDepth / 2)
    );

    let hitCollider = false;
    let highestSurfaceY = floorY;

    for (const collider of worldColliders) {
      if (collider === colliderBoxRef.current) continue;

      const overlapsHorizontally =
        testBox.min.x < collider.max.x && testBox.max.x > collider.min.x &&
        testBox.min.z < collider.max.z && testBox.max.z > collider.min.z;
      const crossesSurface = newY <= collider.max.y && y >= collider.max.y;

      if (velocityY.current <= 0 && overlapsHorizontally && crossesSurface && collider.max.y > highestSurfaceY) {
        highestSurfaceY = collider.max.y;
        hitCollider = true;
      }
    }

    if (hitCollider) {
      newY = highestSurfaceY + 0.001;
      velocityY.current = 0;
      isGrounded.current = true;
    } else if (newY <= floorY) {
      newY = floorY;
      velocityY.current = 0;
      isGrounded.current = true;
    }

    groupRef.current.position.y = newY;
  });

  // Evento exclusivo para la tapa
  const handleLidClick = (e: any) => {
    e.stopPropagation();
    setIsOpened((prev) => !prev);
  };

  // Evento exclusivo para las paredes laterales (Agarrar caja)
  const handleSidePickUp = (e: any) => {
    e.stopPropagation();
    if (isHandFull) return;

    const currentPos: [number, number, number] = groupRef.current
      ? [groupRef.current.position.x, groupRef.current.position.y, groupRef.current.position.z]
      : box.position;

    onPickUpBox({ ...box, items: localItems, position: currentPos });
  };

  // Evento exclusivo para tomar productos de dentro de la caja
  const handleProductClick = (e: any, productId: string) => {
    e.stopPropagation();
    if (isHandFull) return;

    const newItems = localItems.map((item) => {
      if (item.productId === productId && item.quantity > 0) {
        return { ...item, quantity: item.quantity - 1 };
      }
      return item;
    });

    const totalRemaining = newItems.reduce((acc, item) => acc + Math.max(0, item.quantity), 0);

    setLocalItems(newItems);
    onPickUpProduct(productId);

    // Condición estricta de eliminación: ÚNICAMENTE si no quedan productos
    if (totalRemaining === 0 && typeof removeDeliveryBox === 'function') {
      removeDeliveryBox(box.id);
    }
  };

  return (
    <group ref={groupRef} position={box.position}>
      {/* Malla del fondo de la caja (sin disparar recolección al hacer clic en el piso de la caja) */}
      <mesh position={[0, t / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[boxWidth, t, boxDepth]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.8} />
      </mesh>

      {/* Relleno interior sólido de la base */}
      <mesh position={[0, t + 0.003, 0]} receiveShadow>
        <boxGeometry args={[boxWidth - t * 2, 0.01, boxDepth - t * 2]} />
        <meshStandardMaterial color="#6b421e" roughness={0.9} />
      </mesh>

      {/* Paredes laterales (ÚNICO lugar que activa el agarre de la caja) */}
      <group>
        <mesh
          position={[-boxWidth / 2 + t / 2, boxHeight / 2, 0]}
          onPointerDown={handleSidePickUp}
          onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { document.body.style.cursor = 'auto'; }}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[t, boxHeight, boxDepth]} />
          <meshStandardMaterial color="#b47b48" roughness={0.8} />
        </mesh>

        <mesh
          position={[boxWidth / 2 - t / 2, boxHeight / 2, 0]}
          onPointerDown={handleSidePickUp}
          onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { document.body.style.cursor = 'auto'; }}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[t, boxHeight, boxDepth]} />
          <meshStandardMaterial color="#b47b48" roughness={0.8} />
        </mesh>

        <mesh
          position={[0, boxHeight / 2, -boxDepth / 2 + t / 2]}
          onPointerDown={handleSidePickUp}
          onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { document.body.style.cursor = 'auto'; }}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[boxWidth, boxHeight, t]} />
          <meshStandardMaterial color="#b47b48" roughness={0.8} />
        </mesh>

        <mesh
          position={[0, boxHeight / 2, boxDepth / 2 - t / 2]}
          onPointerDown={handleSidePickUp}
          onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { document.body.style.cursor = 'auto'; }}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[boxWidth, boxHeight, t]} />
          <meshStandardMaterial color="#b47b48" roughness={0.8} />
        </mesh>
      </group>

      {/* Productos interactivos contenidos en el interior */}
      {isOpened && (
        <group position={[0, t + 0.01, 0]}>
          {localItems.map((item, index) => {
            if (item.quantity <= 0) return null;
            const meshes = [];
            for (let i = 0; i < item.quantity; i++) {
              const col = (index * 3 + i) % 3;
              const row = Math.floor((index * 3 + i) / 3);
              meshes.push(
                <mesh
                  key={`${item.productId}-${i}`}
                  position={[-0.11 + col * 0.11, 0.065, -0.11 + row * 0.11]}
                  onPointerDown={(e) => handleProductClick(e, item.productId)}
                  onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
                  onPointerOut={() => { document.body.style.cursor = 'auto'; }}
                  castShadow
                >
                  <boxGeometry args={[0.09, 0.11, 0.09]} />
                  <meshStandardMaterial color={getProductColor(item.productId)} roughness={0.4} />
                </mesh>
              );
            }
            return meshes;
          })}
        </group>
      )}

      {/* Tapa Superior (Solamente abre/cierra al hacer clic) */}
      <group position={[0, boxHeight, -boxDepth / 2]} rotation-x={isOpened ? -Math.PI * 0.7 : 0}>
        <mesh
          position={[0, t / 2, boxDepth / 2]}
          onPointerDown={handleLidClick}
          onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { document.body.style.cursor = 'auto'; }}
          castShadow
        >
          <boxGeometry args={[boxWidth, t, boxDepth]} />
          <meshStandardMaterial color="#9a6435" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
};

const LooseProduct: React.FC<{ item: LooseProduct }> = ({ item }) => {
  const pickUpLooseProduct = useSimulationStore((state) => state.pickUpLooseProduct);
  const meshRef = useRef<THREE.Mesh>(null);
  const velocityY = useRef(0);
  const isGrounded = useRef(false);

  useEffect(() => {
    if (meshRef.current) meshRef.current.position.set(...item.position);
    isGrounded.current = item.supportY !== undefined;
    velocityY.current = 0;
  }, [item.id]);

  useFrame((_, delta) => {
    if (!meshRef.current || isGrounded.current) return;

    const x = meshRef.current.position.x;
    const y = meshRef.current.position.y;
    const z = meshRef.current.position.z;
    const halfSize = 0.08;
    velocityY.current -= 18 * delta;
    const nextY = y + velocityY.current * delta;
    let landingY = 0.081 + 0.1;

    for (const collider of worldColliders) {
      const horizontalOverlap =
        x - halfSize < collider.max.x && x + halfSize > collider.min.x &&
        z - halfSize < collider.max.z && z + halfSize > collider.min.z;
      const crossesTop = nextY - 0.1 <= collider.max.y && y - 0.1 >= collider.max.y;
      if (horizontalOverlap && crossesTop && collider.max.y + 0.1 > landingY) {
        landingY = collider.max.y + 0.1;
      }
    }

    if (item.supportY !== undefined) landingY = Math.max(landingY, item.supportY);
    if (nextY <= landingY) {
      meshRef.current.position.y = landingY;
      velocityY.current = 0;
      isGrounded.current = true;
    } else {
      meshRef.current.position.y = nextY;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={item.position}
      castShadow
      onPointerDown={(event) => {
        event.stopPropagation();
        pickUpLooseProduct(item);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      <boxGeometry args={[0.16, 0.2, 0.16]} />
      <meshStandardMaterial color={getProductColor(item.productId)} roughness={0.4} />
    </mesh>
  );
};
const HeldDeliveryItem: React.FC<{ box: DeliveryBoxType | null; product: { productId: string } | null }> = ({ box, product }) => {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const boxWidth = 0.46;
  const boxHeight = 0.32;
  const boxDepth = 0.46;
  const thickness = 0.025;

  useFrame(() => {
    if (!groupRef.current || (!box && !product)) return;

    // Mantiene el objeto centrado delante de la cámara, no a un lado.
    const heldOffset = new THREE.Vector3(0, -0.35, -0.85);
    const targetPosition = camera.localToWorld(heldOffset);
    const parent = groupRef.current.parent;
    if (parent) parent.worldToLocal(targetPosition);
    groupRef.current.position.copy(targetPosition);

    const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    cameraDirection.y = 0;
    if (cameraDirection.lengthSq() > 0.001) {
      cameraDirection.normalize();
      groupRef.current.rotation.y = Math.atan2(cameraDirection.x, cameraDirection.z) + Math.PI;
    }
  });

  if (!box && !product) return null;

  return (
    <group ref={groupRef} renderOrder={10}>
      {box ? (
        <>
          <mesh position={[0, thickness / 2, 0]} castShadow>
            <boxGeometry args={[boxWidth, thickness, boxDepth]} />
            <meshStandardMaterial color="#8b5a2b" roughness={0.8} />
          </mesh>
          <mesh position={[-boxWidth / 2 + thickness / 2, boxHeight / 2, 0]} castShadow>
            <boxGeometry args={[thickness, boxHeight, boxDepth]} />
            <meshStandardMaterial color="#b47b48" roughness={0.8} />
          </mesh>
          <mesh position={[boxWidth / 2 - thickness / 2, boxHeight / 2, 0]} castShadow>
            <boxGeometry args={[thickness, boxHeight, boxDepth]} />
            <meshStandardMaterial color="#b47b48" roughness={0.8} />
          </mesh>
          <mesh position={[0, boxHeight / 2, -boxDepth / 2 + thickness / 2]} castShadow>
            <boxGeometry args={[boxWidth, boxHeight, thickness]} />
            <meshStandardMaterial color="#b47b48" roughness={0.8} />
          </mesh>
          <mesh position={[0, boxHeight / 2, boxDepth / 2 - thickness / 2]} castShadow>
            <boxGeometry args={[boxWidth, boxHeight, thickness]} />
            <meshStandardMaterial color="#b47b48" roughness={0.8} />
          </mesh>
          <mesh position={[0, boxHeight + thickness / 2, 0]} castShadow>
            <boxGeometry args={[boxWidth, thickness, boxDepth]} />
            <meshStandardMaterial color="#9a6435" roughness={0.7} />
          </mesh>
        </>
      ) : (
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.16, 0.2, 0.16]} />
          <meshStandardMaterial color={getProductColor(product?.productId || '')} roughness={0.4} />
        </mesh>
      )}
    </group>
  );
};

export const DeliveryBoxes: React.FC = () => {
  const store = useSimulationStore() as any;
  const { camera } = useThree();

  const deliveryBoxes = store.deliveryBoxes || [];
  const looseProducts: LooseProduct[] = store.looseProducts || [];
  const pickUpBox = store.pickUpBox || (() => {});
  const pickUpProduct = store.pickUpProduct || (() => {});
  const isHandFull = store.isHandFull || false;

  const heldBox = store.heldBox || store.heldItem;
  const heldProduct = store.heldProduct;
  const dropBox = store.dropBox || store.placeHeldBox;
  const dropProduct = store.dropProduct || store.dropHeldItem;

  useEffect(() => {
    const currentBoxes = useSimulationStore.getState().deliveryBoxes || [];
    const migratedBoxes = currentBoxes.map((box, index) => {
      const wasSpawnedOnOldDock = box.position[0] === -8.3 || box.position[0] === 1.2 || box.position[0] === -4 || box.position[0] === -6.2;
      if (!wasSpawnedOnOldDock) return box;

      const col = index % 3;
      const row = Math.floor(index / 3);
      return {
        ...box,
        position: [-7.4 + col * 0.55, 0.081 + (Math.floor(row / 2) * 0.32), 0.8 + (row % 2) * 0.55] as [number, number, number],
      };
    });

    if (migratedBoxes.some((box, index) => box !== currentBoxes[index])) {
      useSimulationStore.setState({ deliveryBoxes: migratedBoxes });
    }
  }, []);

  // Acción de soltar con la Tecla 'E'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyE' || e.key.toLowerCase() === 'e') {
        if ((heldBox || heldProduct) && (typeof dropBox === 'function' || typeof dropProduct === 'function')) {
          const dir = new THREE.Vector3();
          camera.getWorldDirection(dir);
          dir.y = 0;
          dir.normalize();

          const dropPos: [number, number, number] = [
            camera.position.x + dir.x * 1.1,
            Math.max(0.08, camera.position.y - 0.9),
            camera.position.z + dir.z * 1.1,
          ];

          if (heldBox && typeof dropBox === 'function') dropBox(dropPos);
          if (heldProduct && typeof dropProduct === 'function') dropProduct(dropPos);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [heldBox, heldProduct, dropBox, dropProduct, camera]);

  return (
    <>
      <HeldDeliveryItem box={heldBox || null} product={heldProduct || null} />
      {looseProducts.map((item) => <LooseProduct key={item.id} item={item} />)}
      {deliveryBoxes.map((box: DeliveryBoxType) => (
        <DeliveryBoxItem
          key={box.id}
          box={box}
          onPickUpBox={pickUpBox}
          onPickUpProduct={pickUpProduct}
          isHandFull={isHandFull}
        />
      ))}
    </>
  );
};

export const DeliveryBox = DeliveryBoxItem;