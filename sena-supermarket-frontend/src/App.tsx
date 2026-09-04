import { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { GameLauncherRole as GameLauncher } from './presentation/components/GameLauncherRole';
import type { GameUser } from './presentation/components/GameLauncherRole';
import { InstructorProgressPanel } from './presentation/components/InstructorProgressPanel';
import { SupermarketScene } from './presentation/scenes/SupermarketScene';
import { useSimulationStore } from './application/store/useSimulationStore';
import { API_URL, getProgress, saveProgress } from './infrastructure/api/progressApi';

// Cada cuántos milisegundos se guarda automáticamente el progreso mientras se juega.
const AUTOSAVE_INTERVAL_MS = 15000;
const MIN_PROGRESS_LOADING_MS = 5000;

export default function App() {
  const [currentUser, setCurrentUser] = useState<GameUser | null>(() => {
    const saved = localStorage.getItem('sena_current_user');
    if (!saved) return null;
    const user = JSON.parse(saved) as GameUser;
    if (user.role === 'admin') {
      localStorage.removeItem('sena_current_user');
      return null;
    }
    return user;
  });
  const [loadingGame, setLoadingGame] = useState(false);
  const [progressReady, setProgressReady] = useState(false);
  const [minLoadingElapsed, setMinLoadingElapsed] = useState(false);
  const [loadingPercent, setLoadingPercent] = useState(0);

  // Verifica cada cierto tiempo si la sala sigue activa; si el instructor la cierra,
  // expulsa al aprendiz al login (guardando su progreso justo antes de salir).
  useEffect(() => {
    if (!currentUser?.roomCode) return;
    const checkRoom = async () => {
      try {
        const response = await fetch(`${API_URL}/rooms/${currentUser.roomCode}/status`);
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
    setMinLoadingElapsed(false);
    setLoadingPercent(0);
    const loadingStartedAt = Date.now();
    const loadingProgressInterval = window.setInterval(() => {
      const elapsed = Date.now() - loadingStartedAt;
      setLoadingPercent(Math.min(100, (elapsed / MIN_PROGRESS_LOADING_MS) * 100));
      if (elapsed >= MIN_PROGRESS_LOADING_MS) window.clearInterval(loadingProgressInterval);
    }, 50);
    const minLoadingTimer = window.setTimeout(() => setMinLoadingElapsed(true), MIN_PROGRESS_LOADING_MS);
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
    return () => {
      cancelled = true;
      window.clearInterval(loadingProgressInterval);
      window.clearTimeout(minLoadingTimer);
    };
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
    return <><GameLauncher onStartGame={(user) => { setCurrentUser(user); setLoadingGame(true); }} /><InstructorProgressPanel /></>;
  }

  // 2. Esperar a que el progreso guardado se cargue antes de mostrar la escena,
  //    para no arrancar el juego con valores por defecto y luego "saltar" al nivel real.
  if (!progressReady || !minLoadingElapsed) return <GameLoadingOverlay mode="progress" progress={loadingPercent} />;

  // 3. Cargar HUD e interfaz junto con la escena del supermercado
  return (
    <div className="w-screen h-screen relative bg-slate-950 overflow-hidden select-none">
      <SupermarketScene />
      {loadingGame && <GameResourceLoading onReady={() => setLoadingGame(false)} />}
    </div>
  );
}

function GameResourceLoading({ onReady }: { onReady: () => void }) {
  const { active, item, loaded, total, progress } = useProgress();

  useEffect(() => {
    if (progress >= 100 || (total > 0 && loaded >= total)) {
      onReady();
      return;
    }

    if (!active && total === 0) {
      const timeout = window.setTimeout(onReady, 700);
      return () => window.clearTimeout(timeout);
    }
  }, [active, loaded, progress, total, onReady]);

  return <GameLoadingOverlay mode="resources" item={item} loaded={loaded} total={total} progress={progress} />;
}

function GameLoadingOverlay({ mode, item = 'Conectando con tu supermercado', loaded = 0, total = 0, progress = 16 }: { mode: 'progress' | 'resources'; item?: string; loaded?: number; total?: number; progress?: number }) {
  const percentage = mode === 'progress' ? Math.round(progress) : Math.min(100, Math.max(8, Math.round(progress)));
  const steps = mode === 'progress'
    ? ['Validando aprendiz', 'Recuperando progreso', 'Preparando partida']
    : ['Escenario', 'Edificios y tiendas', 'Tráfico y entorno'];
  const activeStep = mode === 'progress' ? 1 : percentage > 70 ? 2 : percentage > 30 ? 1 : 0;

  return (
    <div className="game-loading-screen" role="status" aria-live="polite">
      <div className="game-loading-panel">
        <div className="game-loading-kicker"><span className="game-loading-pulse" /> SUPERMARKET SENA <span>•</span> SESIÓN DE APRENDIZAJE</div>
        <div className="game-loading-heading"><div><span className="game-loading-label">{mode === 'progress' ? 'ENTRANDO AL METAVERSO' : 'CARGANDO TU MUNDO'}</span><h2>{mode === 'progress' ? 'Recuperando tu partida' : 'Construyendo el supermercado'}</h2></div><strong>{percentage}%</strong></div>
        <div className="game-loading-bar" aria-label={`Carga al ${percentage}%`}><i style={{ width: `${percentage}%` }} /></div>
        <div className="game-loading-meta"><span>{mode === 'progress' ? 'Sincronizando tus avances...' : item}</span><span>{mode === 'resources' && total > 0 ? `${loaded}/${total} recursos` : 'En proceso'}</span></div>
        <div className="game-loading-steps">{steps.map((step, index) => <span className={index <= activeStep ? 'is-active' : ''} key={step}><i />{step}</span>)}</div>
        <small>Un momento. Tu experiencia estará lista enseguida.</small>
      </div>
    </div>
  );
}