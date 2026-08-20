import React, { useState, useEffect } from 'react';
import { useProgress } from '@react-three/drei';

interface GameLauncherProps {
  onStartGame: (user: { name: string; ficha: string; gender: 'male' | 'female' }) => void;
}

const TIPS = [
  "Mejora la satisfacción de tus clientes para aumentar tus ganancias.",
  "Mantén los estantes siempre surtidos para no perder ventas.",
  "Organiza tus cajeros eficientemente para evitar filas largas.",
  "Reinvierte tus ganancias en expandir las secciones de tu supermercado.",
  "Supervisa la demanda de productos en tiempo real para ajustar precios."
];

export const GameLauncher: React.FC<GameLauncherProps> = ({ onStartGame }) => {
  const { progress } = useProgress();
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [activeTabMobile, setActiveTabMobile] = useState<'new' | 'existing'>('new');

  // Formulario Nuevo Jugador
  const [newName, setNewName] = useState('Pepito Perez Rojas');
  const [newFicha, setNewFicha] = useState('3235613');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [newError, setNewError] = useState('');

  // Formulario Jugador Existente
  const [existName, setExistName] = useState('');
  const [existFicha, setExistFicha] = useState('');
  const [existError, setExistError] = useState('');

  // Carrusel de Consejos (RF-05)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Validaciones de Cliente
  const isNameValid = (name: string) => name.trim().length >= 3 && name.trim().length <= 25;
  const isFichaValid = (ficha: string) => /^\d{6,8}$/.test(ficha.trim());
  const isLoaded = progress >= 100 || progress === 0; // Permitir inicio cuando la descarga esté completa

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setNewError('');

    if (!isNameValid(newName)) {
      setNewError('El nombre debe tener entre 3 y 25 caracteres.');
      return;
    }
    if (!isFichaValid(newFicha)) {
      setNewError('La ficha debe ser un número entero de 6 a 8 dígitos.');
      return;
    }

    const userData = { name: newName.trim(), ficha: newFicha.trim(), gender };
    localStorage.setItem(`sena_user_${newFicha.trim()}`, JSON.stringify(userData));
    localStorage.setItem('sena_current_user', JSON.stringify(userData));
    onStartGame(userData);
  };

  const handleLoginUser = (e: React.FormEvent) => {
    e.preventDefault();
    setExistError('');

    if (!isFichaValid(existFicha)) {
      setExistError('Número de ficha inválido.');
      return;
    }

    const saved = localStorage.getItem(`sena_user_${existFicha.trim()}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.name.toLowerCase() === existName.trim().toLowerCase()) {
        localStorage.setItem('sena_current_user', JSON.stringify(parsed));
        onStartGame(parsed);
        return;
      }
    }
    setExistError('Credenciales incorrectas o jugador no registrado.');
  };

  return (
    <div className="fixed inset-0 z-50 min-h-screen w-full bg-[#030a06] text-white flex flex-col justify-between p-3 sm:p-5 md:p-6 overflow-y-auto font-sans box-border select-none">
      
      {/* PESTAÑAS PARA MÓVIL (RNF-01) */}
      <div className="flex md:hidden bg-[#06150c] p-1 rounded-xl border border-emerald-900/50 mb-3 shrink-0">
        <button
          onClick={() => setActiveTabMobile('new')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${activeTabMobile === 'new' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
        >
          NUEVO JUGADOR
        </button>
        <button
          onClick={() => setActiveTabMobile('existing')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${activeTabMobile === 'existing' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
        >
          JUGADOR EXISTENTE
        </button>
      </div>

      {/* CONTENEDOR PRINCIPAL TRES COLUMNAS (RF-01 & RNF-01) */}
      <div className="max-w-[1380px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 my-auto py-2">
        
        {/* COLUMNA 1: BRANDING & PRECARGADOR (4 COLS) */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          <div>
            {/* Header SENA */}
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <svg width="28" height="28" className="text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-wider text-white leading-none">
                  SUPERMARKET
                </h1>
                <h2 className="text-3xl font-black tracking-widest text-emerald-400 leading-none">
                  SENA
                </h2>
              </div>
            </div>

            <p className="text-xs text-emerald-400 tracking-[0.25em] font-extrabold border-b border-emerald-900/60 pb-2 mb-2">
              — TYCOON —
            </p>
            <p className="text-xs text-slate-300 font-medium">
              Construye. Administra. Expande. Tu imperio empieza aqui.
            </p>

            {/* Banner Tienda */}
            <div className="mt-4 relative rounded-2xl overflow-hidden border border-emerald-800/40 bg-slate-950 h-44 flex items-end p-4">
              <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=800&auto=format&fit=crop")' }}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#030a06] via-transparent to-transparent"></div>
              <div className="relative z-10">
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/40 uppercase">SENA SUPERMARKET</span>
                <p className="text-sm font-extrabold text-white mt-1">Supermercado Interactivo VR</p>
              </div>
            </div>
          </div>

          {/* Precargador de Recursos (RF-03, RF-04, RF-05) */}
          <div className="bg-[#06150c]/90 p-4 rounded-2xl border border-emerald-900/60 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-200">
              <span className="uppercase tracking-wider">CARGANDO RECURSOS...</span>
              <span className="text-emerald-400 font-mono font-extrabold">{Math.round(progress)}%</span>
            </div>
            <p className="text-[10px] text-slate-400">Edificios, texturas, modelos 3D, personajes, audio...</p>
            
            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-300 shadow-[0_0_12px_#10b981]" 
                style={{ width: `${Math.max(progress, 5)}%` }} 
              />
            </div>

            <p className="text-[11px] text-emerald-400/90 italic pt-1 min-h-[32px] flex items-center">
              Consejo: {TIPS[currentTipIndex]}
            </p>
          </div>
        </div>

        {/* COLUMNA 2: NUEVO JUGADOR (4 COLS) */}
        <div className={`lg:col-span-4 bg-[#06150c]/80 p-6 rounded-2xl border border-emerald-500/40 flex-col justify-between backdrop-blur-md ${activeTabMobile === 'new' ? 'flex' : 'hidden md:flex'}`}>
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 mb-1">
              <svg width="22" height="22" className="shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
              <h2 className="text-lg font-bold tracking-wide uppercase">NUEVO JUGADOR</h2>
            </div>
            <p className="text-xs text-slate-400 mb-5">Crea tu perfil y comienza tu aventura</p>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1.5">NOMBRE DEL JUGADOR</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-500">
                    <svg width="16" height="16" className="shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </span>
                  <input 
                    type="text" 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-[#020704] border border-emerald-900/80 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:border-emerald-500 outline-none text-white font-medium transition"
                    placeholder="Pepito Perez Rojas"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1.5">NÚMERO DE FICHA</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-500">
                    <svg width="16" height="16" className="shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" /></svg>
                  </span>
                  <input 
                    type="text" 
                    value={newFicha} 
                    onChange={(e) => setNewFicha(e.target.value)}
                    className="w-full bg-[#020704] border border-emerald-900/80 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:border-emerald-500 outline-none text-white font-medium transition"
                    placeholder="3235613"
                    required
                  />
                </div>
              </div>

              {/* Selección de Avatar (RF-02) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-2">SELECCIONA TU AVATAR</label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Avatar Masculino */}
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`relative p-3 rounded-2xl border flex flex-col items-center transition ${gender === 'male' ? 'border-emerald-500 bg-emerald-950/60 text-white ring-1 ring-emerald-500' : 'border-slate-800 bg-[#020704] text-slate-400 hover:border-slate-700'}`}
                  >
                    {gender === 'male' && (
                      <span className="absolute top-2 right-2 bg-emerald-500 text-black rounded-full p-0.5 shadow-md">
                        <svg width="12" height="12" className="shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </span>
                    )}
                    <div className="w-20 h-20 rounded-xl bg-slate-900 overflow-hidden border border-emerald-500/30 mb-2 flex items-center justify-center">
                      <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80" alt="Masculino" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] font-extrabold tracking-wider uppercase">AVATAR MASCULINO</span>
                  </button>

                  {/* Avatar Femenino */}
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`relative p-3 rounded-2xl border flex flex-col items-center transition ${gender === 'female' ? 'border-emerald-500 bg-emerald-950/60 text-white ring-1 ring-emerald-500' : 'border-slate-800 bg-[#020704] text-slate-400 hover:border-slate-700'}`}
                  >
                    {gender === 'female' && (
                      <span className="absolute top-2 right-2 bg-emerald-500 text-black rounded-full p-0.5 shadow-md">
                        <svg width="12" height="12" className="shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </span>
                    )}
                    <div className="w-20 h-20 rounded-xl bg-slate-900 overflow-hidden border border-emerald-500/30 mb-2 flex items-center justify-center">
                      <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80" alt="Femenino" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] font-extrabold tracking-wider uppercase">AVATAR FEMENINO</span>
                  </button>
                </div>
              </div>

              {newError && <p className="text-xs text-red-400 font-bold">{newError}</p>}

              {/* Botón Iniciar Juego (RF-06) */}
              <button 
                type="submit" 
                disabled={!isLoaded}
                className={`w-full py-3.5 font-black rounded-xl transition text-white text-sm tracking-wider flex items-center justify-center space-x-2 mt-2 shadow-lg shadow-emerald-950/80 ${isLoaded ? 'bg-emerald-600 hover:bg-emerald-500 cursor-pointer' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
              >
                <span>INICIAR JUEGO</span>
                <svg width="18" height="18" className="shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
              </button>
            </form>
          </div>
        </div>

        {/* COLUMNA 3: JUGADOR EXISTENTE & INFO (4 COLS) */}
        <div className={`lg:col-span-4 bg-[#06150c]/80 p-6 rounded-2xl border border-emerald-900/50 flex-col justify-between backdrop-blur-md ${activeTabMobile === 'existing' ? 'flex' : 'hidden md:flex'}`}>
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 mb-1">
              <svg width="22" height="22" className="shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
              <h2 className="text-lg font-bold tracking-wide uppercase">JUGADOR EXISTENTE</h2>
            </div>
            <p className="text-xs text-slate-400 mb-5">Inicia sesión para continuar tu progreso</p>

            <form onSubmit={handleLoginUser} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1.5">NOMBRE DEL JUGADOR</label>
                <input 
                  type="text" 
                  value={existName} 
                  onChange={(e) => setExistName(e.target.value)}
                  className="w-full bg-[#020704] border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:border-emerald-500 outline-none text-white font-medium transition"
                  placeholder="Ingresa tu nombre"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1.5">NÚMERO DE FICHA</label>
                <input 
                  type="text" 
                  value={existFicha} 
                  onChange={(e) => setExistFicha(e.target.value)}
                  className="w-full bg-[#020704] border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:border-emerald-500 outline-none text-white font-medium transition"
                  placeholder="Ingresa tu número de ficha"
                  required
                />
              </div>

              {existError && <p className="text-xs text-red-400 font-bold">{existError}</p>}

              <button 
                type="submit" 
                disabled={!isLoaded}
                className={`w-full py-3.5 font-black rounded-xl transition text-white text-sm tracking-wider flex items-center justify-center space-x-2 mt-2 ${isLoaded ? 'bg-emerald-800 hover:bg-emerald-700 cursor-pointer' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
              >
                <span>INICIAR SESIÓN</span>
                <svg width="18" height="18" className="shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
              </button>
            </form>
          </div>

          {/* Sección de Instrucciones "¿CÓMO FUNCIONA?" */}
          <div className="mt-6 border-t border-emerald-950/80 pt-4 space-y-3">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">¿CÓMO FUNCIONA?</p>
            
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start space-x-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
                  <svg width="16" height="16" className="shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                </div>
                <div>
                  <p className="font-bold text-white">Nuevo Jugador</p>
                  <p className="text-[11px] text-slate-400">Crea tu perfil, elige tu avatar y comienza tu imperio.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
                  <svg width="16" height="16" className="shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                </div>
                <div>
                  <p className="font-bold text-white">Jugador Existente</p>
                  <p className="text-[11px] text-slate-400">Ingresa tu nombre y ficha para continuar tu progreso.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
                  <svg width="16" height="16" className="shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 001-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                </div>
                <div>
                  <p className="font-bold text-white">Tu Progreso</p>
                  <p className="text-[11px] text-slate-400">Tu información y progreso se guardan de forma segura en la nube.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* FOOTER INFORMATIVO INFERIOR */}
      <div className="max-w-[1380px] w-full mx-auto border-t border-emerald-950/80 pt-3 mt-2 grid grid-cols-2 md:grid-cols-5 gap-3 text-left text-[11px] text-slate-400">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center shrink-0 text-emerald-400">🛒</div>
          <div>
            <p className="font-bold text-slate-200 uppercase">SIMULACIÓN REALISTA</p>
            <p className="text-[10px] text-slate-500">Gestiona cada detalle de tu supermercade.</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center shrink-0 text-emerald-400">🏪</div>
          <div>
            <p className="font-bold text-slate-200 uppercase">EXPANDE TU NEGOCIO</p>
            <p className="text-[10px] text-slate-500">Mejora, amplia y convierte tu tienda en un imperio.</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center shrink-0 text-emerald-400">👥</div>
          <div>
            <p className="font-bold text-slate-200 uppercase">CLIENTES INTELIGENTES</p>
            <p className="text-[10px] text-slate-500">NPCs con comportamientos únicos y dinámicos.</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center shrink-0 text-emerald-400">📈</div>
          <div>
            <p className="font-bold text-slate-200 uppercase">ECONOMÍA DINÁMICA</p>
            <p className="text-[10px] text-slate-500">Precios, demanda y eventos que afectan tu negocio.</p>
          </div>
        </div>

        <div className="col-span-2 md:col-span-1 flex items-center justify-end space-x-2 border-t md:border-t-0 border-emerald-950 pt-2 md:pt-0">
          <div className="text-right">
            <span className="font-black text-emerald-400 tracking-widest text-sm leading-none block">SENA</span>
            <span className="text-[8px] text-slate-500 tracking-tighter uppercase block">MÁS TRABAJO • MÁS OPORTUNIDADES • MÁS FUTURO</span>
          </div>
        </div>
      </div>

    </div>
  );
};