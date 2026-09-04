import * as THREE from 'three';

// Almacena las cajas delimitadoras de colisión extraídas de las mallas reales
export const worldColliders: THREE.Box3[] = [];

export function addColliderFromMesh(mesh: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(mesh);
  worldColliders.push(box);
}

export function clearColliders() {
  worldColliders.length = 0;
}