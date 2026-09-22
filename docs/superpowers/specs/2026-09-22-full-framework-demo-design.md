# Full Quality Framework Demo Design

## Purpose

This repository will be a runnable reference implementation of the quality framework described in [From Code to Production](https://www.beihaqi.com/blog/from-code-to-production) and its deep-dive articles. It will demonstrate how one change accumulates evidence from design and local development through pull request, main, nightly, pre-production, canary, and ongoing production verification.

The repository will not claim to deploy to a real production environment. It will execute every concern that can be represented honestly with local containers and GitHub Actions, produce inspectable evidence, and document the external capabilities required to turn the demonstration profiles into real environments.

## Success criteria

- Each delivery stage runs a materially different depth of verification.
- Each gate names its inputs, command, evidence, owner, blocking policy, and failure response.
- Single-service, synchronous, asynchronous, data, supply-chain, performance, resilience, observability, and rollout concerns all have executable demonstrations.
- Production-only claims remain explicitly classified as demonstration evidence or external requirements.
- A developer can run the framework with Git, Docker Compose, Make, and a POSIX shell.
- GitHub Actions provides the authoritative PR decision through one stable `quality-gate` status.
- No stage hides failures behind unrestricted retries or reports simulated success as a real deployment.

## Representative platform

The platform remains intentionally small while adding enough boundaries to exercise the framework:

```text
Client
  |
  v
Orders API ----- synchronous HTTP -----> Pricing API
  |
  +----- PostgreSQL transaction
  |          |
  |          +----- transactional outbox
  |                       |
  |                       v
  |                  Outbox relay
  |                       |
  |                       v
  |                    Redpanda
  |                       |
  |                       v
  +---------------- Fulfillment worker
```

- **Pricing** owns deterministic price calculation and exposes a versioned HTTP API.
- **Orders** obtains a quote, commits the order and its event atomically, and exposes order state.
- **Outbox relay** publishes committed outbox records to a Kafka-compatible broker.
- **Fulfillment** consumes `OrderCreated` idempotently and exposes fulfillment state.
- **PostgreSQL** provides real persistence for Orders, outbox records, and Fulfillment.
- **Redpanda** provides a locally runnable Kafka-compatible event boundary.

## Delivery stages

| Stage                 | Executable evidence                                                                                               | Decision                                                  |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Development           | formatting, lint, types, deterministic unit tests, component tests                                                | native hook permits commit                                |
| Pull request          | all service tests, HTTP/event compatibility, targeted integration, secrets and SCA                                | `quality-gate` permits merge                              |
| Main                  | broad integration, critical E2E, migration compatibility, scanned images, SBOMs, provenance and immutable digests | produces release-candidate evidence                       |
| Nightly               | extended E2E, load and soak smoke profiles, dependency fault scenarios, flaky-test and duration report            | opens durable triage evidence                             |
| Pre-production demo   | full Compose profile, DAST, load threshold, migration and resilience rehearsal                                    | produces approval recommendation                          |
| Canary demo           | baseline-versus-candidate SLI and business-metric evaluation                                                      | emits promote, hold, abort, or insufficient-data decision |
| Production-check demo | synthetic transaction, SLO/error-budget evaluation, CVE and incident-policy inputs                                | emits page, rollback, or continue decision                |

Pre-production, canary, and production-check profiles are executable demonstrations. Their output must contain `environment_classification: demonstration` and must never be described as evidence from a real environment.

## Single-service test architecture

### Deterministic core

Orders receives explicit `Clock` and `IdGenerator` dependencies. Unit tests use fixed implementations and assert complete literal order values. Production wiring uses system implementations.

Pricing adds deterministic property-based tests with fixed seeds. Properties cover quantity bounds, integer-cent arithmetic, non-negative totals, and multiplication invariants. A failed property run prints the seed and minimized counterexample.

### Real adapters and honest fakes

`OrderRepository` and `FulfillmentRepository` each have a shared behavioral contract suite. The same suite runs against the in-memory fake and the real PostgreSQL adapter. Focused adapter tests cover round trips, missing records, duplicate semantics, constraints, and timestamp fidelity.

Fakes live in test-support modules rather than being duplicated across test files. Mocks are reserved for interaction protocols where call order or non-occurrence is the behavior under test. Component tests exercise real application wiring with only process-boundary ports substituted.

### Test-system properties

Every suite records duration. Tests do not retry by default. Randomized tests use recorded seeds. A quality report identifies slow tests, retried tests, failures by concern, and potential flaky behavior without converting failures into passes.

## Contract and compatibility verification

### HTTP

Orders and Pricing keep versioned OpenAPI contracts. `oasdiff` validates syntax and rejects incompatible changes relative to the PR base. Runtime component tests assert the implemented stable error and success shapes.

### Events

`OrderCreated` is described by a versioned AsyncAPI document and JSON Schema. Producer and consumer tests validate real serialized messages. Compatibility checks reject removal of required fields, incompatible type changes, and semantic version regressions while allowing additive optional fields.

### Deployment compatibility

The repository generates a compatibility manifest containing service version, consumed contract versions, provided contract versions, and verification result. A local `can-deploy` command decides whether a set of service artifacts is compatible. It demonstrates the decision model of a contract broker without claiming to replace a shared organizational broker.

## Asynchronous messaging guarantees

Orders writes the order and outbox record in one PostgreSQL transaction. The relay publishes unpublished records and marks them only after broker acknowledgement. Fulfillment stores processed event IDs and the fulfillment record transactionally.

Executable scenarios cover:

- successful publish and consume;
- duplicate delivery without duplicate fulfillment;
- relay and consumer restart;
- bounded retry with preserved first failure;
- retry exhaustion and dead-letter routing;
- broker interruption and recovery;
- eventual-consistency deadlines;
- compatible and incompatible event evolution;
- the documented per-key ordering assumption.

Exactly-once delivery is not claimed. The demonstrated guarantee is at-least-once delivery with idempotent consumption.

## Performance and resilience

### Performance

k6 provides three profiles:

- `smoke`: short PR-safe functional load;
- `regression`: main/nightly latency and error thresholds;
- `soak`: manually triggered or scheduled longer-duration profile.

Evidence contains request count, throughput, error rate, and p50/p95/p99 latency. Threshold failure exits non-zero. Resource-heavy profiles remain opt-in locally but scheduled in CI where appropriate.

### Resilience

Toxiproxy introduces controlled latency, connection failure, and recovery at the Pricing, PostgreSQL, and broker boundaries. Scenarios assert user-visible error shape, absence of partial writes, bounded recovery time, outbox recovery, and fulfillment convergence.

Fault scenarios are deterministic and scoped to disposable Compose projects. Cleanup always runs, while the first failure and service logs remain available as artifacts.

## Supply-chain evidence

Main builds each production image once. The supply-chain gate then:

- scans the exact image;
- generates an SPDX or CycloneDX SBOM;
- generates build provenance;
- records the immutable local digest;
- emits deployment manifests referencing that digest;
- packages all evidence as workflow artifacts.

An optional registry adapter may publish the same digest when credentials are configured. Without a registry, output is classified as local release-candidate evidence and no promotion claim is made. GitHub OIDC and short-lived credentials are required for any future external publisher.

## Staged environment profiles

Compose profiles separate concerns without duplicating the platform definition:

- `development`: application dependencies and host-accessible APIs;
- `integration`: isolated application, database, broker, relay, and worker;
- `preproduction`: integration plus DAST, load generator, Toxiproxy, telemetry collector, and Prometheus;
- `canary`: two application variants plus deterministic traffic and metric fixtures;
- `production-checks`: synthetic client and policy evaluators.

PostgreSQL remains unpublished in every profile. Development APIs bind only to loopback. CI projects use unique names and disposable volumes.

## Observability and rollout decisions

Services emit structured logs, traces through OpenTelemetry, and Prometheus-compatible metrics. Required signals include request count, error count, duration, order outcome, outbox backlog, event age, consumer failures, dead-letter count, and fulfillment success.

The repository includes an OpenTelemetry Collector, Prometheus configuration, and minimal dashboards or query examples. Trace context crosses the HTTP boundary and is propagated in event metadata.

The canary evaluator consumes explicit baseline and candidate measurements plus a policy. It emits exactly one decision:

- `PROMOTE`;
- `HOLD`;
- `ABORT_AND_ROLLBACK`;
- `INSUFFICIENT_DATA`.

Policy inputs include availability, p95 latency, error rate, order-success rate, minimum traffic, evaluation window, and missing-data behavior. Fixture tests cover every decision; the demo profile can also evaluate live local metrics.

Production-check demonstrations run a synthetic order, evaluate SLO/error-budget fixtures, and combine security and incident-policy inputs into a documented operational response. They do not page a real person or mutate an external deployment.

## Database evolution

Migrations are versioned and executed separately from application startup. The demo includes an expand/contract change exercised against old and new service versions. CI verifies upgrade compatibility and prevents a destructive contract step until old readers are absent. Migration authorization, rollback authority, and roll-forward guidance are documented as external operational responsibilities.

## Quality-system health

Each authoritative workflow emits a machine-readable summary containing concern, command, result, duration, retry count, artifact links, and commit. A report aggregates suite duration, slow tests, failure categories, retry use, and gate result.

The demo explains how to connect long-term DORA and flaky-test history, but it does not invent historical metrics. Coverage is available as diagnostic evidence only and is not the primary quality target.

## Canonical commands

```text
make check-fast
make check
make contracts
make integration
make e2e
make performance-smoke
make performance-regression
make resilience
make supply-chain
make preproduction
make canary
make production-checks
make quality-report
```

Native Git hooks delegate to the fast and full commands. GitHub Actions call the same canonical commands. Scripts return the underlying failure code, collect relevant artifacts, and never silently retry until green.

## Repository organization

```text
apps/{orders,pricing,fulfillment,outbox-relay}/
contracts/{http,events}/
deploy/compose/{development,integration,preproduction,canary}/
deploy/manifests/
observability/{otel-collector,prometheus,dashboards,slo}/
performance/k6/
resilience/{toxiproxy,scenarios}/
scripts/quality/
artifacts/{contracts,tests,performance,resilience,supply-chain,rollout,quality-system}/
```

Generated evidence under `artifacts/` is ignored except for schemas and examples that define its stable format.

## Security and failure handling

- Third-party Actions and container images are version-pinned; Actions use immutable SHAs.
- Workflow permissions default to read-only and expand per job only when required.
- Test secrets are randomized and path-scoped in scanner allowlists.
- Services run as non-root where supported and production images exclude package managers and build tooling.
- Every scenario uses bounded timeouts and unique disposable state.
- Cleanup does not erase failure evidence.
- The stable PR gate fails for failed, cancelled, skipped, or missing required concerns.

## Documentation contract

The published guide mirrors the article's delivery path and verification matrix. Each cell links to a command and evidence example or is labeled `Documented external requirement`. The guide distinguishes:

- executable repository evidence;
- executable demonstration profiles;
- optional external integration;
- real production evidence not supplied by this repository.

The existing matrix must be corrected before new capabilities are claimed. A capability becomes `Executable` only after its command and behavioral test pass in CI.

## Implementation decomposition

The architecture is delivered through six independently reviewable plans:

1. Single-service test architecture and honest framework matrix.
2. HTTP/event contracts and asynchronous messaging.
3. Performance and resilience profiles.
4. Supply-chain evidence and staged Compose environments.
5. Observability, SLO, canary, and production-check decisions.
6. Quality-system health, complete CI progression, and documentation alignment.

Each plan must leave the repository green and add only claims backed by executable evidence.
