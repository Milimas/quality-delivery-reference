import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { PricingUnavailableError } from '../src/adapters/http-pricing-client.ts';
import { buildOrdersApp } from '../src/http/build-app.ts';
import type { Order, OrderRepository } from '../src/ports/order-repository.ts';

const fixedRuntime = {
  newId: () => '00000000-0000-4000-8000-000000000001',
  now: () => '2026-09-22T12:00:00.000Z'
};

class RecordingRepository implements OrderRepository {
  readonly saved: Order[] = [];

  async save(order: Order): Promise<void> {
    this.saved.push(order);
  }

  async findById(id: string): Promise<Order | undefined> {
    return this.saved.find((order) => order.id === id);
  }
}

describe('orders HTTP API', () => {
  const apps: ReturnType<typeof buildOrdersApp>[] = [];

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()));
  });

  it('does not persist when pricing is unavailable', async () => {
    const repository = new RecordingRepository();
    const app = buildOrdersApp({
      repository,
      pricing: {
        quote: async () => {
          throw new PricingUnavailableError('pricing offline');
        }
      },
      runtime: fixedRuntime
    });
    apps.push(app);

    const response = await app.inject({
      method: 'POST',
      url: '/v1/orders',
      payload: { sku: 'WIDGET', quantity: 2 }
    });

    assert.equal(response.statusCode, 502);
    assert.deepEqual(response.json(), {
      code: 'PRICING_UNAVAILABLE',
      message: 'Pricing is temporarily unavailable'
    });
    assert.deepEqual(repository.saved, []);
  });

  it('creates and retrieves an order', async () => {
    const repository = new RecordingRepository();
    const app = buildOrdersApp({
      repository,
      pricing: { quote: async () => ({ sku: 'WIDGET', quantity: 2, totalCents: 2500 }) },
      runtime: fixedRuntime
    });
    apps.push(app);

    const created = await app.inject({
      method: 'POST',
      url: '/v1/orders',
      payload: { sku: 'WIDGET', quantity: 2 }
    });
    const fetched = await app.inject({ method: 'GET', url: `/v1/orders/${created.json().id}` });

    assert.equal(created.statusCode, 201);
    assert.deepEqual(created.json(), {
      id: '00000000-0000-4000-8000-000000000001',
      sku: 'WIDGET',
      quantity: 2,
      totalCents: 2500,
      createdAt: '2026-09-22T12:00:00.000Z'
    });
    assert.deepEqual(fetched.json(), created.json());
  });
});
