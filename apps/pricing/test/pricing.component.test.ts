import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { buildPricingApp } from '../src/http/build-app.ts';

describe('pricing HTTP API', () => {
  const apps: ReturnType<typeof buildPricingApp>[] = [];

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()));
  });

  it('returns a quote through its public boundary', async () => {
    const app = buildPricingApp();
    apps.push(app);

    const response = await app.inject({
      method: 'POST',
      url: '/v1/prices/quote',
      payload: { sku: 'WIDGET', quantity: 2 }
    });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), {
      sku: 'WIDGET',
      quantity: 2,
      unitPriceCents: 1250,
      totalCents: 2500
    });
  });

  it('rejects an unknown SKU without exposing internals', async () => {
    const app = buildPricingApp();
    apps.push(app);

    const response = await app.inject({
      method: 'POST',
      url: '/v1/prices/quote',
      payload: { sku: 'NOPE', quantity: 1 }
    });

    assert.equal(response.statusCode, 404);
    assert.deepEqual(response.json(), { code: 'SKU_NOT_FOUND', message: 'Unknown SKU' });
  });

  it('reports health without external dependencies', async () => {
    const app = buildPricingApp();
    apps.push(app);
    const response = await app.inject({ method: 'GET', url: '/health' });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), { status: 'ok' });
  });
});
