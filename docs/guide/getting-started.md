# Five-minute setup

## Prerequisites

- Git
- Docker with Compose
- Make
- A POSIX-compatible shell

Node and scanners run through the repository toolchain or pinned containers.

```sh
./scripts/bootstrap
make check-fast
make dev
curl http://127.0.0.1:13000/health
make down
```

## Trigger a safe failure

Change the expected WIDGET total in `apps/pricing/test/price.unit.test.ts` from `3750` to `1`, then run:

```sh
make test-unit
```

The Pricing unit gate fails before any containers start. Restore `3750`, rerun the command, and observe it pass. After bootstrap, the same fast gate runs before commits; CI runs authoritative checks even with `git commit --no-verify`.

## Run boundary checks

```sh
make contracts
make integration
make e2e
make security
```
