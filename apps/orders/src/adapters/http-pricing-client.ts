import type { PriceQuote, PricingClient } from '../ports/pricing.ts';

type Fetch = typeof globalThis.fetch;

export class PricingUnavailableError extends Error {
  override readonly name = 'PricingUnavailableError';
}

function isPriceQuote(value: unknown): value is PriceQuote {
  if (typeof value !== 'object' || value === null) return false;
  const quote = value as Record<string, unknown>;
  return (
    typeof quote.sku === 'string' &&
    Number.isInteger(quote.quantity) &&
    Number.isInteger(quote.totalCents) &&
    (quote.totalCents as number) >= 0
  );
}

export class HttpPricingClient implements PricingClient {
  readonly #baseUrl: string;
  readonly #fetch: Fetch;

  constructor(baseUrl: string, fetchImplementation: Fetch = globalThis.fetch) {
    this.#baseUrl = baseUrl.replace(/\/$/, '');
    this.#fetch = fetchImplementation;
  }

  async quote(sku: string, quantity: number): Promise<PriceQuote> {
    try {
      const response = await this.#fetch(`${this.#baseUrl}/v1/prices/quote`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sku, quantity }),
        signal: AbortSignal.timeout(3000)
      });
      if (!response.ok) throw new PricingUnavailableError(`Pricing returned ${response.status}`);
      const body: unknown = await response.json();
      if (!isPriceQuote(body)) throw new PricingUnavailableError('Pricing returned malformed data');
      return body;
    } catch (error) {
      if (error instanceof PricingUnavailableError) throw error;
      throw new PricingUnavailableError('Pricing request failed', { cause: error });
    }
  }
}
