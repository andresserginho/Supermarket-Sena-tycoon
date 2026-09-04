export interface PlayerState {
  health: number;
  hunger: number;
  thirst: number;
  energy: number; // NUEVO — esto es lo que el HUD llama "Energía", para el sueño
}

export interface ProgressState {
  day: number;
  level: number;
  reputation: number; // 0-100, se evalúa al cierre de cada día
}

export interface CashRegisterState {
  expectedTotal: number; // lo que debería haber según las ventas
  actualTotal: number;   // lo que realmente quedó en caja tras dar vueltos
}

// Resultado de una interacción de cobro con un NPC en la caja registradora
export type CheckoutOutcome =
  | 'correct'                // cobró y dio vueltos correctamente
  | 'overcharged_customer'   // cobró de más → NPC se pone bravo
  | 'wrong_change_short'     // dio menos vueltos de lo debido → NPC se pone bravo
  | 'wrong_change_over'      // dio más vueltos de lo debido → NPC no se queja, pero descuadra caja
  | 'helped_find_product'    // ayudó a un NPC a encontrar un producto
  | 'failed_to_help';        // no supo ayudar / lo dejó esperando

const REPUTATION_THRESHOLD_TO_LEVEL_UP = 60; // ajustable: mínimo de reputación diaria para subir de nivel

export class SimulationEngine {
  private playerState: PlayerState;
  private progressState: ProgressState;
  private cashRegisterState: CashRegisterState;
  private dailyReputationEvents: number[]; // acumulador de puntos del día en curso

  constructor() {
    this.playerState = {
      health: 100,
      hunger: 100,
      thirst: 100,
      energy: 100,
    };
    this.progressState = {
      day: 1,
      level: 1,
      reputation: 100,
    };
    this.cashRegisterState = {
      expectedTotal: 0,
      actualTotal: 0,
    };
    this.dailyReputationEvents = [];
  }

  public handleCarImpact(damage: number = 15): PlayerState {
    this.playerState.health = Math.max(0, this.playerState.health - damage);
    return this.getPlayerState();
  }

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
   * El jugador duerme en la habitación del piso más alto. Restaura energía
   * y hambre/sed parcialmente, y dispara el cierre del día.
   */
  public sleep(): { playerState: PlayerState; progressState: ProgressState } {
    this.playerState.energy = 100;
    this.playerState.hunger = Math.min(100, this.playerState.hunger + 40);
    this.playerState.thirst = Math.min(100, this.playerState.thirst + 40);
    const progressState = this.evaluateDayEnd();
    return { playerState: this.getPlayerState(), progressState };
  }

  /**
   * Registra una interacción de atención al cliente/caja y ajusta
   * reputación y/o el descuadre de la caja registradora.
   */
  public registerCheckoutOutcome(
    outcome: CheckoutOutcome,
    saleAmount: number = 0,
    changeDelta: number = 0 // diferencia de vueltos dada de más (solo aplica en wrong_change_over)
  ): { progressState: ProgressState; cashRegisterState: CashRegisterState } {
    this.cashRegisterState.expectedTotal += saleAmount;

    switch (outcome) {
      case 'correct':
        this.cashRegisterState.actualTotal += saleAmount;
        this.dailyReputationEvents.push(+3);
        break;
      case 'overcharged_customer':
        this.cashRegisterState.actualTotal += saleAmount; // caja cuadra, pero el cliente se queja
        this.dailyReputationEvents.push(-8);
        break;
      case 'wrong_change_short':
        this.cashRegisterState.actualTotal += saleAmount; // cuadra en caja, cliente se queja
        this.dailyReputationEvents.push(-8);
        break;
      case 'wrong_change_over':
        // el NPC no se queja (reputación no baja), pero sale plata de más de la caja
        this.cashRegisterState.actualTotal += saleAmount - changeDelta;
        break;
      case 'helped_find_product':
        this.dailyReputationEvents.push(+5);
        break;
      case 'failed_to_help':
        this.dailyReputationEvents.push(-5);
        break;
    }

    return {
      progressState: this.getProgressState(),
      cashRegisterState: this.getCashRegisterState(),
    };
  }

  /**
   * Se llama al cerrar la tienda / cuando el jugador se duerme.
   * El día SIEMPRE avanza. El nivel solo avanza si la reputación
   * promedio del día alcanzó el umbral mínimo.
   */
  private evaluateDayEnd(): ProgressState {
    const avgReputation =
      this.dailyReputationEvents.length > 0
        ? this.dailyReputationEvents.reduce((a, b) => a + b, 0) / this.dailyReputationEvents.length
        : 0;

    // La reputación se desplaza hacia el promedio del día, sin resetear de golpe
    this.progressState.reputation = Math.max(
      0,
      Math.min(100, this.progressState.reputation + avgReputation)
    );

    this.progressState.day += 1;
    if (this.progressState.reputation >= REPUTATION_THRESHOLD_TO_LEVEL_UP) {
      this.progressState.level += 1;
    }

    this.dailyReputationEvents = [];
    return this.getProgressState();
  }

  public getPlayerState(): PlayerState {
    return { ...this.playerState };
  }

  /**
   * Sobrescribe parcialmente el estado del jugador. Usado por ejemplo por el
   * flujo de "recuperar vida pagando" en SupermarketScene.
   */
  public setPlayerState(partial: Partial<PlayerState>): PlayerState {
    this.playerState = { ...this.playerState, ...partial };
    return this.getPlayerState();
  }

  public getProgressState(): ProgressState {
    return { ...this.progressState };
  }

  public getCashRegisterState(): CashRegisterState {
    return { ...this.cashRegisterState };
  }
}