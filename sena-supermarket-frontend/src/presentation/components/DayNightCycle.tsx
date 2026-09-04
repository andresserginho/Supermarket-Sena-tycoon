// src/presentation/components/DayNightCycle.tsx
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { calculateGameTime } from '../hooks/useGameTime';

export const DayNightCycle: React.FC = () => {
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);

  const daySkyColor = new THREE.Color('#38bdf8');   
  const duskSkyColor = new THREE.Color('#f97316');  
  const nightSkyColor = new THREE.Color('#0b0f19'); 

  useFrame(({ clock, scene }) => {
    const elapsedSeconds = clock.getElapsedTime();
    const { cycleProgress } = calculateGameTime(elapsedSeconds);

    const angle = cycleProgress * Math.PI * 2;
    const sunX = Math.cos(angle) * 40;
    const sunY = Math.sin(angle) * 40;
    const sunZ = 15;

    if (dirLightRef.current) {
      dirLightRef.current.position.set(sunX, sunY, sunZ);
    }

    const normalizedSunY = Math.sin(angle);
    let currentSkyColor = new THREE.Color();
    let targetLightIntensity = 1.2;
    let targetAmbientIntensity = 0.5;

    if (normalizedSunY > 0.15) {
      currentSkyColor.copy(daySkyColor);
      targetLightIntensity = 1.2;
      targetAmbientIntensity = 0.5;
    } else if (normalizedSunY <= 0.15 && normalizedSunY >= -0.2) {
      const factor = (normalizedSunY + 0.2) / 0.35;
      currentSkyColor.lerpColors(duskSkyColor, daySkyColor, factor);
      targetLightIntensity = THREE.MathUtils.lerp(0.15, 1.2, factor);
      targetAmbientIntensity = THREE.MathUtils.lerp(0.2, 0.5, factor);
    } else {
      currentSkyColor.copy(nightSkyColor);
      targetLightIntensity = 0.05;
      targetAmbientIntensity = 0.22; // Evita el negro absoluto
    }

    scene.background = currentSkyColor;

    if (dirLightRef.current) {
      dirLightRef.current.intensity = THREE.MathUtils.lerp(
        dirLightRef.current.intensity,
        targetLightIntensity,
        0.05
      );
    }

    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = THREE.MathUtils.lerp(
        ambientLightRef.current.intensity,
        targetAmbientIntensity,
        0.05
      );
    }
  });

  return (
    <>
      <ambientLight ref={ambientLightRef} intensity={0.5} />
      <directionalLight
        ref={dirLightRef}
        position={[10, 20, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
    </>
  );
};