# Task 5 Report: Preference Lineage and Agency Metrics

## RED

Command:

```bash
npm test -- tests/unit/lineage.test.ts tests/unit/consent.test.ts tests/unit/projections.test.ts tests/unit/metrics.test.ts
```

Observed result before implementation: exit code 1. All four suites failed at
import resolution because `src/domain/lineage.ts`, `consent.ts`,
`projections.ts`, and `metrics.ts` did not exist. This was the expected failure
for the missing Task 5 domain engines.

## GREEN

Focused verification after implementation:

```text
Test Files  4 passed (4)
Tests       16 passed (16)
```

Full regression verification:

```text
Test Files  9 passed (9)
Tests       165 passed (165)
```

Type verification:

```text
npm run typecheck
exit code 0
```

## Self-check

- Parsed event payloads through event-specific Zod schemas; did not weaken or
  cast around the deep-readonly `DomainEvent.payload` contract.
- Preserved AI source ancestry when a human confirms a preference.
- Rejected direct and multi-node lineage cycles; synthetic-depth traversal also
  detects cycles without recursive overflow.
- Resolved consent by replay order. The latest category grant is authoritative,
  revoking the current grant yields no consent, revoking an older grant does not
  cancel the current grant, and a lower grant cannot authorize higher delegation.
- Limited Declared You to active explicit/independent sources and included active
  AI-derived sources in Proxy You.
- Kept metrics deterministic and non-mutating, returned stable zero values for
  empty denominators, and bounded ratio metrics to `[0, 1]`.
- `git diff --check` passed.

## Scope

Task 5 only:

- `src/domain/lineage.ts`
- `src/domain/consent.ts`
- `src/domain/projections.ts`
- `src/domain/metrics.ts`
- `tests/unit/lineage.test.ts`
- `tests/unit/consent.test.ts`
- `tests/unit/projections.test.ts`
- `tests/unit/metrics.test.ts`
- `.superpowers/sdd/task-5-report.md`

No Task 4 contract files or Task 6 files were changed.
