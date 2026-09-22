# Quality Delivery Reference Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public, runnable two-service reference repository that manifests the article's quality gates locally and in GitHub Actions while documenting the requirements for real production delivery.

**Architecture:** A pnpm TypeScript workspace contains independent Orders and Pricing Fastify services, backed by PostgreSQL and orchestrated with Docker Compose. Repository-owned `make` targets and shell scripts are the single implementation of each quality gate; tracked native Git hooks and GitHub Actions call those same targets. VitePress presents the framework, executable evidence, adoption guidance, and production prerequisites.

**Tech Stack:** Node.js 24, pnpm 12, TypeScript 5, Fastify 5, PostgreSQL 17, Vitest, ESLint, Prettier, Docker Compose, OpenAPI 3.1, oasdiff, Gitleaks, Trivy, VitePress, GitHub Actions

**Spec:** `docs/superpowers/specs/2026-09-22-quality-delivery-reference-design.md`

## Global Constraints

- The only required host tools are Git, Docker with Compose, Make, and a POSIX-compatible shell.
- No Lefthook, Husky, or other hook-manager dependency.
- `.githooks/` must be activated per clone with `git config core.hooksPath .githooks`.
- Local hooks are feedback only; the stable GitHub status job is authoritative.
- Every check has one repository-owned command used by local hooks and CI.
- No hosted application, cloud credentials, Kubernetes cluster, or simulated production deployment.
- Stages must be labeled Executable, Configurable, or Documented.
- Documentation credits and links to the source article without reproducing it wholesale.
- Services bind to loopback by default outside the Docker network and use non-secret example credentials only.

## Review Focus

- Docker is absent or stopped: `scripts/bootstrap` exits non-zero with a direct prerequisite message before changing Git configuration; Task 2 tests this.
- A hook is invoked from a subdirectory or with spaces in the checkout path: it resolves the repository root and still runs the expected target; Task 2 tests this.
- Pricing is unavailable or returns malformed data: Orders returns a controlled 502 response and does not persist an order; Task 4 tests this.
- A contract changes incompatibly relative to the PR base: the contract gate exits non-zero and identifies the breaking operation; Task 6 tests this.
- CI is bypassed locally or path filters skip all matrix jobs: the stable `quality-gate` job still runs and fails unless every required result is successful; Task 8 tests workflow structure for this invariant.

---

### Task 1: Workspace Foundation and Reproducible Toolchain

**Files:**

- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `pnpm-lock.yaml` (generated)
- Create: `tsconfig.base.json`
- Create: `eslint.config.mjs`
- Create: `.prettierrc.json`
- Create: `.prettierignore`
- Create: `.gitignore`
- Create: `.dockerignore`
- Create: `Makefile`
- Create: `containers/dev.Dockerfile`
- Test: `tests/meta/workspace.test.mjs`

**Interfaces:**

- Consumes: Docker, Compose, Make, and shell from the host.
- Produces: `make tool CMD='<command>'`, `make format-check`, `make lint`, `make typecheck`, and workspace package discovery used by every later task.

- [ ] **Step 1: Write the failing workspace structure test**

```js
// tests/meta/workspace.test.mjs
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';

test('workspace pins package manager and exposes canonical quality commands', async () => {
  const pkg = JSON.parse(await readFile('package.json', 'utf8'));
  assert.match(pkg.packageManager, /^pnpm@12\./);
  for (const name of ['format:check', 'lint', 'typecheck', 'test:unit']) {
    assert.equal(typeof pkg.scripts[name], 'string');
  }
});
```

- [ ] **Step 2: Run the test and verify the missing manifest fails**

Run: `node --test tests/meta/workspace.test.mjs`  
Expected: FAIL with `ENOENT: no such file or directory, open 'package.json'`.

- [ ] **Step 3: Add the workspace manifests and containerized command boundary**

Create root scripts that call workspace packages, strict TypeScript defaults, flat ESLint configuration, deterministic formatting, ignore files, and a `node:24-bookworm-slim` development image with Corepack-enabled pnpm. Define `make tool` as the only generic container runner and define named targets as thin wrappers around package scripts.

```json
{
  "name": "quality-delivery-reference",
  "private": true,
  "packageManager": "pnpm@12.5.1",
  "engines": { "node": ">=24" },
  "scripts": {
    "format:check": "prettier --check .",
    "lint": "eslint .",
    "typecheck": "pnpm -r typecheck",
    "test:unit": "pnpm -r --if-present test:unit",
    "test:component": "pnpm -r --if-present test:component"
  }
}
```

- [ ] **Step 4: Install dependencies and prove the foundation is green**

Run: `pnpm install --lockfile-only --force && node --test tests/meta/workspace.test.mjs && pnpm format:check && pnpm lint`  
Expected: all commands exit 0 and `pnpm-lock.yaml` exists.

- [ ] **Step 5: Commit the foundation**

```bash
git add package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json eslint.config.mjs .prettierrc.json .prettierignore .gitignore .dockerignore Makefile containers/dev.Dockerfile tests/meta/workspace.test.mjs
git commit -m "build: establish reproducible workspace"
```

### Task 2: Native Git Hooks and Safe Bootstrap

**Files:**

- Create: `scripts/bootstrap`
- Create: `scripts/quality/fast`
- Create: `scripts/quality/full`
- Create: `.githooks/pre-commit`
- Create: `.githooks/pre-push`
- Create: `tests/hooks/hooks.bats`
- Create: `tests/hooks/test-helper.bash`
- Modify: `Makefile`

**Interfaces:**

- Consumes: `make format-check`, `make lint`, `make typecheck`, and later test targets.
- Produces: executable `scripts/bootstrap`, `scripts/quality/fast`, and `scripts/quality/full`; hooks that resolve `git rev-parse --show-toplevel` before delegation.

- [ ] **Step 1: Write failing shell tests for prerequisites, root resolution, and delegation**

```bash
@test "bootstrap fails clearly when Docker is unavailable" {
  PATH="$BATS_TEST_TMPDIR/bin" run "$PROJECT_ROOT/scripts/bootstrap"
  [ "$status" -ne 0 ]
  [[ "$output" == *"Docker with Compose is required"* ]]
}

@test "pre-commit resolves a checkout path containing spaces" {
  setup_fake_repository "checkout with spaces"
  run bash -c "cd '$FAKE_REPO/nested' && '$FAKE_REPO/.githooks/pre-commit'"
  [ "$status" -eq 0 ]
  grep -q 'check-fast' "$FAKE_REPO/make.log"
}
```

- [ ] **Step 2: Run the hook tests and verify they fail because scripts are absent**

Run: `docker run --rm -v "$PWD:/work" -w /work bats/bats:1.12.0 tests/hooks`  
Expected: FAIL because `scripts/bootstrap` and `.githooks/pre-commit` do not exist.

- [ ] **Step 3: Implement guarded bootstrap and minimal hook entry points**

Use `#!/bin/sh`, `set -eu`, `command -v`, and `docker compose version` checks. Only after prerequisites pass, set `core.hooksPath` to `.githooks`. Hooks resolve the top-level path, `cd` there, and execute `make check-fast` or `make check` without duplicating commands.

- [ ] **Step 4: Run tests and inspect configured hook path**

Run: `docker run --rm -v "$PWD:/work" -w /work bats/bats:1.12.0 tests/hooks`  
Expected: PASS. Then run `scripts/bootstrap && git config --get core.hooksPath`; expected output: `.githooks` once a writable Git repository is available.

- [ ] **Step 5: Commit native hook support**

```bash
git add scripts .githooks tests/hooks Makefile
git commit -m "feat: add dependency-free local quality hooks"
```

### Task 3: Pricing Service Boundaries

**Files:**

- Create: `apps/pricing/package.json`
- Create: `apps/pricing/tsconfig.json`
- Create: `apps/pricing/src/domain/price.ts`
- Create: `apps/pricing/src/http/build-app.ts`
- Create: `apps/pricing/src/index.ts`
- Create: `apps/pricing/test/price.unit.test.ts`
- Create: `apps/pricing/test/pricing.component.test.ts`
- Create: `apps/pricing/Dockerfile`

**Interfaces:**

- Consumes: Fastify and workspace quality configuration.
- Produces: `calculatePrice(sku: string, quantity: number): PriceResult` and `buildPricingApp(): FastifyInstance`; HTTP `GET /health` and `POST /v1/prices/quote`.

- [ ] **Step 1: Write failing domain and component tests**

```ts
it('calculates an integer-cent quote', () => {
  expect(calculatePrice('WIDGET', 3)).toEqual({
    sku: 'WIDGET',
    quantity: 3,
    unitPriceCents: 1250,
    totalCents: 3750
  });
});

it('rejects an unknown SKU without exposing internals', async () => {
  const response = await buildPricingApp().inject({
    method: 'POST',
    url: '/v1/prices/quote',
    payload: { sku: 'NOPE', quantity: 1 }
  });
  expect(response.statusCode).toBe(404);
  expect(response.json()).toEqual({ code: 'SKU_NOT_FOUND', message: 'Unknown SKU' });
});
```

- [ ] **Step 2: Verify both tests fail on missing modules**

Run: `pnpm --filter @quality-reference/pricing test:unit && pnpm --filter @quality-reference/pricing test:component`  
Expected: FAIL with module resolution errors.

- [ ] **Step 3: Implement the smallest domain and HTTP service**

Use integer cents, validate quantity as an integer from 1 through 100, map known SKUs from an immutable table, and return stable error codes for invalid input and unknown SKUs. Keep server listening in `index.ts`, separate from `buildPricingApp` so component tests use Fastify injection.

- [ ] **Step 4: Run service tests and quality checks**

Run: `pnpm --filter @quality-reference/pricing test:unit && pnpm --filter @quality-reference/pricing test:component && pnpm lint && pnpm typecheck`  
Expected: PASS.

- [ ] **Step 5: Commit the pricing boundary**

```bash
git add apps/pricing
git commit -m "feat: add independently testable pricing service"
```

### Task 4: Orders Service with Failure-Safe Collaboration

**Files:**

- Create: `apps/orders/package.json`
- Create: `apps/orders/tsconfig.json`
- Create: `apps/orders/src/domain/order.ts`
- Create: `apps/orders/src/ports/pricing.ts`
- Create: `apps/orders/src/ports/order-repository.ts`
- Create: `apps/orders/src/adapters/http-pricing-client.ts`
- Create: `apps/orders/src/adapters/postgres-order-repository.ts`
- Create: `apps/orders/src/http/build-app.ts`
- Create: `apps/orders/src/index.ts`
- Create: `apps/orders/test/order.unit.test.ts`
- Create: `apps/orders/test/orders.component.test.ts`
- Create: `apps/orders/Dockerfile`

**Interfaces:**

- Consumes: Pricing `POST /v1/prices/quote` and PostgreSQL connection string.
- Produces: `createOrder(input, pricing, repository): Promise<Order>` and `buildOrdersApp(dependencies): FastifyInstance`; HTTP `GET /health`, `POST /v1/orders`, and `GET /v1/orders/:id`.

- [ ] **Step 1: Write failing tests for success, malformed pricing data, and unavailable pricing**

```ts
it('does not persist when pricing is unavailable', async () => {
  const repository = new RecordingRepository();
  const app = buildOrdersApp({
    repository,
    pricing: {
      quote: async () => {
        throw new PricingUnavailableError();
      }
    }
  });
  const response = await app.inject({
    method: 'POST',
    url: '/v1/orders',
    payload: { sku: 'WIDGET', quantity: 2 }
  });
  expect(response.statusCode).toBe(502);
  expect(response.json()).toEqual({
    code: 'PRICING_UNAVAILABLE',
    message: 'Pricing is temporarily unavailable'
  });
  expect(repository.saved).toHaveLength(0);
});
```

Add a second test where the pricing adapter receives a 200 response missing `totalCents`; expect the same controlled 502 and zero saves.

- [ ] **Step 2: Run the orders tests and confirm missing implementation failures**

Run: `pnpm --filter @quality-reference/orders test:unit && pnpm --filter @quality-reference/orders test:component`  
Expected: FAIL with module resolution errors.

- [ ] **Step 3: Implement ports, use case, adapters, and HTTP mapping**

Validate request input before calling Pricing. Validate the Pricing response at the adapter boundary. Generate UUID order IDs, persist only after a valid quote, and translate typed domain/adapter errors into stable 400, 404, and 502 payloads. Log request IDs and error codes without logging database credentials or full request bodies.

- [ ] **Step 4: Run all focused and workspace checks**

Run: `pnpm --filter @quality-reference/orders test:unit && pnpm --filter @quality-reference/orders test:component && pnpm lint && pnpm typecheck`  
Expected: PASS.

- [ ] **Step 5: Commit the orders boundary**

```bash
git add apps/orders
git commit -m "feat: add orders service with controlled dependency failures"
```

### Task 5: Real Local Integration and Critical E2E Path

**Files:**

- Create: `compose.yaml`
- Create: `apps/orders/migrations/001_create_orders.sql`
- Create: `tests/integration/service-interaction.test.ts`
- Create: `tests/e2e/order-lifecycle.test.ts`
- Create: `tests/support/wait-for-health.mjs`
- Create: `scripts/quality/integration`
- Modify: `Makefile`

**Interfaces:**

- Consumes: service images, `/health` endpoints, PostgreSQL, and public HTTP contracts.
- Produces: `make dev`, `make integration`, `make e2e`, and deterministic Compose health/readiness behavior.

- [ ] **Step 1: Write failing black-box tests against the documented public ports**

```ts
it('creates and retrieves a priced order through the public boundary', async () => {
  const created = await fetchJson('http://127.0.0.1:3000/v1/orders', {
    method: 'POST',
    body: JSON.stringify({ sku: 'WIDGET', quantity: 2 }),
    headers: { 'content-type': 'application/json' }
  });
  expect(created.status).toBe(201);
  expect(created.body.totalCents).toBe(2500);
  const fetched = await fetchJson(`http://127.0.0.1:3000/v1/orders/${created.body.id}`);
  expect(fetched.body).toEqual(created.body);
});
```

- [ ] **Step 2: Confirm the E2E test fails because no environment exists**

Run: `pnpm vitest run tests/e2e/order-lifecycle.test.ts`  
Expected: FAIL with connection refused on `127.0.0.1:3000`.

- [ ] **Step 3: Implement Compose topology, migration, health checks, and runners**

Define PostgreSQL, Pricing, and Orders services on an internal network; publish only Orders to `127.0.0.1:3000` and optionally Pricing to `127.0.0.1:3001` under the development profile. Use health-conditioned dependencies. `scripts/quality/integration` must bring up a project with a unique Compose project name, wait with a bounded timeout, run tests, capture `docker compose logs` on failure, and always tear down volumes in a trap.

- [ ] **Step 4: Run integration and E2E from a clean environment**

Run: `make integration && make e2e`  
Expected: PASS; `docker compose ps --all` shows no leftover quality-test project.

- [ ] **Step 5: Commit executable service verification**

```bash
git add compose.yaml apps/orders/migrations tests/integration tests/e2e tests/support scripts/quality/integration Makefile
git commit -m "test: exercise real service and database boundaries"
```

### Task 6: Versioned Contracts and Breaking-Change Gate

**Files:**

- Create: `contracts/pricing.openapi.yaml`
- Create: `contracts/orders.openapi.yaml`
- Create: `scripts/quality/contracts`
- Create: `tests/contracts/contracts.bats`
- Modify: `Makefile`

**Interfaces:**

- Consumes: `BASE_REF` environment variable, defaulting to `origin/main`, and versioned OpenAPI documents.
- Produces: `make contracts`; syntax validation plus oasdiff breaking-change comparison against the merge base.

- [ ] **Step 1: Write failing contract-script tests**

```bash
@test "an incompatible response removal fails with the affected operation" {
  setup_contract_git_fixture
  remove_required_total_cents
  BASE_REF=main run "$PROJECT_ROOT/scripts/quality/contracts"
  [ "$status" -ne 0 ]
  [[ "$output" == *"POST /v1/prices/quote"* ]]
  [[ "$output" == *"totalCents"* ]]
}
```

Also test a fresh repository with no base contract: syntax validation succeeds and the script prints that compatibility comparison was skipped explicitly.

- [ ] **Step 2: Run tests and confirm the missing gate fails**

Run: `docker run --rm -v "$PWD:/work" -w /work bats/bats:1.12.0 tests/contracts`  
Expected: FAIL because `scripts/quality/contracts` does not exist.

- [ ] **Step 3: Add exact HTTP contracts and the oasdiff-based comparison**

Contracts must describe all implemented response codes and stable error shapes. Run oasdiff from a pinned container image. Compute `git merge-base HEAD "$BASE_REF"`, extract base contracts to a temporary directory, and compare them without modifying the checkout.

- [ ] **Step 4: Verify syntax, compatible changes, and breaking changes**

Run: `make contracts && docker run --rm -v "$PWD:/work" -w /work bats/bats:1.12.0 tests/contracts`  
Expected: PASS, including the test that observes an intentional non-zero oasdiff result.

- [ ] **Step 5: Commit contract verification**

```bash
git add contracts scripts/quality/contracts tests/contracts Makefile
git commit -m "feat: gate incompatible API contract changes"
```

### Task 7: Security and Immutable Artifact Checks

**Files:**

- Create: `.gitleaks.toml`
- Create: `scripts/quality/security`
- Create: `scripts/quality/build-images`
- Create: `tests/security/security.bats`
- Modify: `Makefile`

**Interfaces:**

- Consumes: repository contents, lockfile, and both service Dockerfiles.
- Produces: `make security` and `make build-images`; local image tags plus `artifacts/image-digests.txt` containing immutable digests.

- [ ] **Step 1: Write failing tests for a fixture secret and image digest evidence**

```bash
@test "secret scanning rejects a known test credential" {
  make_security_fixture 'AWS_SECRET_ACCESS_KEY=abcdefghijklmnopqrstuvwxyz1234567890'
  run "$PROJECT_ROOT/scripts/quality/security" "$SECURITY_FIXTURE"
  [ "$status" -ne 0 ]
  [[ "$output" == *"AWS"* ]]
}

@test "image build records sha256 digests" {
  run "$PROJECT_ROOT/scripts/quality/build-images"
  [ "$status" -eq 0 ]
  run grep -Eq 'orders@sha256:[0-9a-f]{64}' "$PROJECT_ROOT/artifacts/image-digests.txt"
  [ "$status" -eq 0 ]
}
```

- [ ] **Step 2: Verify tests fail with missing scripts**

Run: `docker run --rm -v "$PWD:/work" -w /work bats/bats:1.12.0 tests/security`  
Expected: FAIL because both quality scripts are absent.

- [ ] **Step 3: Implement pinned Gitleaks, dependency audit, Trivy, and digest recording**

Use pinned container image versions and read-only source mounts where supported. Scan Git history and the working tree with Gitleaks, run `pnpm audit --prod`, build both service images, scan them with Trivy for HIGH/CRITICAL fixable vulnerabilities, and record the locally computed image IDs/digests. Keep test-only fake secrets in a fixture allowlist scoped to the exact test path.

- [ ] **Step 4: Run security and artifact tests**

Run: `make security && make build-images && docker run --rm -v "$PWD:/work" -w /work bats/bats:1.12.0 tests/security`  
Expected: PASS and `artifacts/image-digests.txt` contains both services.

- [ ] **Step 5: Commit security checks**

```bash
git add .gitleaks.toml scripts/quality/security scripts/quality/build-images tests/security Makefile
git commit -m "build: add security and immutable artifact evidence"
```

### Task 8: Authoritative GitHub Workflows and Ruleset Guidance

**Files:**

- Create: `.github/workflows/pull-request.yml`
- Create: `.github/workflows/main.yml`
- Create: `.github/workflows/nightly.yml`
- Create: `.github/dependabot.yml`
- Create: `.github/pull_request_template.md`
- Create: `tests/meta/workflows.test.mjs`

**Interfaces:**

- Consumes: canonical Make targets and GitHub-provided base/head revisions.
- Produces: stable required job name `quality-gate`, uploaded failure evidence, main artifact evidence, and scheduled extended checks.

- [ ] **Step 1: Write failing workflow-structure tests**

```js
test('PR workflow always exposes the stable authoritative gate', async () => {
  const workflow = parseYaml(await readFile('.github/workflows/pull-request.yml', 'utf8'));
  assert.ok(workflow.on.pull_request);
  assert.ok(workflow.jobs['quality-gate']);
  assert.equal(workflow.jobs['quality-gate'].if, 'always()');
  assert.match(workflow.jobs['quality-gate'].steps.at(-1).run, /exit 1/);
});
```

Also assert SHA-pinned third-party actions, least-privilege `contents: read`, explicit timeouts, nightly cron, and uploaded logs/test results on failure.

- [ ] **Step 2: Run the metadata test and confirm workflows are absent**

Run: `node --test tests/meta/workflows.test.mjs`  
Expected: FAIL with missing `pull-request.yml`.

- [ ] **Step 3: Implement PR, main, and nightly orchestration**

PR jobs run fast checks, unit/component tests, contracts, targeted integration, and security. `quality-gate` depends on every required job, uses `if: always()`, examines each `needs.*.result`, and exits 1 unless all are `success`. Main builds images then runs broad integration and critical E2E against them. Nightly runs full checks and opens durable workflow evidence without claiming production verification.

- [ ] **Step 4: Validate workflow invariants and YAML formatting**

Run: `node --test tests/meta/workflows.test.mjs && make format-check`  
Expected: PASS.

- [ ] **Step 5: Commit CI authority**

```bash
git add .github tests/meta/workflows.test.mjs
git commit -m "ci: enforce staged quality gates"
```

### Task 9: Framework Documentation Site

**Files:**

- Create: `docs/package.json`
- Create: `docs/.vitepress/config.ts`
- Create: `docs/.vitepress/theme/index.ts`
- Create: `docs/.vitepress/theme/custom.css`
- Create: `docs/index.md`
- Create: `docs/guide/getting-started.md`
- Create: `docs/framework/delivery-path.md`
- Create: `docs/framework/verification-matrix.md`
- Create: `docs/gates/catalog.md`
- Create: `docs/implementation/local-feedback.md`
- Create: `docs/implementation/ci.md`
- Create: `docs/production/requirements.md`
- Create: `docs/adoption/existing-repository.md`
- Create: `docs/decisions/native-git-hooks.md`
- Create: `tests/docs/docs.test.mjs`
- Modify: `package.json`
- Modify: `pnpm-workspace.yaml`

**Interfaces:**

- Consumes: all canonical commands, workflow names, stage classifications, and source-article attribution.
- Produces: `pnpm docs:dev`, `pnpm docs:build`, and a static `.vitepress/dist` suitable for GitHub Pages.

- [ ] **Step 1: Write failing documentation integrity tests**

```js
test('every framework stage is classified and production claims are qualified', async () => {
  const matrix = await readFile('docs/framework/verification-matrix.md', 'utf8');
  for (const stage of [
    'Development',
    'Pull request',
    'Main',
    'Nightly',
    'Pre-production',
    'Production canary',
    'Production ongoing'
  ]) {
    assert.match(
      matrix,
      new RegExp(`\\| ${stage} \\|.*\\| (Executable|Configurable|Documented) \\|`)
    );
  }
  assert.match(matrix, /No production environment is exercised by this repository/);
});
```

Also assert source attribution, every Make target referenced by docs exists, every relative Markdown link resolves, and the production guide contains registry, identity, rollout, rollback, migrations, telemetry, SLOs, scanning, test-data, incident, and audit headings.

- [ ] **Step 2: Confirm documentation tests fail on missing pages**

Run: `node --test tests/docs/docs.test.mjs`  
Expected: FAIL with missing `docs/framework/verification-matrix.md`.

- [ ] **Step 3: Build the VitePress information architecture and visual system**

Implement the pages listed above. Use custom CSS variables for near-black surfaces, muted borders, cyan/purple accents, Fira Code/system monospace stacks, compact responsive tables, focus-visible states, and reduced-motion support. Implement the delivery path with semantic HTML/CSS so it remains readable without client JavaScript; do not copy the article's site source.

- [ ] **Step 4: Add executable failure exercises and production connection details**

Getting Started must include a safe exercise that changes a test fixture, observes the hook/CI failure, and restores it. Each gate entry states purpose, inputs, command, evidence, owner, blocking policy, and response. Production Requirements states exact categories of secrets and infrastructure but no vendor credentials or fake success output.

- [ ] **Step 5: Verify content integrity, accessibility basics, and static build**

Run: `node --test tests/docs/docs.test.mjs && pnpm docs:build`  
Expected: PASS and `docs/.vitepress/dist/index.html` exists.

- [ ] **Step 6: Commit the reference documentation**

```bash
git add docs package.json pnpm-workspace.yaml pnpm-lock.yaml tests/docs
git commit -m "docs: publish quality delivery implementation guide"
```

### Task 10: Onboarding, Clean-Clone Verification, and Publication

**Files:**

- Create: `README.md`
- Create: `LICENSE`
- Create: `.github/workflows/docs.yml`
- Create: `scripts/verify-clean-clone`
- Modify: `Makefile`
- Modify: `docs/implementation/ci.md`

**Interfaces:**

- Consumes: the complete repository, valid Git metadata, and valid `gh` authentication for publication only.
- Produces: five-minute onboarding, clean-clone verification, optional GitHub Pages artifact, public `Milimas/quality-delivery-reference`, and documented ruleset setup.

- [ ] **Step 1: Write the clean-clone verifier before the onboarding copy**

The script accepts a source repository path and destination path, clones with `--no-local`, verifies hooks are initially inactive, runs `scripts/bootstrap`, verifies `.githooks`, runs `make check-fast`, `make integration`, and `pnpm docs:build`, then exits with a stage-specific failure message. It must refuse `/`, the source checkout, or a non-empty destination.

- [ ] **Step 2: Run it and observe the missing onboarding/publication pieces**

Run: `scripts/verify-clean-clone "$PWD" /tmp/quality-delivery-reference-verification`  
Expected before completion: non-zero at the first missing root command or README check, without altering the source checkout.

- [ ] **Step 3: Add README, MIT license, Pages workflow, and ruleset runbook**

README includes purpose, architecture diagram, prerequisites, five-minute commands, stage classification legend, source attribution, documentation link, and explicit statement that production is documented rather than deployed. The Pages workflow builds only static docs and deploys through GitHub's Pages actions. The CI guide records exact `gh api`/UI steps to create the `main` ruleset after `quality-gate` has run once, plus a command to verify it.

- [ ] **Step 4: Run the full verification suite in the current checkout**

Run: `make check && make integration && make e2e && make security && pnpm docs:build`  
Expected: all commands exit 0; failure artifacts are absent or empty.

- [ ] **Step 5: Verify from a clean clone**

Run: `verify_dir=$(mktemp -d /tmp/quality-reference.XXXXXX) && scripts/verify-clean-clone "$PWD" "$verify_dir/repo"`  
Expected: PASS and output confirms inactive-before-bootstrap, active-after-bootstrap, fast checks, integration, and docs build.

- [ ] **Step 6: Publish only after authentication is valid**

Run: `gh auth status`  
Expected: authenticated as `Milimas`. Then run `gh repo create Milimas/quality-delivery-reference --public --source=. --remote=origin --push`. Do not create the repository if authentication fails or if that repository name already exists; report the exact blocker instead.

- [ ] **Step 7: Enable and verify repository protections**

After the first PR workflow creates `quality-gate`, follow the checked-in ruleset runbook to require PRs and `quality-gate` on `main`, block force pushes and deletion, and enable Pages from GitHub Actions. Verify through `gh api repos/Milimas/quality-delivery-reference/rulesets` and record the live docs URL in README only after Pages reports success.

- [ ] **Step 8: Commit final onboarding and publication configuration**

```bash
git add README.md LICENSE .github/workflows/docs.yml scripts/verify-clean-clone Makefile docs/implementation/ci.md
git commit -m "docs: complete onboarding and publication runbook"
```

## Final Verification

- [ ] Run `make check` and confirm formatting, lint, types, unit, component, contract, and metadata tests pass.
- [ ] Run `make integration && make e2e` and confirm Compose cleanup leaves no project containers or volumes.
- [ ] Run `make security && make build-images` and inspect both recorded digests.
- [ ] Run `pnpm docs:build` and inspect the generated home page at desktop and mobile widths.
- [ ] Run the clean-clone verifier from a temporary directory.
- [ ] Confirm `git status --short` contains only intentionally uncommitted generated evidence, then ensure generated evidence is ignored or committed according to the plan.
- [ ] Confirm the public repository, required `quality-gate`, ruleset, and optional Pages deployment only after GitHub authentication is repaired.
