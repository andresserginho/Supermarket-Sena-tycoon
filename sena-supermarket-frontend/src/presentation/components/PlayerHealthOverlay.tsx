// src/presentation/components/PlayerHealthOverlay.tsx
import React, { useState } from 'react';
import { useSimulationStore } from '../../application/store/useSimulationStore';
import { recoverHealth } from '../../infrastructure/api/progressApi';

interface PlayerHealthOverlayProps {
  hitDamage: number | null;
}

export const PlayerHealthOverlay: React.FC<PlayerHealthOverlayProps> = ({ hitDamage }) => {
  const { playerState } = useSimulationStore();
  const [recovering, setRecovering] = useState(false);
  const [error, setError] = useState('');

  const isDead = playerState.health <= 0;

  const handleRecover = async () => {
    try {
      setRecovering(true);
      setError('');
      const updatedUser = await recoverHealth('1');
      useSimulationStore.setState({
        playerState: {
          ...useSimulationStore.getState().playerState,
          health: updatedUser.health,
        },
      });
    } catch (err: any) {
      setError(err.message || 'Error al recuperar salud');
    } finally {
      setRecovering(false);
    }
  };

  return (
    <>
      {/* Alerta flotante de daño recibido */}
      {hitDamage !== null && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-red-600/90 text-white px-5 py-2 rounded-lg font-bold shadow-lg z-50 pointer-events-none">
          ¡CUIDADO! -{hitDamage} HP
        </div>
      )}

      {/* Pantalla modal cuando el jugador pierde toda la salud */}
      {isDead && (
        <div className="fixed inset-0 bg-black/85 flex flex-col items-center justify-center text-white z-[2000] p-4">
          <h1 className="text-4xl font-extrabold text-red-500 mb-2">ESTÁS SIN SALUD</h1>
          <p className="text-slate-400 mb-6">Has sufrido demasiado daño en la calle.</p>
          
          {error && <p className="text-red-400 mb-4">{error}</p>}

          <button
            onClick={handleRecover}
            disabled={recovering}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-xl transition-all"
          >
            {recovering ? 'Recuperando...' : 'Curarse / Reiniciar Salud'}
          </button>
        </div>
      )}
    </>
  );
};