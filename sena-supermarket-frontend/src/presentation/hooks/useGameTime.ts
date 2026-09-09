// src/presentation/hooks/useGameTime.ts
import { useState, useEffect } from 'react';

export const GAME_DAY_SECONDS = 600; // 10 minutos reales = 24 horas de juego
let gameTimeOffsetSeconds = 0;

export function calculateGameTime(elapsedSeconds: number) {
  const adjustedElapsedSeconds = elapsedSeconds + gameTimeOffsetSeconds;
  const totalGameMinutes = (adjustedElapsedSeconds / GAME_DAY_SECONDS) * 1440;
  const hours = Math.floor((totalGameMinutes / 60) % 24);
  const minutes = Math.floor(totalGameMinutes % 60);
  
  const formattedHours = hours.toString().padStart(2, '0');
  const formattedMinutes = minutes.toString().padStart(2, '0');

  return {
    hours,
    minutes,
    formattedTime: `${formattedHours}:${formattedMinutes}`,
    cycleProgress: (adjustedElapsedSeconds % GAME_DAY_SECONDS) / GAME_DAY_SECONDS,
    day: Math.floor(adjustedElapsedSeconds / GAME_DAY_SECONDS) + 1,
  };
}

export function advanceToNextDay() {
  const elapsedSeconds = performance.now() / 1000 + gameTimeOffsetSeconds;
  gameTimeOffsetSeconds += GAME_DAY_SECONDS - (elapsedSeconds % GAME_DAY_SECONDS);
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