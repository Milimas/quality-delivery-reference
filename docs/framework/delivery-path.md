# The delivery path

A change moves through increasingly expensive evidence. Earlier gates optimize feedback; later gates protect shared environments and users.

| Transition            | Evidence                                                    | Decision                      |
| --------------------- | ----------------------------------------------------------- | ----------------------------- |
| Edit → commit         | formatting, lint, types, focused tests                      | developer fixes or commits    |
| Branch → PR           | all tests, contracts, integration, secrets, dependencies    | `quality-gate` permits merge  |
| Main → releasable     | immutable image identities, broad integration, critical E2E | artifact becomes eligible     |
| Pre-prod → canary     | DAST, image scan, load and resilience rehearsal             | approver permits exposure     |
| Canary → production   | error rate, latency, saturation, business health            | automation promotes or aborts |
| Production → learning | synthetics, SLOs, CVEs, incidents                           | page, rollback, or improve    |

The first three transitions are executable here. The others require the infrastructure listed in [Production requirements](/production/requirements).
