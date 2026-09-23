# CI authority

The pull-request workflow has separate fast, service-test, real-adapter, contract, integration, and security jobs. The stable `quality-gate` job runs with `always()` and fails unless every required job succeeded. Configure the `main` ruleset to require this one stable status after it has run once.

The service-test job runs `make service-tests`, which executes unit and component suites once and writes `artifacts/tests/service-tests.json`. The focused PostgreSQL adapter contract stays in the separate `make test-adapters` job so commit-time feedback does not require a database container.

Recommended ruleset:

1. Target the default branch.
2. Require a pull request and one approval.
3. Require `quality-gate` and an up-to-date branch.
4. Block force pushes and branch deletion.
5. Keep administrator bypass explicit and audited.

Main records immutable image evidence but does not publish or deploy it. Nightly runs deeper repository checks and explicitly states that no production environment was exercised.
