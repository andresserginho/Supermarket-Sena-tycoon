import { create } from 'zustand';
import { SimulationEngine, type PlayerState as EnginePlayerState, type ProgressState, type CashRegisterState, type CheckoutOutcome } from '../services/SimulationEngine';
import { Checkout } from '../../domain/entities/Checkout';
import type { Product } from '../../domain/entities/Product';

const engine = new SimulationEngine();
const checkout = new Checkout();

export interface CartItem {
  id: string;
  name: string;
  price: number;
}

export interface DeliveryItem {
  productId: string;
  productName: string;
  quantity: number;
}

export interface DeliveryBoxData {
  id: string;
  items: DeliveryItem[];
  position: [number, number, number];
  deliveryTimeGameHours?: number;
}

export interface PlayerState extends EnginePlayerState {
  level?: number;
}

export interface SimulationStore {
  playerState: PlayerState;
  progressState: ProgressState;
  cashRegisterState: CashRegisterState;

  money: number;
  totalSalesCount: number;
  currentCart: CartItem[];
  checkoutTotal: number;
  inventory: Record<string, number>;
  deliveryBoxes: DeliveryBoxData[];

  setMoney: (money: number) => void;
  addInventoryItem: (productId: string, quantity: number) => void;
  addDeliveryBox: (box: DeliveryBoxData) => void;
  removeDeliveryBox: (id: string) => void;

  handleCarImpact: (damage?: number) => void;
  consumeFood: (amount?: number) => void;
  consumeWater: (amount?: number) => void;

  sleep: () => void;
  registerCheckoutOutcome: (outcome: CheckoutOutcome, saleAmount?: number, changeDelta?: number) => void;

  addToCart: (product: Product) => void;
  processPayment: () => void;

  engine: SimulationEngine;
}

function cartItemsFromCheckout(): CartItem[] {
  return checkout.getItems().map((scanned) => ({
    id: scanned.product.id,
    name: scanned.product.name,
    price: scanned.product.price,
  }));
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  engine,
  playerState: {
    ...engine.getPlayerState(),
    level: 1,
  },
  progressState: engine.getProgressState(),
  cashRegisterState: engine.getCashRegisterState(),

  money: 50000,
  totalSalesCount: 0,
  currentCart: [],
  checkoutTotal: 0,
  inventory: {},
  deliveryBoxes: [],

  setMoney: (money: number) => set({ money }),

  addInventoryItem: (productId: string, quantity: number) =>
    set((state) => ({
      inventory: {
        ...state.inventory,
        [productId]: (state.inventory[productId] || 0) + quantity,
      },
    })),

  addDeliveryBox: (box: DeliveryBoxData) =>
    set((state) => ({
      deliveryBoxes: [...state.deliveryBoxes, box],
    })),

  removeDeliveryBox: (id: string) =>
    set((state) => ({
      deliveryBoxes: state.deliveryBoxes.filter((b) => b.id !== id),
    })),

  handleCarImpact: (damage = 15) => {
    set({ playerState: { ...engine.handleCarImpact(damage), level: 1 } });
  },

  consumeFood: (amount = 25) => {
    set({ playerState: { ...engine.consumeItem('FOOD', amount), level: 1 } });
  },

  consumeWater: (amount = 25) => {
    set({ playerState: { ...engine.consumeItem('WATER', amount), level: 1 } });
  },

  sleep: () => {
    const { playerState, progressState } = engine.sleep();
    set({ playerState: { ...playerState, level: 1 }, progressState });
  },

  registerCheckoutOutcome: (outcome, saleAmount = 0, changeDelta = 0) => {
    const { progressState, cashRegisterState } = engine.registerCheckoutOutcome(outcome, saleAmount, changeDelta);
    set({ progressState, cashRegisterState });
  },

  addToCart: (product: Product) => {
    checkout.addItem(product);
    set({
      currentCart: cartItemsFromCheckout(),
      checkoutTotal: checkout.calculateTotal(),
    });
  },

  processPayment: () => {
    if (checkout.getItems().length === 0) return;

    const total = checkout.completeTransaction();
    const { cashRegisterState, progressState } = engine.registerCheckoutOutcome('correct', total);

    checkout.reset();

    set((state) => ({
      money: state.money + total,
      totalSalesCount: state.totalSalesCount + 1,
      currentCart: [],
      checkoutTotal: 0,
      cashRegisterState,
      progressState,
    }));
  },
}));