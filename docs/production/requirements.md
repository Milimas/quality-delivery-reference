# Production requirements

This repository does not deploy a fake production environment. Connect these capabilities before treating later delivery stages as evidence.

## Artifact registry

Publish a single scanned image by digest, retain provenance and SBOMs, and promote the same digest between environments.

## Workload identity

Use GitHub OIDC and short-lived cloud credentials. Protect environment-scoped secrets and prohibit long-lived deployment keys.

## Progressive rollout and rollback

Choose a controller that supports health checks, gradual traffic, automatic abort, and rollback to a known digest. Define thresholds before rollout.

## Database migrations

Use expand/contract changes compatible with old and new service versions. Separate migration authorization from application startup.

## Telemetry and ownership

Centralize structured logs, metrics, and traces. Attach service owner, runbook, dashboard, and paging metadata to every deployable service.

## SLIs, SLOs, and canary policy

Define availability, latency, saturation, and business-success indicators; error budgets; evaluation windows; minimum traffic; promote/abort thresholds; and missing-data behavior.

## Security scanning

Add registry scanning, SBOM retention, continuous CVE monitoring, authenticated DAST against pre-production, severity policy, exceptions, and remediation ownership.

## Test data and resilience

Provide production-shaped non-sensitive data, isolation boundaries, load budgets, and blast-radius controls for chaos experiments.

## Incident response and audit

Define paging, rollback authority, incident command, evidence retention, access review, and post-incident learning. Test the runbooks before relying on them.
