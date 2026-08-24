import { create } from 'zustand';
import { SimulationEngine, type PlayerState } from '../services/SimulationEngine';
import type { ProgressPayload } from '../../infrastructure/api/progressApi';
const engine = new SimulationEngine();

export interface CartItem {
  id: string;
  name: string;
  price: number;
}

export interface SimulationStore {
  // Estado reactivo del jugador
  playerState: PlayerState;

  // Progreso persistente
  level: number;
  expansions: string[];

  // Estado de caja registradora y economía para el HUD
  money: number;
  totalSalesCount: number;
  currentCart: CartItem[];
  checkoutTotal: number;

  // Acciones de necesidades del jugador
  handleCarImpact: (damage?: number) => void;
  consumeFood: (amount?: number) => void;
  consumeWater: (amount?: number) => void;

  // Acciones de la caja registradora
  addToCart: (item: CartItem) => void;
  processPayment: () => void;

  // Progreso persistente: cargar y serializar
  hydrateProgress: (progress: ProgressPayload) => void;
  serializeProgress: () => ProgressPayload;

  // Motor de simulación desacoplado
  engine: SimulationEngine;
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  engine,
  playerState: engine.getPlayerState(),

  level: 1,
  expansions: [],

  money: 50000,
  totalSalesCount: 0,
  currentCart: [],
  checkoutTotal: 0,

  handleCarImpact: (damage = 15) => {
    const updatedState = engine.handleCarImpact(damage);
    set({ playerState: updatedState });
  },

  consumeFood: (amount = 25) => {
    const updatedState = engine.consumeItem('FOOD', amount);
    set({ playerState: updatedState });
  },

  consumeWater: (amount = 25) => {
    const updatedState = engine.consumeItem('WATER', amount);
    set({ playerState: updatedState });
  },

  addToCart: (item: CartItem) => {
    const updatedCart = [...get().currentCart, item];
    const newTotal = updatedCart.reduce((sum, prod) => sum + prod.price, 0);
    set({
      currentCart: updatedCart,
      checkoutTotal: newTotal,
    });
  },

  processPayment: () => {
    const { currentCart, checkoutTotal, money, totalSalesCount } = get();
    if (currentCart.length === 0) return;

    set({
      money: money + checkoutTotal,
      totalSalesCount: totalSalesCount + 1,
      currentCart: [],
      checkoutTotal: 0,
    });
  },

  hydrateProgress: (progress: ProgressPayload) => {
    const updatedState = engine.setPlayerState({
      health: progress.health,
      hunger: progress.hunger,
      thirst: progress.thirst,
    });
    set({
      playerState: updatedState,
      level: progress.level,
      money: progress.money,
      totalSalesCount: progress.sales,
      expansions: progress.expansions,
    });
  },

  serializeProgress: () => {
    const { playerState, level, money, totalSalesCount, expansions } = get();
    return {
      level,
      money,
      sales: totalSalesCount,
      health: playerState.health,
      hunger: playerState.hunger,
      thirst: playerState.thirst,
      expansions,
    };
  },
}));