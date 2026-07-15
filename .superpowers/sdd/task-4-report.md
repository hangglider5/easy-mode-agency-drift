# Task 4 Report: Append-only decision ledger

## Scope completed

- Added the immutable `DomainEventSchema` / `DomainEvent` contract.
- Added the checked-in SQLite schema and source/build-compatible schema loading.
- Added `LedgerRepository.createProfile`, `append`, `list`, and `deleteProfile`.
- Kept events append-only: there is no event update API.
- Added replay semantics that start at, and include, the latest `profile_reset`.
- Added focused regressions for event validation, idempotency, stable append
  sequence, cascade deletion, update-API absence, and reset boundaries.
- Did not begin Task 5.

## RED evidence

### Initial repository and replay contract

Command:

```text
npm test -- tests/unit/events.test.ts tests/unit/replay.test.ts
```

Raw result (exit 1):

```text
> web-mvp@1.0.0 test
> vitest run tests/unit/events.test.ts tests/unit/replay.test.ts

 RUN  v4.1.10 /Users/kennyliang/CodexProjects/OpenAI Build Week/easy-mode-agency-drift/.worktrees/web-mvp

 ❯ tests/unit/replay.test.ts (0 test)
 ❯ tests/unit/events.test.ts (0 test)

 Failed Suites 2

 FAIL  tests/unit/events.test.ts [ tests/unit/events.test.ts ]
Error: Failed to resolve import "../../src/server/db/database" from "tests/unit/events.test.ts". Does the file exist?

 FAIL  tests/unit/replay.test.ts [ tests/unit/replay.test.ts ]
Error: Failed to resolve import "../../src/domain/replay" from "tests/unit/replay.test.ts". Does the file exist?

 Test Files  2 failed (2)
      Tests  no tests
```

This was the expected RED: the required production modules did not exist.

### Immutable event contract

Command:

```text
npm test -- tests/unit/events.test.ts
```

Raw result (exit 1):

```text
> web-mvp@1.0.0 test
> vitest run tests/unit/events.test.ts

 RUN  v4.1.10 /Users/kennyliang/CodexProjects/OpenAI Build Week/easy-mode-agency-drift/.worktrees/web-mvp

 ❯ tests/unit/events.test.ts (6 tests | 1 failed) 17ms
     × returns an immutable domain event contract 3ms

 FAIL  tests/unit/events.test.ts > DomainEventSchema > returns an immutable domain event contract
AssertionError: expected false to be true // Object.is equality

- Expected
+ Received

- true
+ false

 Test Files  1 failed (1)
      Tests  1 failed | 5 passed (6)
```

This isolated RED proved that a plain Zod object did not enforce the immutable
event contract before `.readonly()` was applied.

## GREEN evidence

### Focused Task 4 tests

Command:

```text
npm test -- tests/unit/events.test.ts tests/unit/replay.test.ts
```

Raw result (exit 0):

```text
> web-mvp@1.0.0 test
> vitest run tests/unit/events.test.ts tests/unit/replay.test.ts

 RUN  v4.1.10 /Users/kennyliang/CodexProjects/OpenAI Build Week/easy-mode-agency-drift/.worktrees/web-mvp

 Test Files  2 passed (2)
      Tests  8 passed (8)
   Duration  708ms
```

### Full test suite

Command:

```text
npm test
```

Raw result (exit 0):

```text
> web-mvp@1.0.0 test
> vitest run

 RUN  v4.1.10 /Users/kennyliang/CodexProjects/OpenAI Build Week/easy-mode-agency-drift/.worktrees/web-mvp

 Test Files  5 passed (5)
      Tests  133 passed (133)
   Duration  932ms
```

### Typecheck

Command:

```text
npm run typecheck
```

Raw result (exit 0):

```text
> web-mvp@1.0.0 typecheck
> tsc -b --pretty false
```

## Self-review

- `DomainEventSchema.parse()` runs before every insert and returns a frozen,
  readonly event value.
- `INSERT OR IGNORE` applies global event-ID idempotency after validation.
- `sequence INTEGER PRIMARY KEY AUTOINCREMENT` plus `ORDER BY sequence ASC`
  makes list order stable and independent of `occurredAt`.
- SQL values use bound parameters; event payloads are JSON serialized at the
  repository boundary and parsed back through `DomainEventSchema` on read.
- `PRAGMA foreign_keys = ON` and `ON DELETE CASCADE` remove a profile's events;
  `deleteProfile` wraps the deletion in one database transaction.
- No update method or SQL update path exists for events.
- `replayProfile` preserves all history in `allEvents` and slices
  `activeEvents` from the latest reset inclusively.
- `database.ts` resolves `schema.sql` through the module directory. This avoids
  Vite rewriting `new URL(..., import.meta.url)` to an HTTP asset URL and also
  matches the existing production build copy to `dist/server/schema.sql`.
- No Task 5 files or behavior were added.

## Commit scope

Only these Task 4 artifacts are intended for the commit:

```text
.superpowers/sdd/task-4-report.md
src/domain/events.ts
src/domain/replay.ts
src/server/db/database.ts
src/server/db/schema.sql
src/server/repositories/ledgerRepository.ts
tests/unit/events.test.ts
tests/unit/replay.test.ts
```

Planned commit message:

```text
feat: add append-only decision ledger
```
