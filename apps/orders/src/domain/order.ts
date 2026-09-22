import type { Order, OrderRepository } from '../ports/order-repository.ts';
import type { PricingClient } from '../ports/pricing.ts';
import type { RuntimeValues } from '../ports/runtime.ts';

export interface CreateOrderInput {
  sku: string;
  quantity: number;
}

export class InvalidOrderError extends Error {
  override readonly name = 'InvalidOrderError';
}

export async function createOrder(
  input: CreateOrderInput,
  pricing: PricingClient,
  repository: OrderRepository,
  runtime: RuntimeValues
): Promise<Order> {
  if (input.sku.trim().length === 0) {
    throw new InvalidOrderError('SKU is required');
  }
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 100) {
    throw new InvalidOrderError('Quantity must be an integer between 1 and 100');
  }

  const quote = await pricing.quote(input.sku, input.quantity);
  const order: Order = {
    id: runtime.newId(),
    sku: input.sku,
    quantity: input.quantity,
    totalCents: quote.totalCents,
    createdAt: runtime.now()
  };
  await repository.save(order);
  return order;
}
