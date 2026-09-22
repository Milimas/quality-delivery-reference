import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fetchJson } from '../support/http.mjs';

const ordersUrl = process.env.ORDERS_TEST_URL ?? 'http://127.0.0.1:3000';

test('creates and retrieves a priced order through the public boundary', async () => {
  const created = await fetchJson(`${ordersUrl}/v1/orders`, {
    method: 'POST',
    body: JSON.stringify({ sku: 'WIDGET', quantity: 2 }),
    headers: { 'content-type': 'application/json' }
  });

  assert.equal(created.status, 201);
  assert.equal(created.body.totalCents, 2500);

  const fetched = await fetchJson(`${ordersUrl}/v1/orders/${created.body.id}`);
  assert.equal(fetched.status, 200);
  assert.deepEqual(fetched.body, created.body);
});
