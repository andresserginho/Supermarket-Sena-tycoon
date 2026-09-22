import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { CUSTOMER_NPC_ROSTER, type NpcRosterEntry } from '../../application/data/customerNpcRoster';
import { MODELOS_3D } from '../../application/data/modelosUrls';
import { npcObstacleColliders, shelfColliders, worldColliders } from '../utils/colliders';

const NPC_HEIGHT = 1.7;

function isBlocked(position: THREE.Vector3) {
  const body = new THREE.Box3(
    new THREE.Vector3(position.x - 0.22, position.y, position.z - 0.22),
    new THREE.Vector3(position.x + 0.22, position.y + NPC_HEIGHT, position.z + 0.22),
  );
  return [...worldColliders, ...npcObstacleColliders, ...shelfColliders].some((collider) =>
    collider.max.y > 0.3 && body.intersectsBox(collider)
  );
}

const Pedestrian: React.FC<{ data: NpcRosterEntry; index: number }> = ({ data, index }) => {
  const { scene } = useGLTF(data.modelUrl || MODELOS_3D.npcH);
  const clone = useMemo(() => scene.clone(true), [scene]);
  const groupRef = useRef<THREE.Group>(null);
  const waypointIndex = useRef(1);
  const position = useMemo(() => new THREE.Vector3(...data.path[0]), [data.path]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group || data.path.length < 2) return;

    const target = new THREE.Vector3(...data.path[waypointIndex.current]);
    target.y = data.path[0][1];
    const distance = position.distanceTo(target);
    if (distance < 0.2) {
      waypointIndex.current = (waypointIndex.current + 1) % data.path.length;
      return;
    }

    const step = Math.min(distance, (data.speed || 1) * delta);
    const next = position.clone().lerp(target, step / distance);
    if (isBlocked(next)) return;

    group.position.copy(next);
    group.rotation.y = Math.atan2(target.x - position.x, target.z - position.z);
    position.copy(next);
  });

  return (
    <group ref={groupRef} position={data.path[0]} scale={data.scale || 1} userData={{ pedestrian: true, index }}>
      <primitive object={clone} />
    </group>
  );
};

export const PedestrianTraffic: React.FC = () => (
  <group>
    {CUSTOMER_NPC_ROSTER.map((npc, index) => <Pedestrian key={npc.id} data={npc} index={index} />)}
  </group>
);

useGLTF.preload(MODELOS_3D.npcH);