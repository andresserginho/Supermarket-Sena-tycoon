export class Money {
  private readonly _amountCop: number;

  constructor(amountCop: number) {
    if (amountCop < 0) {
      throw new Error('El monto no puede ser negativo.');
    }
    this._amountCop = amountCop;
  }

  public get amount(): number {
    return this._amountCop;
  }

  public add(other: Money): Money {
    return new Money(this._amountCop + other.amount);
  }

  public subtract(other: Money): Money {
    return new Money(this._amountCop - other.amount);
  }
}