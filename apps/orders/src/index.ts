import pg from 'pg';
import { HttpPricingClient } from './adapters/http-pricing-client.ts';
import { PostgresOrderRepository } from './adapters/postgres-order-repository.ts';
import { buildOrdersApp } from './http/build-app.ts';
import { systemRuntimeValues } from './ports/runtime.ts';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const repository = new PostgresOrderRepository(pool);
const pricing = new HttpPricingClient(process.env.PRICING_URL ?? 'http://127.0.0.1:3001');
const app = buildOrdersApp({ repository, pricing, runtime: systemRuntimeValues });
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '127.0.0.1';

const shutdown = async () => {
  await app.close();
  await pool.end();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  await pool.end();
  process.exit(1);
}
