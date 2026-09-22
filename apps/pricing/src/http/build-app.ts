import Fastify, { type FastifyInstance } from 'fastify';
import { calculatePrice, InvalidQuantityError, UnknownSkuError } from '../domain/price.ts';

interface QuoteBody {
  sku: string;
  quantity: number;
}

export function buildPricingApp(): FastifyInstance {
  const app = Fastify({ logger: false });

  app.get('/health', async () => ({ status: 'ok' }));

  app.post<{ Body: QuoteBody }>(
    '/v1/prices/quote',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['sku', 'quantity'],
          properties: {
            sku: { type: 'string', minLength: 1 },
            quantity: { type: 'integer', minimum: 1, maximum: 100 }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        return calculatePrice(request.body.sku, request.body.quantity);
      } catch (error) {
        if (error instanceof UnknownSkuError) {
          return reply.code(404).send({ code: 'SKU_NOT_FOUND', message: error.message });
        }
        if (error instanceof InvalidQuantityError) {
          return reply.code(400).send({ code: 'INVALID_QUANTITY', message: error.message });
        }
        throw error;
      }
    }
  );

  return app;
}
