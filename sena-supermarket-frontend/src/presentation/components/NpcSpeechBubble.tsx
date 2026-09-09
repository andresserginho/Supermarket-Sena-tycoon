// src/presentation/components/NpcSpeechBubble.tsx
import React from 'react';
import { Text } from '@react-three/drei';
import type { NpcComplaint } from '../../application/data/npcDialogue';

interface NpcSpeechBubbleProps {
  complaint: NpcComplaint | null;
  resultMessage: string | null;
}

export const NpcSpeechBubble: React.FC<NpcSpeechBubbleProps> = ({ complaint, resultMessage }) => {
  if (!complaint && !resultMessage) return null;

  const emotionIcon =
    complaint?.emotion === 'angry' ? '😠' : complaint?.emotion === 'happy' ? '😊' : '🙂';

  return (
    <group position={[0, 2.2, 0]}>
      {/* Icono de emoción en 3D */}
      <Text fontSize={0.4} position={[0, 0.5, 0]} anchorX="center" anchorY="middle">
        {emotionIcon}
      </Text>

      {/* Texto de la queja / diálogo 3D */}
      {complaint && !resultMessage && (
        <group position={[0, 0, 0]}>
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[2.5, 0.8]} />
            <meshBasicMaterial color="white" transparent opacity={0.9} />
          </mesh>
          <Text
            fontSize={0.15}
            color="black"
            maxWidth={2.3}
            textAlign="center"
            anchorX="center"
            anchorY="middle"
          >
            {complaint.npcMessage}
          </Text>
        </group>
      )}

      {/* Mensaje de resultado 3D */}
      {resultMessage && (
        <group position={[0, 0, 0]}>
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[2.5, 0.5]} />
            <meshBasicMaterial color="white" transparent opacity={0.9} />
          </mesh>
          <Text
            fontSize={0.15}
            color="black"
            maxWidth={2.3}
            textAlign="center"
            anchorX="center"
            anchorY="middle"
          >
            {resultMessage}
          </Text>
        </group>
      )}
    </group>
  );
};