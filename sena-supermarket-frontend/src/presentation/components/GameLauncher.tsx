/// <reference types="vite/client" />
import { useState } from 'react';
import { useProgress } from '@react-three/drei';
import { ArrowRight, KeyRound, LogIn, UserPlus, Users } from 'lucide-react';

export interface GameUser { name: string; ficha: string; gender: 'masculino' | 'femenino'; roomCode: string; sessionId: string; }
interface GameLauncherProps { onStartGame: (user: GameUser) => void; }
type Mode = 'apprentice' | 'instructor';
const API_URL = import.meta.env.VITE_API_URL ?? 'https://85q1z69w-3000.use2.devtunnels.ms';

async function request<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message ?? 'No se pudo completar la solicitud.');
  return data as T;
}

export function GameLauncher({ onStartGame }: GameLauncherProps) {
  const { progress } = useProgress();
  const [mode, setMode] = useState<Mode>('apprentice');
  const [isRegister, setIsRegister] = useState(true);
  const [name, setName] = useState(''); const [ficha, setFicha] = useState('');
  const [gender, setGender] = useState<'masculino' | 'femenino'>('masculino'); const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); const [roomCode, setRoomCode] = useState('');
  const [roomName, setRoomName] = useState('Sala de entrenamiento'); const [generatedCode, setGeneratedCode] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);

  // --- BYPASS TOTAL ACTIVO (SIN BACKEND) ---
  const submitApprentice = async (event: React.FormEvent) => {
    event.preventDefault(); 
    
    const fakeUser = {
      name: name || "Andrés Prueba",
      ficha: ficha || "3235613",
      gender: gender,
      roomCode: roomCode || "LOCAL",
      sessionId: "session-123"
    };
    
    localStorage.setItem('sena_current_user', JSON.stringify(fakeUser));
    onStartGame(fakeUser); // Te lanza directo al metaverso
  };

  const submitInstructor = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const instructorKey = isRegister ? window.prompt('Escribe la clave privada de registro de instructor') ?? '' : '';
      const instructor = isRegister ? await request<{ id: string }>('/auth/instructor/register', { name, email, password, instructorKey }) : await request<{ id: string }>('/auth/instructor/login', { email, password });
      const room = await request<{ code: string }>('/rooms', { instructorId: instructor.id, name: roomName }); setGeneratedCode(room.code);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'No se pudo crear la sala.'); } finally { setBusy(false); }
  };

  const loaded = progress >= 100 || progress === 0;
  return <main className="launcher">
    <section className="launcher__brand"><div className="brand-mark">🛒</div><p className="eyebrow">SENA PRESENTA</p><h1>SUPERMARKET<br /><strong>SENA</strong></h1><p className="brand-subtitle">TYCOON</p><p className="brand-copy">Construye. Administra. Expande.<br />Tu imperio empieza aquí.</p><div className="store-photo" /><div className="loading"><span>CARGANDO RECURSOS...</span><b>{Math.round(progress)}%</b><div><i style={{ width: `${Math.max(progress, 5)}%` }} /></div><small>Edificios, texturas, modelos 3D, personajes, audio...</small></div></section>
    <section className="access-panel"><div className="role-tabs"><button type="button" className={mode === 'apprentice' ? 'active' : ''} onClick={() => setMode('apprentice')}><Users size={18} /> APRENDIZ</button><button type="button" className={mode === 'instructor' ? 'active' : ''} onClick={() => setMode('instructor')}><KeyRound size={18} /> INSTRUCTOR</button></div>
      {generatedCode ? <div className="room-result"><span>CÓDIGO DE SALA</span><strong>{generatedCode}</strong><p>Comparte este código con todos los aprendices. Cada uno tendrá su propia sala.</p><button className="primary" onClick={() => navigator.clipboard?.writeText(generatedCode)}>COPIAR CÓDIGO</button></div> : <><div className="panel-heading"><div className="heading-icon">{mode === 'apprentice' ? <Users /> : <KeyRound />}</div><div><h2>{mode === 'apprentice' ? (isRegister ? 'NUEVO APRENDIZ' : 'APRENDIZ EXISTENTE') : (isRegister ? 'REGISTRAR INSTRUCTOR' : 'LOGIN INSTRUCTOR')}</h2><p>{mode === 'apprentice' ? 'Entra con el código entregado por tu instructor.' : 'Crea un código para tu grupo.'}</p></div></div><form onSubmit={mode === 'apprentice' ? submitApprentice : submitInstructor}>
        {isRegister && <label>{mode === 'apprentice' ? 'NOMBRE DEL APRENDIZ' : 'NOMBRE DEL INSTRUCTOR'}<input value={name} onChange={event => setName(event.target.value)} /></label>}
        {mode === 'instructor' && <label>CORREO INSTITUCIONAL<input type="email" value={email} onChange={event => setEmail(event.target.value)} /></label>}
        {mode === 'apprentice' && <label>NÚMERO DE FICHA<input value={ficha} onChange={event => setFicha(event.target.value)} inputMode="numeric" /></label>}
        <label>CONTRASEÑA<input type="password" value={password} onChange={event => setPassword(event.target.value)} /></label>
        {mode === 'instructor' && isRegister && <label>NOMBRE DE LA SALA<input value={roomName} onChange={event => setRoomName(event.target.value)} /></label>}
        {mode === 'apprentice' && <><label>CÓDIGO DE SALA<input className="code-input" value={roomCode} onChange={event => setRoomCode(event.target.value.toUpperCase())} /></label>{isRegister && <div className="gender"><span>AVATAR</span><button type="button" className={gender === 'masculino' ? 'selected' : ''} onClick={() => setGender('masculino')}>MASCULINO</button><button type="button" className={gender === 'femenino' ? 'selected' : ''} onClick={() => setGender('femenino')}>FEMENINO</button></div>}</>}
        {error && <p className="form-error">{error}</p>}<button className="primary" disabled={!loaded || busy}>{busy ? 'CONECTANDO...' : mode === 'instructor' ? 'CREAR SALA' : 'ENTRAR A MI SALA'} <ArrowRight size={20} /></button></form><button className="switch" onClick={() => setIsRegister(value => !value)}>{isRegister ? <><LogIn size={16} /> Ya tengo una cuenta</> : <><UserPlus size={16} /> Crear una cuenta nueva</>}</button></>}
    </section>
  </main>;
} 