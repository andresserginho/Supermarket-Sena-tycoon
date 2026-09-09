// src/presentation/components/ShelfProduct.tsx
import React, { useMemo, useRef, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import type { Product } from '../../domain/entities/Product';
import { ProductInteractable } from '../../domain/entities/ProductInteractable';
import { useRegisterInteractable } from '../hooks/useRegisterInteractable';
import { useSimulationStore } from '../../application/store/useSimulationStore';
import { MODELOS_3D } from '../../application/data/modelosUrls';

interface ShelfProductProps {
  product: Product;
  position: [number, number, number];
}

export const ShelfProduct: React.FC<ShelfProductProps> = ({ product, position }) => {
  const meshRef = useRef<any>(null);
  const [pickedUp, setPickedUp] = useState(false);
  const addToCart = useSimulationStore((s) => s.addToCart);

  // Cargamos el modelo del estante individual o el producto si aplica
  const { scene } = useGLTF(MODELOS_3D.estanteIndividual);

  const interactable = useMemo(
    () =>
      new ProductInteractable(product, (p) => {
        addToCart(p);
        setPickedUp(true);
      }),
    [product, addToCart]
  );

  useRegisterInteractable(meshRef, interactable, `Recoger ${product.name}`);

  if (pickedUp) return null;

  return (
    <group ref={meshRef} position={position}>
      <primitive object={scene.clone()} scale={[1, 1, 1]} />
    </group>
  );
};