# Decision: native Git hooks

## Context

The repository needs fast local feedback without requiring a JavaScript hook package or a globally installed runner.

## Decision

Track small POSIX entry points under `.githooks/` and activate them per clone with `core.hooksPath`. Hooks call the same Make targets as CI.

## Consequences

- No Lefthook or Husky dependency.
- Activation is explicit and inspectable.
- Hooks cannot be forced and remain bypassable.
- GitHub Actions plus a branch ruleset are the enforcement boundary.
- If orchestration becomes complex, a hook manager can be adopted later without changing the canonical quality commands.
