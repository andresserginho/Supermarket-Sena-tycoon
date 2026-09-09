// src/application/store/usePhoneStore.ts
import { create } from 'zustand';

interface PhoneStore {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}


export const usePhoneStore = create<PhoneStore>((set) => ({
  isOpen: false,
  toggle: () =>
    set((state) => {
      const next = !state.isOpen;
      if (next) {
        // Soltamos el bloqueo del mouse para poder hacer clic en los botones del celular
        document.exitPointerLock?.();
      }
      return { isOpen: next };
    }),
  close: () => set({ isOpen: false }),
}));

// Listener global de la tecla M / Escape — vive fuera de React para no depender
// de qué componente esté montado en cada momento.
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'm') usePhoneStore.getState().toggle();
    if (e.key === 'Escape') usePhoneStore.getState().close();
  });
}
