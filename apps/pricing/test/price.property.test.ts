import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import fc from 'fast-check';
import { calculatePrice } from '../src/domain/price.ts';

const seed = 20260922;

describe(`calculatePrice properties (seed ${seed})`, () => {
  it('uses exact integer-cent multiplication for every valid quantity', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), (quantity) => {
        const quote = calculatePrice('WIDGET', quantity);
        assert.equal(quote.totalCents, quote.unitPriceCents * quantity);
        assert.ok(Number.isSafeInteger(quote.totalCents));
        assert.ok(quote.totalCents >= 0);
      }),
      { seed, numRuns: 100 }
    );
  });

  it('rejects every integer outside the supported quantity range', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.integer({ max: 0 }), fc.integer({ min: 101, max: 10_000 })),
        (quantity) => {
          assert.throws(() => calculatePrice('WIDGET', quantity));
        }
      ),
      { seed, numRuns: 100 }
    );
  });
});
