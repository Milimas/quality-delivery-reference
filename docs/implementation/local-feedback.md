# Local feedback

`./scripts/bootstrap` checks prerequisites before changing Git configuration, then runs `git config core.hooksPath .githooks` for this clone.

- `pre-commit` delegates to `make check-fast`.
- `pre-push` delegates to `make check`.
- Both resolve the repository root, so invocation from a subdirectory works.

Hooks are not enforcement. They are clone-local, require activation, and can be bypassed. Required GitHub checks protect the shared branch.
