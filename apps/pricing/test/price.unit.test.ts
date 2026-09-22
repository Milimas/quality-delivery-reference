import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calculatePrice } from '../src/domain/price.ts';

describe('calculatePrice', () => {
  it('calculates an integer-cent quote', () => {
    assert.deepEqual(calculatePrice('WIDGET', 3), {
      sku: 'WIDGET',
      quantity: 3,
      unitPriceCents: 1250,
      totalCents: 3750
    });
  });

  it('rejects unknown SKUs', () => {
    assert.throws(() => calculatePrice('NOPE', 1), /Unknown SKU/);
  });

  for (const quantity of [0, 1.5, 101]) {
    it(`rejects invalid quantity ${quantity}`, () => {
      assert.throws(
        () => calculatePrice('WIDGET', quantity),
        /Quantity must be an integer between 1 and 100/
      );
    });
  }
});
