import { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { GameLauncherRole as GameLauncher, type GameUser } from './presentation/components/GameLauncherRole';
import { PlayerNeedsHUD } from './presentation/components/PlayerNeedsHUD';
import { SupermarketScene } from './presentation/scenes/SupermarketScene';
import { useSimulationStore } from './application/store/useSimulationStore';import { getProgress, saveProgress } from './infrastructure/api/progressApi';

// Cada cuántos milisegundos se guarda automáticamente el progreso mientras se juega.
const AUTOSAVE_INTERVAL_MS = 15000;

export default function App() {
  const [currentUser, setCurrentUser] = useState<GameUser | null>(() => {
    const saved = localStorage.getItem('sena_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loadingGame, setLoadingGame] = useState(false);
  const [progressReady, setProgressReady] = useState(false);

  // Verifica cada cierto tiempo si la sala sigue activa; si el instructor la cierra,
  // expulsa al aprendiz al login (guardando su progreso justo antes de salir).
  useEffect(() => {
    if (!currentUser?.roomCode) return;
    const checkRoom = async () => {
      try {
        const response = await fetch(`http://localhost:3000/rooms/${currentUser.roomCode}/status`);
        const room = await response.json() as { active: boolean };
        if (!room.active) {
          await saveProgress(currentUser.id, useSimulationStore.getState().serializeProgress());
          localStorage.removeItem('sena_current_user');
          setCurrentUser(null);
          setProgressReady(false);
        }
      } catch {
        // Mantiene la sesión si el backend se reinicia temporalmente.
      }
    };
    const interval = window.setInterval(checkRoom, 3000);
    return () => window.clearInterval(interval);
  }, [currentUser]);

  // Al iniciar sesión, carga el progreso guardado del aprendiz (nivel, dinero, salud, etc.)
  // y lo aplica al store antes de dejar entrar al juego.
  useEffect(() => {
    if (!currentUser?.id) return;
    let cancelled = false;
    setProgressReady(false);
    getProgress(currentUser.id)
      .then((progress) => {
        if (cancelled) return;
        useSimulationStore.getState().hydrateProgress(progress);
        setProgressReady(true);
      })
      .catch(() => {
        // Si no hay progreso guardado (aprendiz nuevo) o falla la carga,
        // se sigue con los valores por defecto del store.
        if (!cancelled) setProgressReady(true);
      });
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  // Guarda el progreso automáticamente mientras el aprendiz está jugando,
  // y también justo antes de cerrar/recargar la pestaña.
  useEffect(() => {
    if (!currentUser?.id || !progressReady) return;

    const persist = () => {
      saveProgress(currentUser.id, useSimulationStore.getState().serializeProgress());
    };

    const interval = window.setInterval(persist, AUTOSAVE_INTERVAL_MS);
    window.addEventListener('beforeunload', persist);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('beforeunload', persist);
      persist(); // último guardado al salir de la escena (cambio de usuario, etc.)
    };
  }, [currentUser?.id, progressReady]);

  // 1. Mostrar pantalla de inicio si no hay usuario registrado
  if (!currentUser) {
    return <GameLauncher onStartGame={(user) => { setCurrentUser(user); setLoadingGame(true); }} />;
  }

  // 2. Esperar a que el progreso guardado se cargue antes de mostrar la escena,
  //    para no arrancar el juego con valores por defecto y luego "saltar" al nivel real.
  if (!progressReady) {
    return (
      <div className="game-loading-screen">
        <div className="game-loading-panel">
          <span>CARGANDO TU PROGRESO...</span>
        </div>
      </div>
    );
  }

  // 3. Cargar HUD e interfaz junto con la escena del supermercado
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