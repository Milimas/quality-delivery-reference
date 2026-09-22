# Gate catalog

| Gate          | Command               | Evidence                                      | Owner                    | Blocks            |
| ------------- | --------------------- | --------------------------------------------- | ------------------------ | ----------------- |
| Fast feedback | `make check-fast`     | formatting, lint, types, unit results         | change author            | local commit      |
| Component     | `pnpm test:component` | service-boundary results                      | service owner            | PR                |
| Contract      | `make contracts`      | oasdiff compatibility report                  | API owner                | PR                |
| Integration   | `make integration`    | real service/database result and failure logs | platform team            | PR/main           |
| Critical E2E  | `make e2e`            | order lifecycle result                        | product/service owners   | main readiness    |
| Security      | `make security`       | leak and dependency audit                     | security + service owner | PR                |
| Artifact      | `make build-images`   | image IDs and vulnerability report            | release owner            | release readiness |

Failures are never retried until green without preserving the first result. Integration runners print service logs, tear down volumes, and return the original failure code.
