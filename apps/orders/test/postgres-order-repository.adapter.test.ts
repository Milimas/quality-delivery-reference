import { after } from 'node:test';
import pg from 'pg';
import { PostgresOrderRepository } from '../src/adapters/postgres-order-repository.ts';
import { orderRepositoryContract } from './support/order-repository-contract.ts';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for the PostgreSQL adapter contract');
}

const pool = new pg.Pool({ connectionString: databaseUrl });
const repository = new PostgresOrderRepository(pool);

after(async () => pool.end());

orderRepositoryContract(
  'PostgreSQL',
  async () => repository,
  async () => {
    await pool.query('TRUNCATE orders');
  }
);
