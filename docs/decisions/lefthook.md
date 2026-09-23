# Decision: pinned Lefthook configuration

## Context

The repository needs consistent local feedback with one cross-platform configuration shared by the team.

## Decision

Pin Lefthook in the workspace and define `pre-commit` and `pre-push` in `lefthook.yml`. The package lifecycle installs the hooks, while each hook delegates to the same Make target used outside the hook.

## Consequences

- One configuration describes all local hooks.
- The lockfile gives every contributor the same Lefthook version.
- Bootstrap now requires Node.js and pnpm and migrates the previous `.githooks` setting.
- Hooks remain bypassable; GitHub Actions and the branch ruleset are authoritative.
- Quality logic remains in canonical Make targets rather than in Lefthook-specific commands.
