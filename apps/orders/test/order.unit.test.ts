import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createOrder } from '../src/domain/order.ts';
import type { Order, OrderRepository } from '../src/ports/order-repository.ts';

class RecordingRepository implements OrderRepository {
  readonly saved: Order[] = [];

  async save(order: Order): Promise<void> {
    this.saved.push(order);
  }

  async findById(id: string): Promise<Order | undefined> {
    return this.saved.find((order) => order.id === id);
  }
}

describe('createOrder', () => {
  it('persists only after obtaining a valid quote', async () => {
    const repository = new RecordingRepository();
    const order = await createOrder(
      { sku: 'WIDGET', quantity: 2 },
      { quote: async () => ({ sku: 'WIDGET', quantity: 2, totalCents: 2500 }) },
      repository
    );

    assert.equal(order.totalCents, 2500);
    assert.match(order.id, /^[0-9a-f-]{36}$/);
    assert.deepEqual(repository.saved, [order]);
  });

  it('does not persist when pricing fails', async () => {
    const repository = new RecordingRepository();
    await assert.rejects(
      createOrder(
        { sku: 'WIDGET', quantity: 2 },
        {
          quote: async () => {
            throw new Error('pricing offline');
          }
        },
        repository
      ),
      /pricing offline/
    );
    assert.deepEqual(repository.saved, []);
  });
});
