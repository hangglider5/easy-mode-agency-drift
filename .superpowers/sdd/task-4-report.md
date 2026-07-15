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

## Review fixes: immutable event integrity

### RED: conflicting duplicate IDs

Command:

```text
npm test -- tests/unit/events.test.ts
```

Raw result (exit 1):

```text
 RUN  v4.1.10 /Users/kennyliang/CodexProjects/OpenAI Build Week/easy-mode-agency-drift/.worktrees/web-mvp

 ❯ tests/unit/events.test.ts (8 tests | 2 failed) 17ms
     × rejects a repeated event ID when the payload differs 3ms
     × rejects a repeated event ID used by another profile 1ms

 FAIL  tests/unit/events.test.ts > LedgerRepository > rejects a repeated event ID when the payload differs
AssertionError: expected [Function] to throw an error

 FAIL  tests/unit/events.test.ts > LedgerRepository > rejects a repeated event ID used by another profile
AssertionError: expected [Function] to throw an error

 Test Files  1 failed (1)
      Tests  2 failed | 6 passed (8)
```

`append` was then changed to inspect `run().changes`, load an ignored event by
its globally unique ID, and allow idempotency only when
`isDeepStrictEqual(existing, validated)` succeeds.

### RED: lossless JSON payload contract

Command:

```text
npm test -- tests/unit/events.test.ts
```

Raw result (exit 1):

```text
 RUN  v4.1.10 /Users/kennyliang/CodexProjects/OpenAI Build Week/easy-mode-agency-drift/.worktrees/web-mvp

 ❯ tests/unit/events.test.ts (21 tests | 11 failed) 120ms
     × rejects a undefined payload value 94ms
     × rejects a NaN payload value 1ms
     × rejects a positive Infinity payload value 0ms
     × rejects a negative Infinity payload value 0ms
     × rejects a BigInt payload value 0ms
     × rejects a function payload value 0ms
     × rejects a symbol payload value 0ms
     × rejects a Date payload value 0ms
     × rejects a non-plain object payload value 0ms
     × rejects a circular payload without overflowing the call stack 0ms
     × clones accepted payloads at the schema boundary 1ms

 Test Files  1 failed (1)
      Tests  11 failed | 10 passed (21)
```

The replacement JSON transform validates with an explicit ancestor set before
cloning, so circular input returns a Zod failure rather than recursing through a
lazy schema. It accepts only plain JSON objects and arrays, finite numbers, and
JSON primitives; object keys are sorted and `-0` is canonicalized to `0`.

### RED: recursive immutability

Command:

```text
npm test -- tests/unit/events.test.ts
```

Raw result (exit 1):

```text
 ❯ tests/unit/events.test.ts (21 tests | 1 failed) 20ms
     × deep-freezes the event and every nested JSON container 3ms

 FAIL  tests/unit/events.test.ts > DomainEventSchema > deep-freezes the event and every nested JSON container
AssertionError: expected false to be true // Object.is equality

 ❯ tests/unit/events.test.ts:216:44
    216|     expect(Object.isFrozen(event.payload)).toBe(true);

 Test Files  1 failed (1)
      Tests  1 failed | 20 passed (21)
```

The cloned JSON arrays and objects are now frozen bottom-up, while the existing
Zod `.readonly()` freezes the enclosing event. `JsonValue` and `JsonObject`
export recursively readonly TypeScript types.

### RED: JSON-ignored array properties

Command:

```text
npm test -- tests/unit/events.test.ts
```

Raw result (exit 1):

```text
 ❯ tests/unit/events.test.ts (22 tests | 1 failed) 21ms
     × rejects a array property that JSON would ignore payload value 3ms

 FAIL  tests/unit/events.test.ts > DomainEventSchema > rejects a array property that JSON would ignore payload value
AssertionError: expected true to be false // Object.is equality

 Test Files  1 failed (1)
      Tests  1 failed | 21 passed (22)
```

Array validation now permits only `length` and canonical in-range index keys;
properties such as `"01"` that `JSON.stringify` would omit are rejected.

### Final GREEN

Focused command:

```text
npm test -- tests/unit/events.test.ts tests/unit/replay.test.ts
```

Raw result (exit 0):

```text
 Test Files  2 passed (2)
      Tests  24 passed (24)
   Duration  1.27s
```

Full suite command and raw result (exit 0):

```text
npm test

 Test Files  5 passed (5)
      Tests  149 passed (149)
   Duration  1.27s
```

Typecheck command and raw result (exit 0):

```text
npm run typecheck

> tsc -b --pretty false
```

### Review-fix self-review

- Every `append` still uses `INSERT OR IGNORE`; a zero-change insert is checked
  against the global event ID and conflicts unless all structured event fields
  are deeply equal.
- The same `DomainEventSchema.parse` boundary validates, canonicalizes, clones,
  and deep-freezes append input and database readback.
- JSON validation rejects `undefined`, non-finite numbers, `BigInt`, functions,
  symbols and symbol keys, dates, non-plain objects, accessors/non-enumerable
  properties, sparse arrays, JSON-ignored array properties, and cycles.
- Accepted payloads contain only `JsonValue` data, so repository
  `JSON.stringify` does not drop or reinterpret validated content.
- No event update API, Task 5 source, or Task 5 behavior was added.

Review-fix commit scope:

```text
.superpowers/sdd/task-4-report.md
src/domain/events.ts
src/server/repositories/ledgerRepository.ts
tests/unit/events.test.ts
```

Review-fix commit message:

```text
fix: enforce immutable event integrity
```
