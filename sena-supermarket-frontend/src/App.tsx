import { useState } from 'react';
import { GameLauncher } from './presentation/components/GameLauncher';
import { PlayerNeedsHUD } from './presentation/components/PlayerNeedsHUD';
import { SupermarketScene } from './presentation/scenes/SupermarketScene';

export default function App() {
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    ficha: string;
    gender: 'male' | 'female';
  } | null>(null);

  // 1. Mostrar pantalla de inicio si no hay usuario registrado
  if (!currentUser) {
    return <GameLauncher onStartGame={(user) => setCurrentUser(user)} />;
  }

  // 2. Cargar HUD e interfaz junto con la escena del supermercado
  return (
    <div className="w-screen h-screen relative bg-slate-950 overflow-hidden select-none">
      <PlayerNeedsHUD />
      <SupermarketScene />
    </div>
  );
}