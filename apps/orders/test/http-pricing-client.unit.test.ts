import assert from 'node:assert/strict';
import { it } from 'node:test';
import { HttpPricingClient, PricingUnavailableError } from '../src/adapters/http-pricing-client.ts';

it('rejects a malformed successful pricing response', async () => {
  const client = new HttpPricingClient(
    'http://pricing.test',
    async () =>
      new Response(JSON.stringify({ sku: 'WIDGET', quantity: 2 }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
  );

  await assert.rejects(client.quote('WIDGET', 2), PricingUnavailableError);
});
