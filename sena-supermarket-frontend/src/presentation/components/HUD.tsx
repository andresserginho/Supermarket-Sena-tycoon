import React, { useState } from 'react';
import { useSimulationStore } from '../../application/store/useSimulationStore';

export const HUD: React.FC = () => {
  const { money, totalSalesCount, playerState } = useSimulationStore();
  const [isPhoneOpen, setIsPhoneOpen] = useState(false);

  return (
    <div className="fixed inset-0 pointer-events-none select-none z-50 flex flex-col justify-between p-4">
      
      {/* Arriba a la Izquierda: Banner del Aprendiz SENA */}
      <div className="pointer-events-auto bg-slate-900/80 backdrop-blur-md border border-slate-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg w-fit">
        Aprendiz: <span className="text-emerald-400">Carlos Pérez</span>
      </div>

      {/* Centro Inferior: Guía de Controles */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md border border-slate-700 text-slate-300 text-xs px-6 py-2 rounded-full shadow-lg">
        Usa <span className="text-white font-bold">WASD</span> o <span className="text-white font-bold">Flechas</span> para caminar | Clic en los objetos para interactuar
      </div>

      {/* Abajo a la Izquierda: Necesidades del Jugador */}
      <div className="pointer-events-auto bg-slate-900/80 backdrop-blur-md border border-slate-700 text-white p-3 rounded-xl shadow-lg w-56 text-xs space-y-1">
        <div>⚡ Energía: <span className="font-bold">{playerState.health}%</span></div>
        <div>🍗 Hambre: <span className="font-bold">{playerState.hunger}%</span></div>
        <div>💧 Sed: <span className="font-bold">{playerState.thirst}%</span></div>
        <div className="text-[10px] text-slate-400 pt-1">Sube al segundo piso para descansar</div>
      </div>

      {/* Abajo a la Derecha: Estado Financiero Compacto y Botón de Celular GTA V */}
      <div className="absolute bottom-4 right-4 flex flex-col items-end gap-3 pointer-events-auto">
        
        {/* Panel compacto de Dinero y Ventas */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 px-4 py-2 rounded-xl shadow-lg text-right min-w-[120px]">
          <div className="text-emerald-400 font-bold text-base">$ {money.toLocaleString()}</div>
          <div className="text-slate-400 text-xs">Ventas: {totalSalesCount}</div>
        </div>

        {/* Botón para Abrir el Celular */}
        <button
          onClick={() => setIsPhoneOpen(!isPhoneOpen)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-2xl shadow-2xl transition-transform active:scale-95 border border-emerald-400 flex items-center justify-center"
          title="Abrir Smartphone"
        >
          📱
        </button>
      </div>

      {/* INTERFAZ DEL CELULAR ESTILO GTA V */}
      {isPhoneOpen && (
        <div className="absolute bottom-20 right-6 w-64 h-[450px] bg-slate-950 border-4 border-slate-700 rounded-[36px] shadow-2xl pointer-events-auto overflow-hidden flex flex-col animate-in slide-in-from-bottom-5">
          
          {/* Barra Superior del Celular */}
          <div className="bg-slate-900 px-4 py-2 flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800">
            <span>SENA Mobile</span>
            <span>12:00 PM</span>
            <span>🔋 100%</span>
          </div>

          {/* Pantalla Principal del Celular */}
          <div className="flex-1 p-4 bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col justify-between">
            <div>
              <h3 className="text-white text-xs font-bold mb-3 text-center">Menú Principal</h3>
              <div className="grid grid-cols-3 gap-3">
                <button className="flex flex-col items-center gap-1 bg-slate-800 p-2 rounded-xl text-[10px] text-white hover:bg-slate-700">
                  <span className="text-lg">🖥️</span>
                  <span>POS Caja</span>
                </button>
                <button className="flex flex-col items-center gap-1 bg-slate-800 p-2 rounded-xl text-[10px] text-white hover:bg-slate-700">
                  <span className="text-lg">📦</span>
                  <span>Stock</span>
                </button>
                <button className="flex flex-col items-center gap-1 bg-slate-800 p-2 rounded-xl text-[10px] text-white hover:bg-slate-700">
                  <span className="text-lg">📊</span>
                  <span>Finanzas</span>
                </button>
              </div>
            </div>

            {/* Botón Home del Celular */}
            <button
              onClick={() => setIsPhoneOpen(false)}
              className="w-10 h-10 bg-slate-800 border border-slate-600 rounded-full mx-auto flex items-center justify-center text-slate-300 text-xs hover:bg-slate-700"
            >
              ⚪
            </button>
          </div>
        </div>
      )}
    </div>
  );
};