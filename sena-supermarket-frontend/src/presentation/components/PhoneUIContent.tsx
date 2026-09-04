// src/presentation/components/PhoneUIContent.tsx
import React, { useState } from 'react';
import { usePhoneStore } from '../../application/store/usePhoneStore';
import { useSimulationStore } from '../../application/store/useSimulationStore';
import { recoverHealth } from '../../infrastructure/api/progressApi';
import { useGameTime } from '../hooks/useGameTime';

export const PhoneUIContent: React.FC = () => {
  const close = usePhoneStore((s) => s.close);
  const { money, totalSalesCount, playerState } = useSimulationStore();
  const { formattedTime } = useGameTime();

  const [recovering, setRecovering] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');

  const currentHealth = Math.max(0, Math.min(100, playerState.health));
  const isDead = currentHealth <= 0;

  const handleRecoverHealth = async () => {
    try {
      setRecovering(true);
      setRecoveryError('');
      const updatedUser = await recoverHealth('1');
      useSimulationStore.setState({
        playerState: {
          ...useSimulationStore.getState().playerState,
          health: updatedUser.health ?? 100,
        },
      });
    } catch (err: any) {
      setRecoveryError(err.message || 'Error al recuperar salud');
    } finally {
      setRecovering(false);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '16px 14px 14px 14px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
      }}
    >
      {/* Encabezado Superior */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: '#94a3b8',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          paddingBottom: '8px',
        }}
      >
        <span>📶 SENA Net</span>
        <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>🕒 {formattedTime}</span>
        <span style={{ color: '#4ade80', fontWeight: 'bold' }}>$ {money.toLocaleString()} COP</span>
      </div>

      {/* Cuerpo Principal */}
      <div style={{ flex: 1, marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
        <div
          style={{
            background: 'rgba(30, 41, 59, 0.8)',
            borderRadius: '12px',
            padding: '10px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 'bold' }}>
            Estado del Aprendiz
          </div>

          {/* Salud */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>
              <span>❤️ Salud</span>
              <span style={{ color: currentHealth > 20 ? '#38bdf8' : '#ef4444', fontWeight: 'bold' }}>
                {currentHealth}%
              </span>
            </div>
            <div style={{ width: '100%', height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${currentHealth}%`,
                  height: '100%',
                  background: currentHealth > 20 ? '#38bdf8' : '#ef4444',
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>

          {/* Hambre */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>
              <span>🍗 Hambre</span>
              <span style={{ color: '#fb923c', fontWeight: 'bold' }}>{playerState.hunger}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${playerState.hunger}%`, height: '100%', background: '#fb923c' }} />
            </div>
          </div>

          {/* Sed */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>
              <span>💧 Sed</span>
              <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>{playerState.thirst}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${playerState.thirst}%`, height: '100%', background: '#60a5fa' }} />
            </div>
          </div>
        </div>

        {isDead ? (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              borderRadius: '12px',
              padding: '10px',
              textAlign: 'center',
            }}
          >
            <div style={{ color: '#f87171', fontWeight: 'bold', fontSize: '12px', marginBottom: '4px' }}>
              ⚠️ ESTÁS SIN SALUD
            </div>
            <div style={{ fontSize: '10px', color: '#cbd5e1', marginBottom: '8px' }}>
              Has sufrido daño en la calle. Solicita asistencia médica.
            </div>
            {recoveryError && (
              <div style={{ fontSize: '10px', color: '#fca5a5', marginBottom: '6px' }}>{recoveryError}</div>
            )}
            <button
              onClick={handleRecoverHealth}
              disabled={recovering}
              style={{
                width: '100%',
                background: '#dc2626',
                color: '#ffffff',
                border: 'none',
                padding: '8px',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '11px',
                cursor: recovering ? 'not-allowed' : 'pointer',
              }}
            >
              {recovering ? 'Procesando...' : '🏥 Curarse / Reiniciar Salud'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              onClick={() => alert('Abriendo POS...')}
              style={{
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#fff',
                borderRadius: '10px',
                padding: '10px 6px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              🖥️ POS Caja
            </button>
            <button
              onClick={() => alert('Consultando Inventario...')}
              style={{
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#fff',
                borderRadius: '10px',
                padding: '10px 6px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              📦 Inventario
            </button>
          </div>
        )}

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '10px',
            padding: '8px 10px',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#94a3b8',
          }}
        >
          <span>Ventas realizadas:</span>
          <span style={{ color: '#ffffff', fontWeight: 'bold' }}>{totalSalesCount}</span>
        </div>
      </div>

      <button
        onClick={close}
        style={{
          background: '#334155',
          color: '#ffffff',
          border: 'none',
          padding: '8px',
          borderRadius: '8px',
          fontWeight: 'bold',
          fontSize: '11px',
          cursor: 'pointer',
          marginTop: '6px',
        }}
      >
        Guardar Celular (N)
      </button>
    </div>
  );
};