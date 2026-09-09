// src/application/data/npcDialogue.ts
export type NpcEmotion = 'happy' | 'neutral' | 'angry';

export interface NpcResponseOption {
  label: string;              // lo que ve el jugador en el botón
  outcome: 'helped_find_product' | 'failed_to_help'; // reutilizamos el sistema de reputación que ya existe
  resultMessage: string;      // lo que el NPC contesta después de elegir
}

export interface NpcComplaint {
  emotion: NpcEmotion;
  npcMessage: string;
  responses: NpcResponseOption[];
}

// Banco de mensajes — agrega los que quieras, se elige uno al azar cuando el NPC entra a la tienda
export const NPC_COMPLAINTS: NpcComplaint[] = [
  {
    emotion: 'angry',
    npcMessage: 'El supermercado está un poco sucio 🧹',
    responses: [
      { label: 'Pedir disculpas y limpiar', outcome: 'helped_find_product', resultMessage: 'Gracias por atenderlo 🙂' },
      { label: 'Ignorar el comentario', outcome: 'failed_to_help', resultMessage: 'Qué mala atención 😠' },
    ],
  },
  {
    emotion: 'angry',
    npcMessage: '¡Nadie me atendió rápido! 😠',
    responses: [
      { label: 'Pedir disculpas por la demora', outcome: 'helped_find_product', resultMessage: 'Bueno, gracias por responder' },
      { label: 'No decir nada', outcome: 'failed_to_help', resultMessage: 'Esto es inaceptable' },
    ],
  },
  {
    emotion: 'happy',
    npcMessage: '¡Excelente atención, gracias! 😊',
    responses: [
      { label: 'Agradecer', outcome: 'helped_find_product', resultMessage: '¡Vuelvo pronto! 😄' },
    ],
  },
];

export function pickRandomComplaint(): NpcComplaint {
  return NPC_COMPLAINTS[Math.floor(Math.random() * NPC_COMPLAINTS.length)];
}