export interface PriceResult {
  sku: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
}

export class UnknownSkuError extends Error {
  override readonly name = 'UnknownSkuError';
}

export class InvalidQuantityError extends Error {
  override readonly name = 'InvalidQuantityError';
}

const catalog: Readonly<Record<string, number>> = Object.freeze({
  WIDGET: 1250,
  GADGET: 2199
});

export function calculatePrice(sku: string, quantity: number): PriceResult {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
    throw new InvalidQuantityError('Quantity must be an integer between 1 and 100');
  }

  const unitPriceCents = catalog[sku];
  if (unitPriceCents === undefined) {
    throw new UnknownSkuError('Unknown SKU');
  }

  return { sku, quantity, unitPriceCents, totalCents: unitPriceCents * quantity };
}
