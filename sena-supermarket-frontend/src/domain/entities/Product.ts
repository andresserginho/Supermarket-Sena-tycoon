/**
 * DTO / Propiedades requeridas para la creación de un Producto.
 */
export interface ProductProps {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  price: number;
  weight: number; // Expresado en kilogramos
}

/**
 * Entidad de Dominio: Product
 * Representa el modelo real de un producto dentro del catálogo del supermercado.
 * Implementa validación defensiva en runtime e inmutabilidad estricta.
 */
export class Product {
  public readonly id: string;
  public readonly sku: string;
  public readonly barcode: string;
  public readonly name: string;
  public readonly price: number;
  public readonly weight: number;

  constructor(props: ProductProps) {
    // 1. Ejecutar validaciones defensivas antes de asignar valores
    this.validate(props);

    // 2. Asignación inmutable de atributos
    this.id = props.id;
    this.sku = props.sku;
    this.barcode = props.barcode;
    this.name = props.name;
    this.price = props.price;
    this.weight = props.weight;
  }

  /**
   * Valida que las reglas básicas de negocio se cumplan al instanciar.
   * Lanza un error explícito de dominio si algún dato es inconsistente.
   */
  private validate(props: ProductProps): void {
    if (!props.id || props.id.trim() === '') {
      throw new Error('[Domain Error] El ID del producto es obligatorio.');
    }

    if (!props.barcode || props.barcode.trim() === '') {
      throw new Error('[Domain Error] El código de barras es obligatorio para escaneo.');
    }

    if (!props.sku || props.sku.trim() === '') {
      throw new Error('[Domain Error] El SKU de inventario no es válido.');
    }

    if (props.price < 0) {
      throw new Error('[Domain Error] El precio del producto no puede ser negativo.');
    }

    if (props.weight <= 0) {
      throw new Error('[Domain Error] El peso del producto debe ser mayor a 0 kg.');
    }
  }

  /**
   * --- MÉTODOS DE DOMINIO (Comportamiento) ---
   */

  /**
   * Verifica si un código de barras escaneado coincide con este producto.
   */
  public matchesBarcode(scannedBarcode: string): boolean {
    return this.barcode === scannedBarcode.trim();
  }

  /**
   * Retorna el precio formateado según la moneda requerida.
   */
  public getFormattedPrice(currency: string = 'COP', locale: string = 'es-CO'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(this.price);
  }

  /**
   * Convierte la entidad de dominio a un objeto plano (DTO)
   * útil para serialización o envío a APIs externas/Zustand Store.
   */
  public toDTO(): ProductProps {
    return {
      id: this.id,
      sku: this.sku,
      barcode: this.barcode,
      name: this.name,
      price: this.price,
      weight: this.weight,
    };
  }
}