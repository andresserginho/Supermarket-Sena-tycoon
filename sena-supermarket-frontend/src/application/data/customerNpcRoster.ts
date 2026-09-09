// src/application/data/customerNpcRoster.ts

export interface NpcRosterEntry {
  id: string;
  path: [number, number, number][];
  speed?: number;
  scale?: number;
  modelUrl?: string;
}

export const CUSTOMER_NPC_ROSTER: NpcRosterEntry[] = [
  {
    id: 'npc-001',
    speed: 1.0,
    path: [
      [-14.9, 0, 30],
      [-14.9, 0, 5],
      [-5, 0, 5],
      [-5, 0, 0],
    ],
  },
  {
    id: 'npc-002',
    speed: 1.2,
    path: [
      [-14.9, 0, -30],
      [-14.9, 0, 2],
      [-3, 0, 2],
      [-3, 0, -2],
    ],
  },
  {
    id: 'npc-003',
    speed: 1.5,
    path: [
      [-14.9, 0, 45],
      [-14.9, 0, 5],
      [-8, 0, 5],
      [-8, 0, 1],
    ],
  },
  {
    id: 'npc-004',
    speed: 1.3,
    path: [
      [-14.9, 1, -45],
      [-14.9, 1, 0],
      [-2, 1, 0],
    ],
  },
];