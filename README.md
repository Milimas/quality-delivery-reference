# Quality Delivery Reference

A runnable reference for moving a change from local development toward production with explicit evidence at every gate.

It manifests the framework from [From Code to Production: A Quality Framework for Multi-Service Platforms](https://www.beihaqi.com/blog/from-code-to-production) as two small services, Lefthook-managed Git hooks, shared quality commands, GitHub Actions, and an implementation guide.

> This repository does not deploy to production. It executes the gates that are honest on a workstation and in CI, then documents exactly what real pre-production and production stages require.

## Delivery path

```text
Development → Pull request → Main → Nightly → Pre-production → Canary → Production
    fast       authority     artifact   deeper      connect       SLOs      observe
```

The first four stages produce executable repository evidence. Pre-production is configurable; canary and ongoing production are documented requirements.

## Prerequisites

- Git
- Node.js 24 and pnpm
- Docker with Compose
- Make
- A POSIX-compatible shell

PostgreSQL, oasdiff, Gitleaks, and Trivy are project or container dependencies rather than global prerequisites.

## Five-minute path

```sh
./scripts/bootstrap
make check-fast
make integration
make e2e
make security
make docs-build
```

Start the example platform with `make dev`, call Orders on `http://127.0.0.1:13000`, then stop it with `make down`.

## Repository map

```text
apps/orders/      order API, PostgreSQL adapter, unit/component tests
apps/pricing/     pricing API and focused tests
contracts/        versioned OpenAPI contracts
scripts/quality/  canonical local and CI gates
lefthook.yml       pre-commit and pre-push quality commands
.github/          authoritative workflows and contribution policy
docs/             VitePress implementation guide
tests/            contract, integration, E2E, security, and meta tests
```

## Commands

| Command             | Evidence                                       |
| ------------------- | ---------------------------------------------- |
| `make check-fast`   | formatting, lint, types, unit tests            |
| `make check`        | fast checks, component/meta tests, contracts   |
| `make contracts`    | OpenAPI validity and breaking-change detection |
| `make integration`  | real Pricing/Orders/PostgreSQL interaction     |
| `make e2e`          | critical order lifecycle                       |
| `make security`     | secret and dependency audit                    |
| `make build-images` | image vulnerability scan and immutable IDs     |
| `make docs-build`   | static reference documentation                 |

## Enforcement model

Lefthook shortens feedback but can be skipped. The pull-request workflow's stable `quality-gate` is the branch-ruleset requirement and fails unless every required concern succeeds.

See the [documentation](docs/index.md), [design](docs/superpowers/specs/2026-09-22-quality-delivery-reference-design.md), and [implementation plan](docs/superpowers/plans/2026-09-22-quality-delivery-reference.md).

## License

MIT
