import { useEffect, useState } from 'react';

interface PlayerProgress { id: string; name: string; ficha: string; level: number; money: number; sales: number; health: number; hunger: number; thirst: number; debt: number; }
interface RoomSession { instructorId: string; roomCode: string; }
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function InstructorProgressPanel() {
  const [session, setSession] = useState<RoomSession | null>(null);
  const [players, setPlayers] = useState<PlayerProgress[]>([]);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSession = () => {
      const stored = localStorage.getItem('sena_instructor_room');
      setSession(stored ? JSON.parse(stored) as RoomSession : null);
    };
    loadSession();
    window.addEventListener('storage', loadSession);
    return () => window.removeEventListener('storage', loadSession);
  }, []);

  useEffect(() => {
    if (!visible || !session) return;
    const loadProgress = async () => {
      try {
        const response = await fetch(`${API_URL}/progress/room/${session.roomCode}?instructorId=${encodeURIComponent(session.instructorId)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message ?? 'No se pudo cargar el progreso.');
        setPlayers(data.players ?? []); setError('');
      } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'No se pudo cargar el progreso.'); }
    };
    loadProgress();
    const interval = window.setInterval(loadProgress, 5000);
    return () => window.clearInterval(interval);
  }, [visible, session]);

  if (!session) return null;
  if (!visible) return <button className="fixed bottom-6 right-6 z-[65] rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white shadow-xl hover:bg-emerald-500" onClick={() => setVisible(true)}>VER PROGRESO DE JUGADORES</button>;

  return <div className="fixed inset-0 z-[80] overflow-auto bg-slate-950 p-6 text-white"><div className="mx-auto max-w-6xl"><div className="mb-6 flex items-center justify-between gap-4"><div><p className="text-sm uppercase tracking-widest text-emerald-400">Sala {session.roomCode}</p><h2 className="text-3xl font-bold">Progreso de jugadores</h2></div><button className="rounded-xl border border-emerald-500 px-4 py-2 font-semibold text-emerald-300 hover:bg-emerald-950" onClick={() => setVisible(false)}>VOLVER AL CÓDIGO DE SALA</button></div>{error && <p className="mb-4 rounded-lg bg-red-950 p-3 text-red-200">{error}</p>}<div className="overflow-x-auto rounded-xl border border-slate-700"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-900 text-emerald-300"><tr><th className="p-3">Jugador</th><th className="p-3">Ficha</th><th className="p-3">Nivel</th><th className="p-3">Dinero</th><th className="p-3">Ventas</th><th className="p-3">Vida</th><th className="p-3">Hambre</th><th className="p-3">Sed</th><th className="p-3">Deuda</th></tr></thead><tbody>{players.length ? players.map((player) => <tr className="border-t border-slate-800" key={player.id}><td className="p-3 font-semibold">{player.name}</td><td className="p-3">{player.ficha}</td><td className="p-3">{player.level}</td><td className="p-3">$ {player.money.toLocaleString()}</td><td className="p-3">{player.sales}</td><td className="p-3">{player.health}%</td><td className="p-3">{player.hunger}%</td><td className="p-3">{player.thirst}%</td><td className="p-3">$ {player.debt.toLocaleString()}</td></tr>) : <tr><td className="p-6 text-center text-slate-400" colSpan={9}>Aún no hay aprendices conectados.</td></tr>}</tbody></table></div></div></div>;
}
