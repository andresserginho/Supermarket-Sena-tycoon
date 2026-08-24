const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export interface ProgressPayload {
  level: number;
  money: number;
  sales: number;
  health: number;
  hunger: number;
  thirst: number;
  expansions: string[];
}

export async function getProgress(apprenticeId: string): Promise<ProgressPayload> {
  const response = await fetch(`${API_URL}/progress/${apprenticeId}`);
  if (!response.ok) throw new Error('No se pudo cargar el progreso guardado.');
  const data = await response.json();
  return {
    level: Number(data.level),
    money: Number(data.money),
    sales: Number(data.sales),
    health: Number(data.health),
    hunger: Number(data.hunger),
    thirst: Number(data.thirst),
    expansions: Array.isArray(data.expansions) ? data.expansions : [],
  };
}

export async function saveProgress(apprenticeId: string, payload: ProgressPayload): Promise<void> {
  await fetch(`${API_URL}/progress/${apprenticeId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
