# Verification matrix

No production environment is exercised by this repository. Empty cells in the source framework mean “not useful at this depth,” not “unimportant.”

| Stage              | Representative evidence                                   | Classification |
| ------------------ | --------------------------------------------------------- | -------------- |
| Development        | static analysis, types, unit and component tests          | Executable     |
| Pull request       | contracts, targeted integration, secrets and dependencies | Executable     |
| Main               | broad integration, critical E2E, immutable image identity | Executable     |
| Nightly            | extended suites and scheduled security evidence           | Executable     |
| Pre-production     | full integration, DAST, image scan, load, resilience      | Configurable   |
| Production canary  | SLOs, error rate, latency, business metrics               | Documented     |
| Production ongoing | synthetics, SLO alerts, continuous CVE monitoring         | Documented     |

## Concern placement

| Concern                   | Dev     | PR           | Main       | Nightly    | Pre-prod    | Production      |
| ------------------------- | ------- | ------------ | ---------- | ---------- | ----------- | --------------- |
| Static analysis and types | ●       | ●            |            |            |             |                 |
| Unit and component tests  | ●       | ●            | ●          |            |             |                 |
| Contract verification     |         | ●            | ●          |            | full        |                 |
| Integration tests         | focused | targeted     | broad      |            | full        |                 |
| E2E tests                 |         |              | critical   | extended   | critical    | synthetic       |
| Security                  |         | secrets, SCA |            | scheduled  | image, DAST | continuous CVE  |
| Performance               |         |              | regression | load, soak | load        | canary          |
| Resilience                |         |              |            | candidate  | rehearsal   | controlled      |
| Observability             |         |              |            |            | checks      | SLOs and paging |
