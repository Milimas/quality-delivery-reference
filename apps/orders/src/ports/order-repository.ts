export interface Order {
  id: string;
  sku: string;
  quantity: number;
  totalCents: number;
  createdAt: string;
}

export interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: string): Promise<Order | undefined>;
}
