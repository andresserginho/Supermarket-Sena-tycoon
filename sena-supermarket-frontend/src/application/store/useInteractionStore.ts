// src/application/store/useInteractionStore.ts
import { create } from 'zustand';

interface InteractionUIState {
  currentInteractableId: string | null;
  currentLabel: string | null;
  setCurrentTarget: (id: string | null, label: string | null) => void;
}

export const useInteractionStore = create<InteractionUIState>((set) => ({
  currentInteractableId: null,
  currentLabel: null,
  setCurrentTarget: (id, label) => set({ currentInteractableId: id, currentLabel: label }),
}));