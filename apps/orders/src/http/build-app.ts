import Fastify, { type FastifyInstance } from 'fastify';
import { PricingUnavailableError } from '../adapters/http-pricing-client.ts';
import { createOrder, InvalidOrderError } from '../domain/order.ts';
import type { OrderRepository } from '../ports/order-repository.ts';
import type { PricingClient } from '../ports/pricing.ts';

export interface OrdersDependencies {
  repository: OrderRepository;
  pricing: PricingClient;
}

interface CreateOrderBody {
  sku: string;
  quantity: number;
}

export function buildOrdersApp(dependencies: OrdersDependencies): FastifyInstance {
  const app = Fastify({ logger: false });

  app.get('/health', async () => ({ status: 'ok' }));

  app.post<{ Body: CreateOrderBody }>(
    '/v1/orders',
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
        const order = await createOrder(
          request.body,
          dependencies.pricing,
          dependencies.repository
        );
        return reply.code(201).send(order);
      } catch (error) {
        if (error instanceof PricingUnavailableError) {
          return reply.code(502).send({
            code: 'PRICING_UNAVAILABLE',
            message: 'Pricing is temporarily unavailable'
          });
        }
        if (error instanceof InvalidOrderError) {
          return reply.code(400).send({ code: 'INVALID_ORDER', message: error.message });
        }
        throw error;
      }
    }
  );

  app.get<{ Params: { id: string } }>('/v1/orders/:id', async (request, reply) => {
    const order = await dependencies.repository.findById(request.params.id);
    if (!order)
      return reply.code(404).send({ code: 'ORDER_NOT_FOUND', message: 'Order not found' });
    return order;
  });

  return app;
}
