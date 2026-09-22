import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createOrder } from '../src/domain/order.ts';
import { InMemoryOrderRepository } from './support/in-memory-order-repository.ts';

const fixedRuntime = {
  newId: () => '00000000-0000-4000-8000-000000000001',
  now: () => '2026-09-22T12:00:00.000Z'
};

describe('createOrder', () => {
  it('persists only after obtaining a valid quote', async () => {
    const repository = new InMemoryOrderRepository();
    const order = await createOrder(
      { sku: 'WIDGET', quantity: 2 },
      { quote: async () => ({ sku: 'WIDGET', quantity: 2, totalCents: 2500 }) },
      repository,
      fixedRuntime
    );

    assert.deepEqual(order, {
      id: '00000000-0000-4000-8000-000000000001',
      sku: 'WIDGET',
      quantity: 2,
      totalCents: 2500,
      createdAt: '2026-09-22T12:00:00.000Z'
    });
    assert.deepEqual(await repository.findById(order.id), order);
  });

  it('does not persist when pricing fails', async () => {
    const repository = new InMemoryOrderRepository();
    let runtimeCalls = 0;
    const runtime = {
      newId: () => {
        runtimeCalls += 1;
        return fixedRuntime.newId();
      },
      now: () => {
        runtimeCalls += 1;
        return fixedRuntime.now();
      }
    };
    await assert.rejects(
      createOrder(
        { sku: 'WIDGET', quantity: 2 },
        {
          quote: async () => {
            throw new Error('pricing offline');
          }
        },
        repository,
        runtime
      ),
      /pricing offline/
    );
    assert.equal(await repository.findById(fixedRuntime.newId()), undefined);
    assert.equal(runtimeCalls, 0);
  });
});
