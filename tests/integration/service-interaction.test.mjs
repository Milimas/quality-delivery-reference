import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fetchJson } from '../support/http.mjs';

const pricingUrl = process.env.PRICING_TEST_URL ?? 'http://127.0.0.1:3001';

test('pricing serves the contract used by orders', async () => {
  const response = await fetchJson(`${pricingUrl}/v1/prices/quote`, {
    method: 'POST',
    body: JSON.stringify({ sku: 'GADGET', quantity: 2 }),
    headers: { 'content-type': 'application/json' }
  });

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, {
    sku: 'GADGET',
    quantity: 2,
    unitPriceCents: 2199,
    totalCents: 4398
  });
});
