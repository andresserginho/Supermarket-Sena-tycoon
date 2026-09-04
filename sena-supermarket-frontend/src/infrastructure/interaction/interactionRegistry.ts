// src/infrastructure/interaction/interactionRegistry.ts
import * as THREE from 'three';
import type { IInteractable } from '../../domain/interfaces/IInteractable';

interface RegisteredEntry {
  object3D: THREE.Object3D;
  interactable: IInteractable;
  label: string; // texto que se muestra en el crosshair, ej: "Hablar", "Recoger caja"
}

// Mapa vivo fuera de React — se lee cada frame en el raycast, un estado de React
// aquí sería demasiado lento (re-render 60 veces por segundo).
const registry = new Map<string, RegisteredEntry>();

export function registerInteractable(entry: RegisteredEntry) {
  registry.set(entry.interactable.id, entry);
}

export function unregisterInteractable(id: string) {
  registry.delete(id);
}

export function getAllInteractableObjects(): THREE.Object3D[] {
  return Array.from(registry.values()).map((e) => e.object3D);
}

export function getEntryByObject(object: THREE.Object3D): RegisteredEntry | undefined {
  // Sube por los padres por si el rayo golpea un mesh hijo (ej: una etiqueta dentro de la caja)
  let current: THREE.Object3D | null = object;
  while (current) {
    for (const entry of registry.values()) {
      if (entry.object3D === current) return entry;
    }
    current = current.parent;
  }
  return undefined;
}