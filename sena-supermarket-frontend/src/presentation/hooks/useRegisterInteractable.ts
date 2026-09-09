// src/presentation/hooks/useRegisterInteractable.ts
import { useEffect } from 'react';
import * as THREE from 'three';
import type { IInteractable } from '../../domain/interfaces/IInteractable';
import { registerInteractable, unregisterInteractable } from '../../infrastructure/interaction/interactionRegistry';

export function useRegisterInteractable<T extends THREE.Object3D>(
  objectRef: React.RefObject<T | null>,
  interactable: IInteractable,
  label: string
) {
  useEffect(() => {
    if (!objectRef.current) return;
    registerInteractable({ object3D: objectRef.current, interactable, label });
    return () => unregisterInteractable(interactable.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objectRef.current, interactable.id, label]);
}