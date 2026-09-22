import { randomUUID } from 'node:crypto';

export interface RuntimeValues {
  newId(): string;
  now(): string;
}

export const systemRuntimeValues: RuntimeValues = {
  newId: randomUUID,
  now: () => new Date().toISOString()
};
