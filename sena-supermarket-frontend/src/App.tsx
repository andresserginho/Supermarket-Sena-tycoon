import { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { GameLauncherRole as GameLauncher, type GameUser } from './presentation/components/GameLauncherRole';
import { PlayerNeedsHUD } from './presentation/components/PlayerNeedsHUD';
import { SupermarketScene } from './presentation/scenes/SupermarketScene';

export default function App() {
  const [currentUser, setCurrentUser] = useState<GameUser | null>(() => {
    const saved = localStorage.getItem('sena_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loadingGame, setLoadingGame] = useState(false);

  useEffect(() => {
    if (!currentUser?.roomCode) return;
    const checkRoom = async () => {
      try {
        const response = await fetch(`https://85q1z69w-3000.use2.devtunnels.ms/rooms/${currentUser.roomCode}/status`);
        const room = await response.json() as { active: boolean };
        if (!room.active) {
          localStorage.removeItem('sena_current_user');
          setCurrentUser(null);
        }
      } catch {
        // Mantiene la sesión si el backend se reinicia temporalmente.
      }
    };
    const interval = window.setInterval(checkRoom, 3000);
    return () => window.clearInterval(interval);
  }, [currentUser]);

  // 1. Mostrar pantalla de inicio si no hay usuario registrado
  if (!currentUser) {
    return <GameLauncher onStartGame={(user) => { setCurrentUser(user); setLoadingGame(true); }} />;
  }

  // 2. Cargar HUD e interfaz junto con la escena del supermercado
  return (
    <div className="w-screen h-screen relative bg-slate-950 overflow-hidden select-none">
      <PlayerNeedsHUD />
      <SupermarketScene />
      {loadingGame && <GameResourceLoading onReady={() => setLoadingGame(false)} />}
    </div>
  );
}

function GameResourceLoading({ onReady }: { onReady: () => void }) {
  const { progress } = useProgress();

  useEffect(() => {
    if (progress >= 100) onReady();
  }, [progress, onReady]);

  return <div className="game-loading-screen"><div className="game-loading-panel"><span>CARGANDO RECURSOS...</span><strong>{Math.round(progress)}%</strong><div className="game-loading-bar"><i style={{ width: `${Math.max(progress, 3)}%` }} /></div><small>Preparando tu supermercado, personajes y objetos...</small></div></div>;
}