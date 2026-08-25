export interface PlayerState {
  health: number;
  hunger: number;
  thirst: number;
}

export class SimulationEngine {
  private playerState: PlayerState;

  constructor() {
    this.playerState = {
      health: 100,
      hunger: 20,
      thirst: 100,
    };
  }

  /**
   * Procesa el daño por impacto de un vehículo en la simulación.
   */
  public handleCarImpact(damage: number = 15): PlayerState {
    this.playerState.health = Math.max(0, this.playerState.health - damage);
    return this.getPlayerState();
  }

  /**
   * Recupera métricas del jugador consumiendo ítems de comida o agua.
   */
  public consumeItem(type: 'FOOD' | 'WATER', amount: number = 25): PlayerState {
    if (type === 'FOOD') {
      this.playerState.hunger = Math.min(100, this.playerState.hunger + amount);
      this.playerState.health = Math.min(100, this.playerState.health + 10);
    } else if (type === 'WATER') {
      this.playerState.thirst = Math.min(100, this.playerState.thirst + amount);
      this.playerState.health = Math.min(100, this.playerState.health + 5);
    }
    return this.getPlayerState();
  }

  /**
   * Sobrescribe el estado del jugador (usado al cargar progreso guardado).
   */
  public setPlayerState(state: Partial<PlayerState>): PlayerState {
    this.playerState = { ...this.playerState, ...state };
    return this.getPlayerState();
  }

  /**
   * Retorna una copia inmutable del estado del jugador.
   */
  public getPlayerState(): PlayerState {
    return { ...this.playerState };
  }
}