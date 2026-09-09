import { useState, useEffect } from 'react';
import { useProgress } from '@react-three/drei';
import { ArrowRight, Eye, EyeOff, KeyRound, LogIn, ShieldCheck, UserPlus, Users, X } from 'lucide-react';

export interface GameUser {
  id?: string;
  name: string;
  ficha: string;
  gender: 'masculino' | 'femenino';
  roomCode: string;
  sessionId: string;
  role?: 'admin' | 'apprentice' | 'instructor';
}

interface GameLauncherProps {
  onStartGame: (user: GameUser) => void;
}

type Mode = 'apprentice' | 'instructor' | 'admin';

const getApiUrl = (): string => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
  } catch {
    // Contexto de respaldo si falla import.meta
  }
  return 'https://85q1z69w-3000.use2.devtunnels.ms';
};

const API_URL = getApiUrl();

async function request<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message ?? 'No se pudo completar la solicitud.');
  }
  return data as T;
}

export function GameLauncher({ onStartGame }: GameLauncherProps) {
  const { progress } = useProgress();

  const [mode, setModeState] = useState<Mode>('apprentice');
  const [isRegister, setIsRegister] = useState(true);

  // Estados del formulario
  const [name, setName] = useState('');
  const [ficha, setFicha] = useState('');
  const [gender, setGender] = useState<'masculino' | 'femenino'>('masculino');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [roomName, setRoomName] = useState('Sala de entrenamiento');

  // Estado de sala de instructor
  const [instructorId, setInstructorId] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

  // Estados de retroalimentación
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Mantiene sincronizado el estado de la sala del instructor para componentes globales
  useEffect(() => {
    if (instructorId && generatedCode) {
      localStorage.setItem('sena_instructor_room', JSON.stringify({ instructorId, roomCode: generatedCode }));
      window.dispatchEvent(new Event('sena-room-created'));
    } else {
      localStorage.removeItem('sena_instructor_room');
    }
  }, [instructorId, generatedCode]);

  const resetForm = () => {
    setName('');
    setFicha('');
    setGender('masculino');
    setEmail('');
    setPassword('');
    setRoomCode('');
    setRoomName('Sala de entrenamiento');
    setShowPassword(false);
    setError('');
  };

  const setMode = (nextMode: Mode) => {
    resetForm();
    setModeState(nextMode);
    setIsRegister(nextMode !== 'admin');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setBusy(true);

    try {
      // 1. MODO ADMINISTRADOR (Pruebas de desarrollo local sin Backend)
      if (mode === 'admin') {
        if (name.trim().toLowerCase() !== 'admin' || password !== 'admin123') {
          throw new Error('Usuario o contraseña de administrador incorrectos.');
        }
        const adminUser: GameUser = {
          id: 'local-admin',
          name: 'Administrador SENA',
          ficha: 'ADMIN-000',
          gender: 'masculino',
          roomCode: 'LOCAL-ROOM',
          sessionId: `session-admin-${Date.now()}`,
          role: 'admin',
        };
        localStorage.setItem('sena_current_user', JSON.stringify(adminUser));
        onStartGame(adminUser);
        return;
      }

      // 2. MODO APRENDIZ
      if (mode === 'apprentice') {
        const user = isRegister
          ? await request<GameUser>('/auth/apprentice/register', { name, ficha, gender, password, roomCode })
          : await request<GameUser>('/auth/apprentice/login', { name, ficha, password, roomCode });

        localStorage.setItem('sena_current_user', JSON.stringify(user));
        onStartGame(user);
        return;
      }

      // 3. MODO INSTRUCTOR
      if (mode === 'instructor') {
        const instructorKey = isRegister
          ? window.prompt('Escribe la clave privada de registro de instructor') ?? ''
          : '';

        const instructor = isRegister
          ? await request<{ id: string }>('/auth/instructor/register', { name, email, password, instructorKey })
          : await request<{ id: string }>('/auth/instructor/login', { email, password });

        const room = await request<{ code: string }>('/rooms', { instructorId: instructor.id, name: roomName });

        setInstructorId(instructor.id);
        setGeneratedCode(room.code);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la solicitud.');
    } finally {
      setBusy(false);
    }
  };

  const handleCloseRoom = async () => {
    if (!window.confirm('¿Cerrar esta sala para todos los aprendices?')) return;
    setBusy(true);
    try {
      await request('/rooms/close', { instructorId, roomCode: generatedCode });
      setGeneratedCode('');
      setInstructorId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cerrar la sala.');
    } finally {
      setBusy(false);
    }
  };

  const loaded = progress >= 100 || progress === 0;

  return (
    <main className="launcher">
      {/* SECCIÓN LATERAL DE CÁRGA Y MARCA */}
      <section className="launcher__brand">
        <div className="brand-mark">🛒</div>
        <p className="eyebrow">SENA PRESENTA</p>
        <h1>
          SUPERMARKET<br />
          <strong>SENA</strong>
        </h1>
        <p className="brand-subtitle">TYCOON</p>
        <p className="brand-copy">
          Construye. Administra. Expande.<br />
          Tu imperio empieza aquí.
        </p>
        <div className="loading">
          <span>CARGANDO RECURSOS...</span>
          <b>{Math.round(progress)}%</b>
          <div>
            <i style={{ width: `${Math.max(progress, 5)}%` }} />
          </div>
          <small>Edificios, texturas, modelos 3D, personajes, audio...</small>
        </div>
      </section>

      {/* PANEL DERECHO DE ACCESO */}
      <section className="access-panel">
        <div className="role-tabs">
          <button
            type="button"
            className={mode === 'apprentice' ? 'active' : ''}
            onClick={() => setMode('apprentice')}
          >
            <Users size={18} /> APRENDIZ
          </button>
          <button
            type="button"
            className={mode === 'instructor' ? 'active' : ''}
            onClick={() => setMode('instructor')}
          >
            <KeyRound size={18} /> INSTRUCTOR
          </button>
          <button
            type="button"
            className={mode === 'admin' ? 'active' : ''}
            onClick={() => setMode('admin')}
          >
            <ShieldCheck size={18} /> ADMIN
          </button>
        </div>

        {generatedCode ? (
          <div className="room-result">
            <span>CÓDIGO DE SALA</span>
            <strong>{generatedCode}</strong>
            <p>Comparte este código con los aprendices. Cada uno ingresará a su entorno.</p>
            <button
              type="button"
              className="primary"
              onClick={() => navigator.clipboard?.writeText(generatedCode)}
            >
              COPIAR CÓDIGO
            </button>
            <button
              type="button"
              className="close-room"
              onClick={handleCloseRoom}
              disabled={busy}
            >
              <X size={17} /> CERRAR SALA
            </button>
          </div>
        ) : (
          <>
            <h2>
              {mode === 'apprentice'
                ? isRegister ? 'NUEVO APRENDIZ' : 'APRENDIZ EXISTENTE'
                : mode === 'admin'
                ? 'ACCESO ADMINISTRADOR'
                : isRegister ? 'REGISTRAR INSTRUCTOR' : 'LOGIN INSTRUCTOR'}
            </h2>

            <form onSubmit={handleSubmit}>
              {(isRegister || mode === 'apprentice' || mode === 'admin') && (
                <label>
                  {mode === 'admin' ? 'USUARIO' : 'NOMBRE'}
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={mode === 'admin' ? 'admin' : 'Ej: Andres Vázquez'}
                    required
                  />
                </label>
              )}

              {mode === 'instructor' && (
                <label>
                  CORREO INSTITUCIONAL
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@sena.edu.co"
                    required
                  />
                </label>
              )}

              {mode === 'apprentice' && (
                <label>
                  NÚMERO DE FICHA
                  <input
                    value={ficha}
                    onChange={(e) => setFicha(e.target.value.replace(/\D/g, '').slice(0, 7))}
                    inputMode="numeric"
                    pattern="[0-9]{7}"
                    maxLength={7}
                    minLength={7}
                    placeholder="3235613"
                    required
                  />
                </label>
              )}

              <label>
                CONTRASEÑA
                <div className="password-field">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={mode === 'admin' ? 1 : 6}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>

              {mode === 'instructor' && isRegister && (
                <label>
                  NOMBRE DE LA SALA
                  <input
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    required
                  />
                </label>
              )}

              {mode === 'apprentice' && (
                <label>
                  CÓDIGO DE SALA
                  <input
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    maxLength={8}
                    placeholder="EJ: ROOM1234"
                    required
                  />
                </label>
              )}

              {mode === 'apprentice' && isRegister && (
                <div className="gender">
                  <span>AVATAR</span>
                  <button
                    type="button"
                    className={gender === 'masculino' ? 'selected' : ''}
                    onClick={() => setGender('masculino')}
                  >
                    MASCULINO
                  </button>
                  <button
                    type="button"
                    className={gender === 'femenino' ? 'selected' : ''}
                    onClick={() => setGender('femenino')}
                  >
                    FEMENINO
                  </button>
                </div>
              )}

              {error && <p className="form-error">{error}</p>}

              <button className="primary" disabled={!loaded || busy}>
                {busy
                  ? 'CONECTANDO...'
                  : mode === 'instructor'
                  ? 'CREAR SALA'
                  : mode === 'admin'
                  ? 'ENTRAR COMO ADMIN'
                  : 'ENTRAR A MI SALA'}{' '}
                <ArrowRight size={20} />
              </button>
            </form>

            {mode !== 'admin' && (
              <button
                type="button"
                className="switch"
                onClick={() => setIsRegister((v) => !v)}
              >
                {isRegister ? (
                  <>
                    <LogIn size={16} /> Ya tengo una cuenta
                  </>
                ) : (
                  <>
                    <UserPlus size={16} /> Crear una cuenta
                  </>
                )}
              </button>
            )}
          </>
        )}
      </section>
    </main>
  );
}