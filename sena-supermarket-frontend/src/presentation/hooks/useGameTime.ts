// src/presentation/hooks/useGameTime.ts
import { useState, useEffect } from 'react';

export const GAME_DAY_SECONDS = 600; // 10 minutos reales = 24 horas de juego

export function calculateGameTime(elapsedSeconds: number) {
  const totalGameMinutes = (elapsedSeconds / GAME_DAY_SECONDS) * 1440;
  const hours = Math.floor((totalGameMinutes / 60) % 24);
  const minutes = Math.floor(totalGameMinutes % 60);
  
  const formattedHours = hours.toString().padStart(2, '0');
  const formattedMinutes = minutes.toString().padStart(2, '0');

  return {
    hours,
    minutes,
    formattedTime: `${formattedHours}:${formattedMinutes}`,
    cycleProgress: (elapsedSeconds % GAME_DAY_SECONDS) / GAME_DAY_SECONDS,
  };
}

export function useGameTime() {
  const [timeData, setTimeData] = useState(() => calculateGameTime(performance.now() / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeData(calculateGameTime(performance.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return timeData;
}