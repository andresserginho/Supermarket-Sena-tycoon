export const API_URL = import.meta.env.VITE_API_URL ?? 'https://85q1z69w-3000.use2.devtunnels.ms';

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

export async function recoverHealth(apprenticeId: string): Promise<{ health: number; money: number; charged: number; debt: number }> {
  const response = await fetch(`${API_URL}/progress/${apprenticeId}/health-recovery`, { method: 'POST' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message ?? 'No se pudo recuperar la vida.');
  return data;
}
