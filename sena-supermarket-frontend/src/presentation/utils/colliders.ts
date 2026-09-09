import * as THREE from 'three';

// Almacena las cajas delimitadoras de colisión extraídas de las mallas reales
export const worldColliders: THREE.Box3[] = [];
export const supermarketFloorColliders: THREE.Box3[] = [];

export function addColliderFromMesh(mesh: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(mesh);
  worldColliders.push(box);
}

export function addGroundCollider(mesh: THREE.Object3D, thickness = 0.04) {
  const box = new THREE.Box3().setFromObject(mesh);
  const surfaceY = box.max.y;
  box.min.y = surfaceY - thickness;
  box.max.y = surfaceY;
  worldColliders.push(box);
}

export function clearColliders() {
  worldColliders.length = 0;
}

export function addBoxCollider(min: [number, number, number], max: [number, number, number]) {
  worldColliders.push(new THREE.Box3(new THREE.Vector3(...min), new THREE.Vector3(...max)));
}

export function addObjectColliders(object: THREE.Object3D) {
  const colliders: THREE.Box3[] = [];
  object.updateMatrixWorld(true);
  object.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const box = new THREE.Box3().setFromObject(child);
    if (box.isEmpty()) return;
    colliders.push(box);
    worldColliders.push(box);
  });
  return colliders;
}