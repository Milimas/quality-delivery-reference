import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Order, OrderRepository } from '../../src/ports/order-repository.ts';

const order: Order = {
  id: '00000000-0000-4000-8000-000000000001',
  sku: 'WIDGET',
  quantity: 2,
  totalCents: 2500,
  createdAt: '2026-09-22T12:00:00.000Z'
};

export function orderRepositoryContract(
  name: string,
  createRepository: () => Promise<OrderRepository>,
  reset: () => Promise<void>
): void {
  describe(`${name} OrderRepository contract`, () => {
    it('returns undefined for an absent order', async () => {
      await reset();
      assert.equal(await (await createRepository()).findById(order.id), undefined);
    });

    it('round-trips every order field', async () => {
      await reset();
      const repository = await createRepository();
      await repository.save(order);
      assert.deepEqual(await repository.findById(order.id), order);
    });

    it('rejects a duplicate primary key', async () => {
      await reset();
      const repository = await createRepository();
      await repository.save(order);
      await assert.rejects(repository.save(order));
    });
  });
}
