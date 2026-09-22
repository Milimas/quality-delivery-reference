import type { Pool } from 'pg';
import type { Order, OrderRepository } from '../ports/order-repository.ts';

interface OrderRow {
  id: string;
  sku: string;
  quantity: number;
  total_cents: number;
  created_at: Date;
}

export class PostgresOrderRepository implements OrderRepository {
  readonly #pool: Pool;

  constructor(pool: Pool) {
    this.#pool = pool;
  }

  async save(order: Order): Promise<void> {
    await this.#pool.query(
      'INSERT INTO orders (id, sku, quantity, total_cents, created_at) VALUES ($1, $2, $3, $4, $5)',
      [order.id, order.sku, order.quantity, order.totalCents, order.createdAt]
    );
  }

  async findById(id: string): Promise<Order | undefined> {
    const result = await this.#pool.query<OrderRow>(
      'SELECT id, sku, quantity, total_cents, created_at FROM orders WHERE id = $1',
      [id]
    );
    const row = result.rows[0];
    if (!row) return undefined;
    return {
      id: row.id,
      sku: row.sku,
      quantity: row.quantity,
      totalCents: row.total_cents,
      createdAt: row.created_at.toISOString()
    };
  }
}
