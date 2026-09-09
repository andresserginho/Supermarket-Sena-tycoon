export const SUPERMARKET_BOUNDS = {
  minX: -22.5,
  maxX: -9.5,
  minZ: -14,
  maxZ: 14,
};

export function setSupermarketBounds(minX: number, maxX: number, minZ: number, maxZ: number) {
  SUPERMARKET_BOUNDS.minX = minX;
  SUPERMARKET_BOUNDS.maxX = maxX;
  SUPERMARKET_BOUNDS.minZ = minZ;
  SUPERMARKET_BOUNDS.maxZ = maxZ;
}

export const isInsideSupermarket = (x: number, z: number) =>
  x >= SUPERMARKET_BOUNDS.minX &&
  x <= SUPERMARKET_BOUNDS.maxX &&
  z >= SUPERMARKET_BOUNDS.minZ &&
  z <= SUPERMARKET_BOUNDS.maxZ;