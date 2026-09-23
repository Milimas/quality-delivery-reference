# Local feedback

`./scripts/bootstrap` checks prerequisites, removes the repository's legacy `.githooks` setting when present, runs the frozen pnpm install, and explicitly installs the pinned hooks from `lefthook.yml`. The root `prepare` script also installs them on dependency setup.

- `pre-commit` delegates to `make check-fast`.
- `pre-push` delegates to `make check`.
- Lefthook runs both commands from the repository root.

Hooks are not enforcement. They are clone-local and can be bypassed. Required GitHub checks protect the shared branch.

Container dependency installs set `LEFTHOOK=0`: image builds need packages, but they have no Git checkout in which to install developer hooks.
