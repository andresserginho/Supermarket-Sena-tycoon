// src/application/store/useSimulationStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '../../domain/entities/Product';
import { isInsideSupermarket } from '../data/supermarketBounds';

export interface SimulationPlayerState {
  level: number;
  health: number;
  hunger: number;
  thirst: number;
  energy: number;
}

export interface DeliveryItem {
  productId: string;
  productName?: string;
  quantity: number;
}

export interface DeliveryBoxType {
  id: string;
  items: DeliveryItem[];
  position: [number, number, number];
  deliveryTimeGameHours?: number;
}

export interface LooseProduct {
  id: string;
  productId: string;
  position: [number, number, number];
  supportY?: number;
}

export interface OwnedFurnitureState {
  uid: string;
  catalogId: string;
  color?: string;
}

export interface PlacedFurnitureState extends OwnedFurnitureState {
  model: string;
  position: [number, number, number];
  rotation: [number, number, number];
}

export interface SimulationState {
  money: number;
  totalSalesCount: number;
  playerState: SimulationPlayerState;
  cart: Product[];
  deliveryBoxes: DeliveryBoxType[];
  heldBox: DeliveryBoxType | null;
  heldProduct: { productId: string; quantity: number } | null;
  looseProducts: LooseProduct[];
  furnitureInventory: OwnedFurnitureState[];
  placedFurniture: PlacedFurnitureState[];
  holdingFurniture: (OwnedFurnitureState & { model: string }) | null;
  isHandFull: boolean;

  // Acciones
  addToCart: (product: Product) => void;
  addDeliveryBox: (items: DeliveryItem[], position?: [number, number, number]) => boolean;
  pickUpBox: (box: DeliveryBoxType) => void;
  pickUpProduct: (productId: string) => void;
  dropBox: (dropPosition: [number, number, number]) => void;
  dropProduct: (dropPosition: [number, number, number], supportY?: number) => void;
  pickUpLooseProduct: (product: LooseProduct) => void;
  removeDeliveryBox: (boxId: string) => void;
  clearAllBoxes: () => void;
  setFurnitureInventory: (items: OwnedFurnitureState[]) => void;
  setPlacedFurniture: (items: PlacedFurnitureState[]) => void;
}

const MAX_TOTAL_DELIVERY_BOXES = 18; // Matriz 3 columnas x 2 filas x 3 pisos
const BOX_SPACING_X = 0.55;
const BOX_SPACING_Z = 0.55;
const BOX_FLOOR_Y = 0.081;
const BASE_DELIVERY_POS: [number, number, number] = [-7.4, BOX_FLOOR_Y, 0.8]; // Andén, hacia el supermercado

function isOccupied(position: [number, number, number], boxes: DeliveryBoxType[], products: LooseProduct[]) {
  return boxes.some((box) =>
    Math.abs(box.position[0] - position[0]) < 0.48 && Math.abs(box.position[2] - position[2]) < 0.48 &&
    Math.abs(box.position[1] - position[1]) < 0.34
  ) || products.some((product) =>
    Math.abs(product.position[0] - position[0]) < 0.18 &&
    Math.abs(product.position[1] - position[1]) < 0.18 &&
    Math.abs(product.position[2] - position[2]) < 0.18
  );
}

function findFreeDropPosition(position: [number, number, number], boxes: DeliveryBoxType[], products: LooseProduct[]) {
  const candidates: [number, number, number][] = [
    position,
    [position[0] + 0.35, position[1], position[2]],
    [position[0] - 0.35, position[1], position[2]],
    [position[0], position[1], position[2] + 0.35],
    [position[0], position[1], position[2] - 0.35],
  ];
  return candidates.find((candidate) => !isOccupied(candidate, boxes, products)) || candidates[1];
}

export const useSimulationStore = create<SimulationState>()(
  persist(
    (set, get) => ({
      money: 50000,
      totalSalesCount: 0,
      playerState: {
        level: 1,
        health: 100,
        hunger: 100,
        thirst: 100,
        energy: 100,
      },
      cart: [],
      deliveryBoxes: [],
      heldBox: null,
      heldProduct: null,
      looseProducts: [],
      furnitureInventory: [],
      placedFurniture: [],
      holdingFurniture: null,
      isHandFull: false,

      addToCart: (product: Product) => {
        set((state) => ({ cart: [...state.cart, product] }));
      },

      addDeliveryBox: (items: DeliveryItem[], position?: [number, number, number]) => {
        const currentBoxes = get().deliveryBoxes || [];

        // 1. Validación de Capacidad Máxima
        if (currentBoxes.length >= MAX_TOTAL_DELIVERY_BOXES) {
          alert("Pon tus productos para poder hacer más pedido");
          return false; // Rechaza la creación del pedido
        }

        // 2. Cálculo automático de ubicación en la matriz (3 columnas x 2 filas x 3 pisos)
        const boxIndex = currentBoxes.length;
        const col = boxIndex % 3;
        const row = Math.floor(boxIndex / 3) % 2;
        const stackLevel = Math.floor(boxIndex / 6);

        const spawnX = position?.[0] ?? BASE_DELIVERY_POS[0] + col * BOX_SPACING_X;
        const spawnY = position?.[1] ?? BASE_DELIVERY_POS[1] + stackLevel * 0.32;
        const spawnZ = position?.[2] ?? BASE_DELIVERY_POS[2] + row * BOX_SPACING_Z;

        const newBox: DeliveryBoxType = {
          id: `box_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          items: items.map((item) => ({ ...item })),
          position: [spawnX, spawnY, spawnZ],
          deliveryTimeGameHours: Date.now(),
        };

        set((state) => ({
          deliveryBoxes: [...(state.deliveryBoxes || []), newBox],
        }));

        return true; // Pedido procesado exitosamente
      },

      pickUpBox: (boxToPick: DeliveryBoxType) => {
        const { isHandFull, deliveryBoxes } = get();
        if (isHandFull) return;

        const hasBoxAbove = deliveryBoxes.some((box) => {
          const sameColumn = Math.abs(box.position[0] - boxToPick.position[0]) < 0.46;
          const sameRow = Math.abs(box.position[2] - boxToPick.position[2]) < 0.46;
          return box.id !== boxToPick.id && sameColumn && sameRow && box.position[1] > boxToPick.position[1] + 0.1;
        });
        if (hasBoxAbove) return;

        set({
          heldBox: boxToPick,
          heldProduct: null,
          isHandFull: true,
          deliveryBoxes: (deliveryBoxes || []).filter((b) => b.id !== boxToPick.id),
        });
      },

      pickUpProduct: (productId: string) => {
        const { isHandFull } = get();
        if (isHandFull) return;

        set({
          heldBox: null,
          heldProduct: { productId, quantity: 1 },
          isHandFull: true,
        });
      },

      dropBox: (dropPosition: [number, number, number]) => {
        const { heldBox, deliveryBoxes } = get();
        if (!heldBox) return;

        const landingPosition = findFreeDropPosition(
          [dropPosition[0], Math.max(BOX_FLOOR_Y, dropPosition[1]), dropPosition[2]],
          deliveryBoxes,
          get().looseProducts,
        );

        const droppedBox: DeliveryBoxType = {
          ...heldBox,
          position: landingPosition,
        };

        set({
          heldBox: null,
          isHandFull: false,
          deliveryBoxes: [...(deliveryBoxes || []), droppedBox],
        });
      },

      dropProduct: (dropPosition: [number, number, number], supportY?: number) => {
        const { heldProduct, deliveryBoxes, looseProducts } = get();
        if (!heldProduct) return;

        if (!isInsideSupermarket(dropPosition[0], dropPosition[2])) return;

        const landingPosition = findFreeDropPosition(
          [dropPosition[0], Math.max(0.19, dropPosition[1]), dropPosition[2]],
          deliveryBoxes,
          looseProducts,
        );

        set({
          heldProduct: null,
          isHandFull: false,
          looseProducts: [
            ...get().looseProducts,
            {
              id: `loose_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              productId: heldProduct.productId,
              position: landingPosition,
              supportY,
            },
          ],
        });
      },

      pickUpLooseProduct: (product: LooseProduct) => {
        const { isHandFull } = get();
        if (isHandFull) return;

        set((state) => ({
          heldBox: null,
          heldProduct: { productId: product.productId, quantity: 1 },
          isHandFull: true,
          looseProducts: state.looseProducts.filter((item) => item.id !== product.id),
        }));
      },

      removeDeliveryBox: (boxId: string) => {
        set((state) => ({
          deliveryBoxes: (state.deliveryBoxes || []).filter((b) => b.id !== boxId),
        }));
      },

      clearAllBoxes: () => {
        set({
          deliveryBoxes: [],
          heldBox: null,
          heldProduct: null,
          looseProducts: [],
          isHandFull: false,
        });
      },

      setFurnitureInventory: (items) => set({ furnitureInventory: items }),
      setPlacedFurniture: (items) => set({ placedFurniture: items }),
    }),
    {
      name: 'simulation-store-storage',
      partialize: (state) => ({
        money: state.money,
        totalSalesCount: state.totalSalesCount,
        playerState: state.playerState,
        cart: state.cart,
        deliveryBoxes: state.deliveryBoxes,
        looseProducts: state.looseProducts,
        furnitureInventory: state.furnitureInventory,
        placedFurniture: state.placedFurniture,
      }),
    }
  )
);