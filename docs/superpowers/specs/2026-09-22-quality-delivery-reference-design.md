# Quality Delivery Reference Design

**Date:** 2026-09-22  
**Status:** Proposed  
**Source framework:** [From Code to Production: A Quality Framework for Multi-Service Platforms](https://www.beihaqi.com/blog/from-code-to-production)

## Purpose

Create a public, reusable reference repository that turns the article's quality framework into an inspectable implementation. A developer should be able to clone the repository, activate native Git hooks, run a small multi-service system locally, deliberately break it, and see the appropriate quality gate stop the change.

The repository is not a production platform and will not pretend to deploy one. It will implement the checks that can run honestly on a workstation and in GitHub Actions, while documenting the infrastructure, credentials, ownership, and operational signals required to extend the same delivery path through pre-production and production.

## Success Criteria

- A new contributor can start the example and run every local check from documented commands.
- Local hooks require no third-party hook manager or globally installed language toolchain.
- Pull-request checks are authoritative even when local hooks are skipped.
- Each automated check maps visibly to a framework stage and explains what it protects.
- At least one intentional failure exercise exists for every implemented concern.
- The documentation distinguishes implemented evidence from production guidance.
- The repository can be reused as a template without inheriting application-specific assumptions.

## Scope

### Implemented

- A small TypeScript platform with two independently testable HTTP services.
- PostgreSQL-backed local execution through Docker Compose.
- Static analysis, formatting, type checking, unit tests, component tests, OpenAPI contract checks, integration tests, and a critical-path E2E test.
- Dependency and secret scanning using tools suitable for GitHub Actions and local containers.
- Native, repository-owned Git hooks for fast developer feedback.
- GitHub Actions workflows for pull requests, main, and scheduled deeper verification.
- A dark, monospaced VitePress documentation site inspired by the source article.
- Documentation for pre-production and production rollout, observability, canary evaluation, rollback, resilience testing, and ownership.

### Not implemented

- A hosted application environment.
- Cloud accounts, clusters, domains, certificates, or production secrets.
- A simulated production deployment that could be mistaken for operational evidence.
- A full Kubernetes, service-mesh, or observability stack.
- Enforcement based solely on local hooks.

## Key Decisions

### Native Git hooks, not Lefthook

Tracked scripts live in `.githooks/`. A bootstrap command configures this clone with:

```sh
git config core.hooksPath .githooks
```

The pre-commit hook runs only quick checks appropriate for the edit/commit loop. The pre-push hook runs the broader local gate. Both delegate to versioned scripts under `scripts/quality/`, and CI invokes those same scripts.

Hooks are convenience gates, not security boundaries: cloning does not activate them automatically, and developers can bypass them. GitHub Actions and a `main` branch ruleset provide repository-level enforcement.

### Containers define the development runtime

Git, Docker, Docker Compose, and a POSIX-compatible shell are the intended local prerequisites. Node dependencies remain project dependencies inside the development container. This avoids requiring Node or a hook runner to be installed globally while retaining a familiar TypeScript example.

### One implementation per check

Each concern has one repository-owned command. Hooks and workflows orchestrate those commands rather than duplicating check logic in YAML. A check should produce the same result locally and in CI given the same commit and environment.

### Honest stage boundaries

The repository labels each stage as one of:

- **Executable:** runs locally and/or in GitHub Actions.
- **Configurable:** supplied as a reviewed example that becomes executable when connected to real infrastructure.
- **Documented:** describes requirements and evidence but makes no claim that the repository exercised them.

## Example Platform

The example contains two deliberately small services:

- **Orders service:** accepts an order, validates it, persists it, and requests a price.
- **Pricing service:** returns prices through a versioned HTTP contract.

This interaction is large enough to demonstrate unit, component, contract, integration, and E2E boundaries without turning the repository into an application tutorial. Both services expose health endpoints and structured logs. Database state and external calls are isolated behind narrow interfaces so tests can choose real or fake dependencies explicitly.

## Repository Shape

```text
.
├── .githooks/                 # Tracked native Git entry points
├── .github/workflows/         # PR, main, nightly, and docs workflows
├── apps/
│   ├── orders/                # Orders service and its focused tests
│   └── pricing/               # Pricing service and its focused tests
├── contracts/                 # Versioned OpenAPI descriptions
├── docs/                      # VitePress reference documentation
├── scripts/
│   ├── bootstrap              # Activates hooks and verifies prerequisites
│   └── quality/               # Canonical stage/check commands
├── tests/
│   ├── contract/
│   ├── integration/
│   └── e2e/
├── compose.yaml
├── Makefile                   # Memorable human-facing commands
└── README.md                  # Purpose and five-minute entry point
```

## Delivery Path and Gates

| Stage              | Repository behavior                                                                                                | Gate consequence                                                  | Classification                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- | ----------------------------------------------- |
| Design             | Contract and change checklist in docs/PR template                                                                  | Missing design evidence is visible in review                      | Configurable                                    |
| Development        | Format, lint, types, focused unit/component tests                                                                  | Stops local commit on failure                                     | Executable                                      |
| Pull request       | Static checks, all unit/component tests, contract compatibility, targeted integration, dependency and secret scans | Required check blocks merge                                       | Executable                                      |
| Main               | Build immutable artifacts, broad integration, critical E2E                                                         | Failed evidence blocks promotion readiness                        | Executable                                      |
| Nightly            | Extended suites and scheduled security checks                                                                      | Opens/records actionable failure; does not rewrite prior evidence | Executable where no external target is required |
| Pre-production     | Full integration, critical E2E, DAST, image scan, load test, chaos rehearsal                                       | Blocks production approval                                        | Documented with connection points               |
| Production canary  | SLOs, error rate, latency, saturation, and business metrics                                                        | Promotes or aborts automatically                                  | Documented                                      |
| Production ongoing | Synthetic checks, SLO alerts, continuous vulnerability scanning                                                    | Pages or opens an incident                                        | Documented                                      |

## Workflow Design

### Developer loop

`make setup` verifies prerequisites, builds the development image, and activates `.githooks`. `make dev` starts the services. `make check-fast` is used by pre-commit; `make check` is used by pre-push. Each command prints the exact failing concern and the direct command for rerunning it.

### Pull requests

The PR workflow uses path-aware jobs where correctness permits, but the required aggregate job has a stable name for branch rules. It uploads test reports and logs on failure. Contract compatibility compares the proposed API with the base branch rather than merely validating syntax.

### Main and scheduled checks

Main builds content-addressed container images and records their digests as artifacts; it does not publish or deploy them. Broader integration and critical E2E checks run against those images. A scheduled workflow runs slower checks that do not need a real environment and clearly reports which production-only checks remain unavailable.

### GitHub enforcement

After the first successful workflow run, a repository ruleset targets `main`, requires pull requests and the stable aggregate status check, prevents deletion and force pushes, and leaves an explicit administrator bypass only if the account plan and repository capabilities support it. Ruleset setup and verification are documented because GitHub features can vary by account and plan.

## Documentation Experience

VitePress provides Markdown-native docs, code highlighting, navigation, and custom Vue/CSS where needed. The theme uses a near-black canvas, restrained borders, monospaced typography, cyan/purple accents, compact tables, and responsive diagrams based on the supplied article aesthetic without copying its source code.

The docs contain:

1. Framework at a glance: delivery path and concern/stage matrix.
2. Five-minute setup and first intentional failure.
3. Local feedback: hook activation, bypass limitations, and troubleshooting.
4. Gate catalog: purpose, inputs, command, output, owner, blocking policy, and failure response for every check.
5. CI implementation: PR, main, nightly, artifacts, and required status checks.
6. Production extension guide: infrastructure and operational prerequisites.
7. Adoption guide: incremental rollout for an existing repository.
8. Decision records: why native hooks, containers, shared commands, and honest stage labels were selected.

The source article is credited and linked. Documentation paraphrases the framework and adds implementation-specific material rather than reproducing the article wholesale.

## Failure Handling

- Fast checks fail with concise messages and a single rerun command.
- Service startup waits on health checks and reports container logs when readiness fails.
- Integration/E2E jobs always collect logs and test reports before cleanup.
- Flaky behavior is not hidden by unrestricted retries. Any narrowly permitted retry is reported and documented.
- Nightly failures create durable evidence suitable for triage instead of silently passing after a retry.
- Production guidance defines abort/rollback thresholds before explaining rollout mechanics.

## Test Strategy

The repository tests both the example system and the quality framework:

- Unit tests verify domain behavior without I/O.
- Component tests verify each service at its public boundary with controlled dependencies.
- Contract tests validate OpenAPI and detect incompatible changes against the base revision.
- Integration tests run real service-to-service and database interactions in containers.
- Critical E2E tests exercise order creation through the public boundary.
- Shell-level tests verify hook and quality-script behavior, including non-zero exits.
- A workflow lint/check validates CI configuration where practical.
- The documentation build must succeed in CI and internal links must resolve.

Intentional failure exercises modify isolated fixtures or use opt-in branches/scripts; the default branch remains green.

## Production Requirements

A real implementation must provide the following before enabling the documented later stages:

- A container registry and immutable artifact promotion policy.
- Separate pre-production and production environments with protected GitHub environment approvals.
- Workload identity or short-lived cloud authentication; no long-lived deployment secrets.
- Deployment automation supporting health checks, progressive traffic shifting, automatic abort, and rollback.
- Database migration policy compatible with rolling versions and backward-compatible contracts.
- Central logs, metrics, traces, service ownership metadata, dashboards, and paging integration.
- Defined SLIs/SLOs, error-budget policy, canary thresholds, and business health signals.
- DAST target, image/SBOM scanning, continuous CVE monitoring, and remediation ownership.
- Production-like test data policy and safe resilience/chaos boundaries.
- Incident response, rollback authority, audit retention, and post-incident learning process.

The guide will show where each value connects to the workflows but will not include vendor credentials or claim a universal cloud architecture.

## Publishing

The finished repository will be created publicly under the authenticated personal GitHub account, using a neutral name such as `quality-delivery-reference`. GitHub Pages deployment is optional and can host the static documentation without a user-managed server.

Repository creation and ruleset configuration require valid GitHub CLI authentication. Authentication is currently not valid and must be refreshed before publication; local implementation can proceed independently.

## Acceptance Checks

- Clone/setup instructions succeed in a clean temporary clone.
- Native hooks demonstrably stop known bad changes after activation.
- The same failures are caught by CI when hooks are bypassed.
- All executable matrix entries link to commands and workflow evidence.
- All non-executable matrix entries link to explicit production prerequisites.
- Docker Compose health checks, all test layers, and the docs build pass.
- The public repository contains no credentials, generated secrets, or misleading deployment badges.
