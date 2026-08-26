import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PlayerProgress { id: string; name: string; ficha: string; level: number; money: number; sales: number; health: number; hunger: number; thirst: number; debt: number; }
interface RoomSession { instructorId: string; roomCode: string; }
interface Props { session?: RoomSession; onBack?: () => void; }
const API_URL = import.meta.env.VITE_API_URL ?? 'https://85q1z69w-3000.use2.devtunnels.ms';

export function InstructorProgressPanel({ session: providedSession, onBack }: Props) {
  const [session, setSession] = useState<RoomSession | null>(() => {
    if (providedSession) return providedSession;
    const stored = localStorage.getItem('sena_instructor_room');
    return stored ? JSON.parse(stored) as RoomSession : null;
  });
  const [players, setPlayers] = useState<PlayerProgress[]>([]);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshRequest, setRefreshRequest] = useState(0);

  useEffect(() => {
    if (providedSession) return;
    const loadSession = () => {
      const stored = localStorage.getItem('sena_instructor_room');
      setSession(stored ? JSON.parse(stored) as RoomSession : null);
    };
    loadSession();
  }, [providedSession]);

  useEffect(() => {
    const refreshSession = () => {
      const stored = localStorage.getItem('sena_instructor_room');
      setSession(stored ? JSON.parse(stored) as RoomSession : null);
    };
    window.addEventListener('sena-room-created', refreshSession);
    return () => window.removeEventListener('sena-room-created', refreshSession);
  }, []);

  useEffect(() => {
    if (!session || !visible) return;
    const loadProgress = async () => {
      setRefreshing(true);
      try {
        const response = await fetch(`${API_URL}/progress/room/${session.roomCode}?instructorId=${encodeURIComponent(session.instructorId)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message ?? 'No se pudo cargar el progreso.');
        setPlayers(data.players ?? []); setError(''); setLastUpdated(new Date());
      } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'No se pudo cargar el progreso.'); }
      finally { setRefreshing(false); }
    };
    loadProgress();
  }, [session, visible, refreshRequest]);

  if (!session) return null;
  if (!visible) return <button className="progress-room-launcher" type="button" onClick={() => setVisible(true)}>VER PROGRESO DE JUGADORES</button>;

  return <div className="progress-overlay"><div className="progress-panel"><div className="progress-header"><div><p className="progress-room-label">Sala {session.roomCode}</p><h2>Progreso de jugadores</h2><small className="progress-updated">{refreshing ? 'Actualizando...' : lastUpdated ? `Actualizado a las ${lastUpdated.toLocaleTimeString()}` : 'Esperando datos...'}</small></div><div className="progress-actions"><button className="progress-refresh" type="button" onClick={() => setRefreshRequest(value => value + 1)} disabled={refreshing}><RefreshCw size={16} className={refreshing ? 'is-spinning' : ''} /> {refreshing ? 'ACTUALIZANDO...' : 'ACTUALIZAR AHORA'}</button><button className="progress-back" type="button" onClick={onBack ?? (() => setVisible(false))}>VOLVER AL CÓDIGO DE SALA</button></div></div>{error && <p className="progress-error">{error}</p>}<div className="progress-table-wrap"><table className="progress-table"><thead><tr><th>Jugador</th><th>Ficha</th><th>Nivel</th><th>Dinero</th><th>Ventas</th><th>Vida</th><th>Hambre</th><th>Sed</th><th>Deuda</th></tr></thead><tbody>{players.length ? players.map((player) => <tr key={player.id}><td>{player.name}</td><td>{player.ficha}</td><td>{player.level}</td><td>$ {player.money.toLocaleString()}</td><td>{player.sales}</td><td>{player.health}%</td><td>{player.hunger}%</td><td>{player.thirst}%</td><td>$ {player.debt.toLocaleString()}</td></tr>) : <tr><td colSpan={9}>Aún no hay aprendices conectados.</td></tr>}</tbody></table></div></div></div>;
}
