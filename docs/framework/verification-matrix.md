# Verification matrix

No production environment is exercised by this repository. Empty cells in the source framework mean “not useful at this depth,” not “unimportant.”

`Executable` means a linked repository command currently produces the evidence. `Demonstration` is an executable illustration that is not real environment evidence. `External requirement` needs systems this repository cannot supply. `Not implemented` means there is no command or evidence yet.

| Stage              | Representative evidence                                   | Classification       |
| ------------------ | --------------------------------------------------------- | -------------------- |
| Development        | static analysis, types, unit and component tests          | Executable           |
| Pull request       | contracts, targeted integration, secrets and dependencies | Executable           |
| Main               | integration, critical E2E, local image evidence           | Executable           |
| Nightly            | scheduled repetition of current gates                     | Demonstration        |
| Pre-production     | no environment workflow yet                               | Not implemented      |
| Production canary  | real SLO and rollout controller required                  | External requirement |
| Production ongoing | real telemetry, paging and CVE services required          | External requirement |

## Concern placement

| Concern                   | Dev        | PR         | Main                                     | Nightly                                  | Pre-prod                               | Production           |
| ------------------------- | ---------- | ---------- | ---------------------------------------- | ---------------------------------------- | -------------------------------------- | -------------------- |
| Static analysis and types | Executable | Executable |                                          |                                          |                                        |                      |
| Unit and component tests  | Executable | Executable | Executable                               |                                          |                                        |                      |
| Contract verification     |            | Executable | Executable                               |                                          | Not implemented                        |                      |
| Integration tests         |            | Executable | Executable                               |                                          | Not implemented                        |                      |
| E2E tests                 |            |            | Executable                               | Demonstration                            | Not implemented                        | External requirement |
| Security                  |            | Executable |                                          | Demonstration                            | authenticated DAST — Not implemented   | External requirement |
| Performance               |            |            | performance regression — Not implemented | load and soak evidence — Not implemented | Not implemented                        | External requirement |
| Resilience                |            |            |                                          | Not implemented                          | resilience rehearsal — Not implemented | External requirement |
| Observability             |            |            |                                          |                                          | Not implemented                        | External requirement |
