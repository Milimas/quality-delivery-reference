import type { Order, OrderRepository } from '../../src/ports/order-repository.ts';

export class InMemoryOrderRepository implements OrderRepository {
  readonly #orders = new Map<string, Order>();

  async save(order: Order): Promise<void> {
    if (this.#orders.has(order.id)) {
      throw new Error('duplicate order id');
    }
    this.#orders.set(order.id, order);
  }

  async findById(id: string): Promise<Order | undefined> {
    return this.#orders.get(id);
  }

  clear(): void {
    this.#orders.clear();
  }
}
