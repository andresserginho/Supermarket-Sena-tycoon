import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, KeyRound, LogIn, ShieldCheck, UserPlus, Users, X } from 'lucide-react';
import type { GameUser } from './GameLauncherRole';

interface Props { onStartGame: (user: GameUser) => void; }
type Mode = 'apprentice' | 'instructor' | 'admin';
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function request<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message ?? 'No se pudo completar la solicitud.');
  return data as T;
}

export function GameLauncherWithAdmin({ onStartGame }: Props) {
  const [mode, setMode] = useState<Mode>('apprentice');
  const [isRegister, setIsRegister] = useState(true);
  const [name, setName] = useState('');
  const [ficha, setFicha] = useState('');
  const [gender, setGender] = useState<'masculino' | 'femenino'>('masculino');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [roomName, setRoomName] = useState('Sala de entrenamiento');
  const [showPassword, setShowPassword] = useState(false);
  const [instructorId, setInstructorId] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const resetForm = () => { setName(''); setFicha(''); setGender('masculino'); setEmail(''); setPassword(''); setRoomCode(''); setRoomName('Sala de entrenamiento'); setShowPassword(false); setError(''); };
  const changeMode = (nextMode: Mode) => { resetForm(); setMode(nextMode); setIsRegister(nextMode !== 'admin'); };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      if (mode === 'admin') {
        if (name.trim().toLowerCase() !== 'admin' || password !== 'admin123') throw new Error('Usuario o contraseña de administrador incorrectos.');
        const user: GameUser = { id: 'local-admin', name: 'Administrador', ficha: '0000000', gender: 'masculino', roomCode: '', sessionId: 'local-admin-session', role: 'admin' };
        localStorage.setItem('sena_current_user', JSON.stringify(user)); onStartGame(user); return;
      }
      if (mode === 'apprentice') {
        const user = isRegister ? await request<GameUser>('/auth/apprentice/register', { name, ficha, gender, password, roomCode }) : await request<GameUser>('/auth/apprentice/login', { name, ficha, password, roomCode });
        localStorage.setItem('sena_current_user', JSON.stringify(user)); onStartGame(user); return;
      }
      const instructorKey = isRegister ? window.prompt('Escribe la clave privada de registro de instructor') ?? '' : '';
      const instructor = isRegister ? await request<{ id: string }>('/auth/instructor/register', { name, email, password, instructorKey }) : await request<{ id: string }>('/auth/instructor/login', { email, password });
      const room = await request<{ code: string }>('/rooms', { instructorId: instructor.id, name: roomName });
      setInstructorId(instructor.id); setGeneratedCode(room.code); localStorage.setItem('sena_instructor_room', JSON.stringify({ instructorId: instructor.id, roomCode: room.code }));
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'No se pudo completar la solicitud.'); }
    finally { setBusy(false); }
  };

  const closeRoom = async () => {
    if (!window.confirm('¿Cerrar esta sala para todos los aprendices?')) return;
    setBusy(true);
    try { await request('/rooms/close', { instructorId, roomCode: generatedCode }); setGeneratedCode(''); setInstructorId(''); localStorage.removeItem('sena_instructor_room'); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'No se pudo cerrar la sala.'); }
    finally { setBusy(false); }
  };

  return <main className="launcher"><section className="launcher__brand"><div className="brand-mark">🛒</div><p className="eyebrow">SENA PRESENTA</p><h1>SUPERMARKET<br /><strong>SENA</strong></h1><p className="brand-subtitle">TYCOON</p><p className="brand-copy">Construye. Administra. Expande.<br />Tu imperio empieza aquí.</p></section><section className="access-panel"><div className="role-tabs"><button type="button" className={mode === 'apprentice' ? 'active' : ''} onClick={() => changeMode('apprentice')}><Users size={18} /> APRENDIZ</button><button type="button" className={mode === 'instructor' ? 'active' : ''} onClick={() => changeMode('instructor')}><KeyRound size={18} /> INSTRUCTOR</button><button type="button" className={mode === 'admin' ? 'active' : ''} onClick={() => changeMode('admin')}><ShieldCheck size={18} /> ADMIN</button></div>{generatedCode ? <div className="room-result"><span>CÓDIGO DE SALA</span><strong>{generatedCode}</strong><p>Todos pueden usarlo. Cada aprendiz tendrá su propia sala.</p><button className="primary" onClick={() => navigator.clipboard?.writeText(generatedCode)}>COPIAR CÓDIGO</button><button className="close-room" onClick={closeRoom} disabled={busy}><X size={17} /> CERRAR SALA</button></div> : <><h2>{mode === 'admin' ? 'ENTRAR COMO ADMIN' : mode === 'apprentice' ? (isRegister ? 'NUEVO APRENDIZ' : 'APRENDIZ EXISTENTE') : (isRegister ? 'REGISTRAR INSTRUCTOR' : 'LOGIN INSTRUCTOR')}</h2><form onSubmit={submit}>{(isRegister || mode === 'apprentice' || mode === 'admin') && <label>{mode === 'admin' ? 'USUARIO' : 'NOMBRE'}<input value={name} onChange={event => setName(event.target.value)} required /></label>}{mode === 'instructor' && <label>CORREO<input type="email" value={email} onChange={event => setEmail(event.target.value)} required /></label>}{mode === 'apprentice' && <label>FICHA<input value={ficha} onChange={event => setFicha(event.target.value.replace(/\D/g, '').slice(0, 7))} inputMode="numeric" pattern="[0-9]{7}" maxLength={7} minLength={7} required /></label>}{mode === 'apprentice' && <label>CÓDIGO DE SALA<input className="code-input" value={roomCode} onChange={event => setRoomCode(event.target.value.toUpperCase())} maxLength={8} required /></label>}{mode === 'instructor' && isRegister && <label>NOMBRE DE LA SALA<input value={roomName} onChange={event => setRoomName(event.target.value)} required /></label>}{mode === 'apprentice' && isRegister && <div className="gender"><span>AVATAR</span><button type="button" className={gender === 'masculino' ? 'selected' : ''} onClick={() => setGender('masculino')}>MASCULINO</button><button type="button" className={gender === 'femenino' ? 'selected' : ''} onClick={() => setGender('femenino')}>FEMENINO</button></div>}<label>CONTRASEÑA<div className="password-field"><input type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} minLength={6} required /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>{error && <p className="form-error">{error}</p>}<button className="primary" disabled={busy}>{busy ? 'CONECTANDO...' : mode === 'admin' ? 'ENTRAR AL JUEGO' : mode === 'instructor' ? 'CREAR SALA' : 'ENTRAR A MI SALA'} <ArrowRight size={20} /></button></form>{mode !== 'admin' && <button className="switch" onClick={() => setIsRegister(value => !value)}>{isRegister ? <><LogIn size={16} /> Ya tengo una cuenta</> : <><UserPlus size={16} /> Crear una cuenta nueva</>}</button>}</>}</section></main>;
}
