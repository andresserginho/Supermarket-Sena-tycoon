// src/presentation/components/InteractionSystem.tsx
// Montar UNA VEZ dentro del <Canvas>, junto a FirstPersonControls.
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getAllInteractableObjects, getEntryByObject } from '../../infrastructure/interaction/interactionRegistry';
import { useInteractionStore } from '../../application/store/useInteractionStore';

const INTERACTION_DISTANCE = 3; // metros — ajústalo a tu escala del supermercado

export const InteractionSystem: React.FC = () => {
  const { camera } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const setCurrentTarget = useInteractionStore((s) => s.setCurrentTarget);

  // Guardamos el id actual en un ref (no en React state) para leerlo dentro
  // del listener de teclado sin tener que recrear el listener cada frame.
  const currentTargetIdRef = useRef<string | null>(null);

  useFrame(() => {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    raycaster.current.set(camera.position, direction);
    raycaster.current.far = INTERACTION_DISTANCE;

    const candidates = getAllInteractableObjects();
    const hits = raycaster.current.intersectObjects(candidates, true);

    if (hits.length > 0) {
      const entry = getEntryByObject(hits[0].object);
      if (entry && entry.interactable.canInteract({})) {
        currentTargetIdRef.current = entry.interactable.id;
        setCurrentTarget(entry.interactable.id, entry.label);
        return;
      }
    }

    if (currentTargetIdRef.current !== null) {
      currentTargetIdRef.current = null;
      setCurrentTarget(null, null);
    }
  });

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code !== 'KeyE') return;
      const id = currentTargetIdRef.current;
      if (!id) return;

      // Buscamos la entrada de nuevo por id recorriendo los objetos registrados
      const target = getAllInteractableObjects()
        .map((obj) => getEntryByObject(obj))
        .find((e) => e?.interactable.id === id);

      target?.interactable.interact({});
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return null; // este componente no renderiza nada visual, solo lógica
};
