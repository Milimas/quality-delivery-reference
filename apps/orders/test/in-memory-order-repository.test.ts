import { InMemoryOrderRepository } from './support/in-memory-order-repository.ts';
import { orderRepositoryContract } from './support/order-repository-contract.ts';

const repository = new InMemoryOrderRepository();

orderRepositoryContract(
  'in-memory',
  async () => repository,
  async () => repository.clear()
);
