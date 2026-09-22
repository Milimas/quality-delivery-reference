export interface PriceQuote {
  sku: string;
  quantity: number;
  totalCents: number;
}

export interface PricingClient {
  quote(sku: string, quantity: number): Promise<PriceQuote>;
}
