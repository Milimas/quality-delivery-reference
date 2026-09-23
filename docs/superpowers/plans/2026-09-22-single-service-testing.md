# Single-Service Testing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Orders and Pricing services demonstrate deterministic core tests, honest fakes, focused real-adapter tests, seeded property tests, and an evidence matrix that claims only executable behavior.

**Architecture:** Orders receives clock and ID ports and uses one reusable in-memory repository fake. A shared repository behavior suite runs against both the fake and PostgreSQL implementation. Pricing uses seeded `fast-check` properties in addition to examples. Documentation classifies each stage as executable, demonstration, external, or not implemented.

**Tech Stack:** TypeScript 6, Node.js 24 test runner, Fastify, PostgreSQL 17, `fast-check`, Docker Compose, pnpm, Markdown.

**Spec:** `docs/superpowers/specs/2026-09-22-full-framework-demo-design.md`

## Global Constraints

- Host prerequisites remain Git, Docker Compose, Make, and a POSIX shell.
- Tests have no implicit retry and randomized failures print their reproducible seed.
- Production wiring uses system time and UUIDs; tests use injected deterministic values.
- A fake is accepted only after it passes the same behavior suite as the real adapter.
- PostgreSQL adapter tests run against a disposable real PostgreSQL instance.
- Documentation cannot label an unimplemented concern executable or configurable.
- No production environment or deployment is claimed.

## Review Focus

- A supplied ID or timestamp must be used unchanged through persistence and HTTP serialization; Task 2 tests exact literal values.
- A repository lookup for an absent ID must return `undefined` for both fake and PostgreSQL; Task 3 tests the shared behavior.
- Saving the same primary key twice must have the same explicit rejection behavior for both implementations; Task 3 tests duplicate semantics.
- Property failures must be reproducible rather than depending on ambient randomness; Task 4 fixes the seed and includes it in the test name.
- Documentation must not claim load, resilience, DAST, canary, or production checks before later increments implement them; Task 1 tests every classification.

---

### Task 1: Correct the Framework Evidence Matrix

**Files:**

- Modify: `docs/framework/verification-matrix.md`
- Modify: `docs/gates/catalog.md`
- Modify: `tests/docs/docs.test.mjs`

**Interfaces:**

- Consumes: current commands and workflows as the only acceptable evidence source.
- Produces: four exact classifications: `Executable`, `Demonstration`, `External requirement`, and `Not implemented`.

- [ ] **Step 1: Write a failing documentation classification test**

Add this test to `tests/docs/docs.test.mjs`:

```js
test('the matrix does not claim evidence that no command produces', async () => {
  const matrix = await readFile('docs/framework/verification-matrix.md', 'utf8');

  assert.match(matrix, /\| Development\s+\|.*\| Executable\s+\|/);
  assert.match(matrix, /\| Pull request\s+\|.*\| Executable\s+\|/);
  assert.match(matrix, /\| Main\s+\|.*\| Executable\s+\|/);
  assert.match(matrix, /\| Nightly\s+\|.*\| Demonstration\s+\|/);
  assert.match(matrix, /\| Pre-production\s+\|.*\| Not implemented\s+\|/);
  assert.match(matrix, /\| Production canary\s+\|.*\| External requirement\s+\|/);
  assert.match(matrix, /\| Production ongoing\s+\|.*\| External requirement\s+\|/);

  for (const unsupported of [
    'performance regression',
    'load and soak evidence',
    'resilience rehearsal',
    'authenticated DAST'
  ]) {
    assert.match(matrix, new RegExp(`${unsupported}.*Not implemented`, 'i'));
  }
});
```

- [ ] **Step 2: Run the documentation test and verify the current claims fail**

Run: `node tests/docs/docs.test.mjs`

Expected: FAIL because Nightly is `Executable`, Pre-production is `Configurable`, and unsupported concerns lack `Not implemented` labels.

- [ ] **Step 3: Replace aspirational classifications with explicit evidence states**

Rewrite the stage table so it contains these rows:

```markdown
| Development | static analysis, types, unit and component tests | Executable |
| Pull request | contracts, targeted integration, secrets and dependencies | Executable |
| Main | integration, critical E2E, local image evidence | Executable |
| Nightly | scheduled repetition of current gates | Demonstration |
| Pre-production | no environment workflow yet | Not implemented |
| Production canary | real SLO and rollout controller required | External requirement |
| Production ongoing | real telemetry, paging and CVE services required | External requirement |
```

Replace unsupported concern cells with the literal status and add a legend explaining that only a linked command can become `Executable`. Update `docs/gates/catalog.md` to distinguish local image IDs from registry artifact digests.

- [ ] **Step 4: Verify the documentation contract**

Run: `node tests/docs/docs.test.mjs && pnpm format:check`

Expected: all documentation tests and formatting pass.

- [ ] **Step 5: Commit the honest evidence matrix**

```bash
git add docs/framework/verification-matrix.md docs/gates/catalog.md tests/docs/docs.test.mjs
git commit -m "docs: align framework matrix with executable evidence"
```

### Task 2: Inject Deterministic Time and Identity

**Files:**

- Create: `apps/orders/src/ports/runtime.ts`
- Modify: `apps/orders/src/domain/order.ts`
- Modify: `apps/orders/src/http/build-app.ts`
- Modify: `apps/orders/src/index.ts`
- Modify: `apps/orders/test/order.unit.test.ts`
- Modify: `apps/orders/test/orders.component.test.ts`

**Interfaces:**

- Consumes: `CreateOrderInput`, `PricingClient`, and `OrderRepository`.
- Produces: `RuntimeValues { newId(): string; now(): string }`, `systemRuntimeValues`, and `createOrder(input, pricing, repository, runtime)`.

- [ ] **Step 1: Replace pattern assertions with an exact failing order assertion**

In `apps/orders/test/order.unit.test.ts`, define:

```ts
const fixedRuntime = {
  newId: () => '00000000-0000-4000-8000-000000000001',
  now: () => '2026-09-22T12:00:00.000Z'
};
```

Pass it as the fourth argument to `createOrder` and replace partial assertions with:

```ts
assert.deepEqual(order, {
  id: '00000000-0000-4000-8000-000000000001',
  sku: 'WIDGET',
  quantity: 2,
  totalCents: 2500,
  createdAt: '2026-09-22T12:00:00.000Z'
});
```

Use the same runtime in the failure test and assert its functions are not called when Pricing fails.

- [ ] **Step 2: Run the Orders unit test and verify the missing argument fails**

Run: `pnpm --filter @quality-reference/orders test:unit`

Expected: FAIL because `createOrder` accepts only three arguments or still produces ambient values.

- [ ] **Step 3: Add the runtime port and production implementation**

Create `apps/orders/src/ports/runtime.ts`:

```ts
import { randomUUID } from 'node:crypto';

export interface RuntimeValues {
  newId(): string;
  now(): string;
}

export const systemRuntimeValues: RuntimeValues = {
  newId: randomUUID,
  now: () => new Date().toISOString()
};
```

Change `createOrder` to require `runtime: RuntimeValues` and construct the order with `runtime.newId()` and `runtime.now()`. Add `runtime` to `OrdersDependencies`, and wire `systemRuntimeValues` in `apps/orders/src/index.ts`.

- [ ] **Step 4: Make component tests deterministic**

Pass `fixedRuntime` when building the Orders app. Assert the exact HTTP response, including fixed `id` and `createdAt`, rather than copying dynamic values from the create response.

- [ ] **Step 5: Verify Orders behavior and types**

Run: `pnpm --filter @quality-reference/orders test:unit && pnpm --filter @quality-reference/orders test:component && pnpm --filter @quality-reference/orders typecheck`

Expected: all Orders tests and type checking pass.

- [ ] **Step 6: Commit deterministic runtime ports**

```bash
git add apps/orders/src apps/orders/test
git commit -m "refactor: inject order time and identity"
```

### Task 3: Share Repository Behavior Across Fake and PostgreSQL

**Files:**

- Create: `apps/orders/test/support/in-memory-order-repository.ts`
- Create: `apps/orders/test/support/order-repository-contract.ts`
- Create: `apps/orders/test/in-memory-order-repository.test.ts`
- Create: `apps/orders/test/postgres-order-repository.adapter.test.ts`
- Create: `scripts/quality/orders-adapter`
- Modify: `apps/orders/test/order.unit.test.ts`
- Modify: `apps/orders/test/orders.component.test.ts`
- Modify: `apps/orders/package.json`
- Modify: `Makefile`
- Modify: `.github/workflows/pull-request.yml`

**Interfaces:**

- Consumes: `OrderRepository` and `PostgresOrderRepository`.
- Produces: `InMemoryOrderRepository` and `orderRepositoryContract(name, createRepository, reset)` used by both implementations.

- [ ] **Step 1: Write the shared repository contract**

Create `apps/orders/test/support/order-repository-contract.ts`:

```ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Order, OrderRepository } from '../../src/ports/order-repository.ts';

const order: Order = {
  id: '00000000-0000-4000-8000-000000000001',
  sku: 'WIDGET',
  quantity: 2,
  totalCents: 2500,
  createdAt: '2026-09-22T12:00:00.000Z'
};

export function orderRepositoryContract(
  name: string,
  createRepository: () => Promise<OrderRepository>,
  reset: () => Promise<void>
): void {
  describe(`${name} OrderRepository contract`, () => {
    it('returns undefined for an absent order', async () => {
      await reset();
      assert.equal(await (await createRepository()).findById(order.id), undefined);
    });

    it('round-trips every order field', async () => {
      await reset();
      const repository = await createRepository();
      await repository.save(order);
      assert.deepEqual(await repository.findById(order.id), order);
    });

    it('rejects a duplicate primary key', async () => {
      await reset();
      const repository = await createRepository();
      await repository.save(order);
      await assert.rejects(repository.save(order));
    });
  });
}
```

- [ ] **Step 2: Add an in-memory fake that intentionally lacks duplicate rejection and verify RED**

Create `InMemoryOrderRepository` with a `Map`, initially allowing overwrite, register it with the shared contract, and run:

Run: `node --test apps/orders/test/in-memory-order-repository.test.ts`

Expected: FAIL at `rejects a duplicate primary key`, proving the contract detects a dishonest fake.

- [ ] **Step 3: Make the fake conform and replace duplicated recording fakes**

Change `save` to throw `new Error('duplicate order id')` when the map contains the ID. Add `clear()` for contract setup. Import this one fake from both Orders unit and component tests.

- [ ] **Step 4: Add the focused PostgreSQL adapter suite**

The adapter test reads `DATABASE_URL`, creates a `pg.Pool`, truncates `orders` before each contract case, registers `PostgresOrderRepository`, and closes the pool in `after`. It must fail clearly when `DATABASE_URL` is absent rather than silently skip.

Create `scripts/quality/orders-adapter` to start a unique Compose project, wait for PostgreSQL, execute the adapter test inside the Orders image with `DATABASE_URL=postgres://quality:local-development-only@postgres:5432/orders`, collect logs on failure, and always tear down its volumes.

- [ ] **Step 5: Expose and enforce the focused adapter command**

Add `test-adapters` to `Makefile`. Add `test:adapter` to Orders. Add a `real-adapters` PR job that checks out the repository and runs `make test-adapters`; include it in `quality-gate.needs`.

- [ ] **Step 6: Verify fake and real behavior**

Run: `pnpm --filter @quality-reference/orders test:unit && pnpm --filter @quality-reference/orders test:component && make test-adapters`

Expected: the same three repository behaviors pass against both implementations.

- [ ] **Step 7: Commit honest repository tests**

```bash
git add apps/orders/test apps/orders/package.json scripts/quality/orders-adapter Makefile .github/workflows/pull-request.yml
git commit -m "test: verify fake and postgres repository behavior"
```

### Task 4: Add Reproducible Pricing Properties

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `apps/pricing/test/price.property.test.ts`
- Modify: `apps/pricing/package.json`

**Interfaces:**

- Consumes: `calculatePrice(sku: string, quantity: number): PriceQuote`.
- Produces: seeded property evidence for every accepted and rejected quantity class.

- [ ] **Step 1: Install `fast-check` at the workspace root**

Run: `pnpm add -Dw fast-check@4.3.0`

Expected: `package.json` and `pnpm-lock.yaml` record exactly `fast-check` 4.x.

- [ ] **Step 2: Write a property that exposes the current supported domain**

Create `apps/pricing/test/price.property.test.ts`:

```ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import fc from 'fast-check';
import { calculatePrice } from '../src/domain/price.ts';

const seed = 20260922;

describe(`calculatePrice properties (seed ${seed})`, () => {
  it('uses exact integer-cent multiplication for every valid quantity', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), (quantity) => {
        const quote = calculatePrice('WIDGET', quantity);
        assert.equal(quote.totalCents, quote.unitPriceCents * quantity);
        assert.ok(Number.isSafeInteger(quote.totalCents));
        assert.ok(quote.totalCents >= 0);
      }),
      { seed, numRuns: 100 }
    );
  });

  it('rejects every integer outside the supported quantity range', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.integer({ max: 0 }), fc.integer({ min: 101, max: 10_000 })),
        (quantity) => {
          assert.throws(() => calculatePrice('WIDGET', quantity));
        }
      ),
      { seed, numRuns: 100 }
    );
  });
});
```

- [ ] **Step 3: Mutate the multiplication expectation to prove RED, then restore it**

Temporarily assert `quote.totalCents === quote.unitPriceCents + quantity` and run:

Run: `node --test apps/pricing/test/price.property.test.ts`

Expected: FAIL with seed `20260922` and a minimized quantity counterexample. Restore the multiplication invariant without changing production code.

- [ ] **Step 4: Include properties in the canonical unit suite**

Update Pricing `test:unit` to run both `price.unit.test.ts` and `price.property.test.ts`.

- [ ] **Step 5: Verify reproducible Pricing behavior**

Run: `pnpm --filter @quality-reference/pricing test:unit && pnpm --filter @quality-reference/pricing typecheck`

Expected: example and property tests pass and print the fixed seed in the suite name.

- [ ] **Step 6: Commit property tests**

```bash
git add package.json pnpm-lock.yaml apps/pricing/package.json apps/pricing/test/price.property.test.ts
git commit -m "test: add seeded pricing properties"
```

### Task 5: Record Single-Service Test Evidence

**Files:**

- Create: `scripts/quality/service-tests`
- Create: `tests/meta/service-evidence.test.mjs`
- Create: `artifacts/tests/README.md`
- Modify: `Makefile`
- Modify: `.gitignore`
- Modify: `.github/workflows/pull-request.yml`
- Modify: `docs/gates/catalog.md`
- Modify: `docs/implementation/ci.md`

**Interfaces:**

- Consumes: workspace unit, component, and adapter commands.
- Produces: `artifacts/tests/service-tests.json` with `environment_classification`, `startedAt`, `finishedAt`, `durationMs`, `retryCount`, `result`, and per-suite results.

- [ ] **Step 1: Write a failing evidence-schema test**

Create `tests/meta/service-evidence.test.mjs` that runs `scripts/quality/service-tests` with `QUALITY_TEST_COMMAND` pointing to a deterministic fixture command, reads the JSON evidence, and asserts:

```js
assert.equal(evidence.environmentClassification, 'local-or-ci');
assert.equal(evidence.retryCount, 0);
assert.equal(evidence.result, 'passed');
assert.ok(evidence.durationMs >= 0);
assert.deepEqual(
  evidence.suites.map(({ name }) => name),
  ['unit', 'component']
);
```

Add a second fixture that exits `7`; assert the script exits `7`, records `failed`, and does not retry.

- [ ] **Step 2: Run the evidence test and verify the missing script fails**

Run: `node --test tests/meta/service-evidence.test.mjs`

Expected: FAIL because `scripts/quality/service-tests` does not exist.

- [ ] **Step 3: Implement the evidence wrapper**

Implement a POSIX shell entry point that creates `artifacts/tests`, records UTC timestamps and millisecond duration, runs unit then component suites once, preserves the first non-zero status, and writes JSON using a short `node -e` serializer rather than shell-escaping JSON manually. `QUALITY_TEST_COMMAND` is accepted only for the meta-test fixture; normal execution uses the canonical pnpm commands.

- [ ] **Step 4: Connect the command without putting real adapters in the commit hook**

Add `make service-tests`. Keep `make check-fast` limited to format, lint, types, and unit tests. Make the PR `tests` job call `make service-tests`; keep real adapters as their separate job.

Ignore generated `artifacts/tests/*.json` while tracking an `artifacts/tests/README.md` that documents the schema.

- [ ] **Step 5: Verify the complete increment**

Run: `make check && make test-adapters && make service-tests && node --test tests/docs/docs.test.mjs`

Expected: all checks pass; `artifacts/tests/service-tests.json` reports zero retries and passing unit/component suites.

- [ ] **Step 6: Commit evidence generation and documentation**

```bash
git add scripts/quality/service-tests tests/meta/service-evidence.test.mjs Makefile .gitignore artifacts/tests/README.md docs/gates/catalog.md docs/implementation/ci.md .github/workflows/pull-request.yml
git commit -m "feat: record single-service test evidence"
```

## Increment completion

Run the full validation set:

```bash
make check
make test-adapters
make integration
make e2e
make security
pnpm docs:build
```

Expected: every command passes; the evidence matrix claims no later-stage capability; Orders tests use exact deterministic values; fake and PostgreSQL repositories pass the same contract; Pricing property output is reproducible.
