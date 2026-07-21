# Codex and GPT-5.6 Build Evidence

This document records how Codex and GPT-5.6 were used to build **Easy Mode: Agency Drift**. It intentionally separates development assistance from the model used by the shipped application.

## Build session

- **Codex `/feedback` Session ID:** `019f5fb3-6b56-78c1-84a9-96746f6f9de0`
- **Development environment:** Codex with GPT-5.6
- **Evidence scope:** the design, implementation, tests, debugging work, and demo production represented by this repository and its Git history

The Session ID above is the Codex task in which the majority of the project was designed and implemented. The repository evidence below is included so the claim does not depend on a generic “built with AI” statement.

## Runtime boundary

GPT-5.6 is **build tooling**, not a runtime API dependency of Easy Mode.

The production application sends model requests only to OpenRouter's OpenAI-compatible endpoint and pins the route to `deepseek/deepseek-v4-pro`. It requires `OPENROUTER_API_KEY`; it has no `OPENAI_API_KEY` setting and makes no request to an OpenAI API endpoint. The `openai` JavaScript package is used only as a compatible HTTP client for OpenRouter.

```text
Browser
  -> Express API
      -> deterministic risk gate, consent, ledger, lineage, and metrics
      -> OpenRouter (https://openrouter.ai/api/v1)
           -> deepseek/deepseek-v4-pro
```

The runtime boundary can be verified in `.env.example`, `src/server/config.ts`, `src/server/index.ts`, and `src/server/providers/openrouterGateway.ts`. Deterministic receipts and audit metrics are calculated from local ledger events in `src/server/services/receiptService.ts`; they are not generated or graded by an LLM.

## Concrete contributions made with Codex and GPT-5.6

| Area | What the Codex session contributed | Repository evidence |
| --- | --- | --- |
| Product framing and architecture | Turned the initial “AI life assistant” idea into a useful first act (Decision Sweep) and a satirical second act about recursive preference learning. Defined a React/Vite client, Express API, append-only SQLite ledger, deterministic consent/lineage/metrics, and a separately bounded model gateway. | Commits `fb74a40`, `bbe1de5`, and `49ced4d`; `docs/superpowers/specs/2026-07-14-easy-mode-agency-drift-design.md`; `docs/superpowers/plans/2026-07-14-easy-mode-agency-drift-web-mvp.md` |
| Core implementation | Implemented domain contracts, immutable event validation, ledger replay, preference ancestry, consent resolution, Declared You / Proxy You projections, API services, and the Decision Sweep UI. | Commits `57ac2c1`, `3bd6a12`, `40707bc`, `9052a96`, `743e3f2`, and `dca5c77`; `src/domain/`; `src/server/services/`; `src/client/features/sweep/` |
| Model integration | Replaced the original direct provider plan with a server-only OpenRouter gateway pinned to DeepSeek V4 Pro. Added structured JSON validation, bounded operation deadlines, no SDK retries, one validation-repair opportunity, provider privacy/routing controls, and sanitized failures. | Commit `d2ec886`; `src/server/providers/openrouterGateway.ts`; `src/server/config.ts`; `tests/unit/openrouterGateway.test.ts`; `tests/unit/config.test.ts` |
| Live OpenRouter debugging | A user-authorized live front-end run exposed that separate decisions could be merged and that the model could invent support such as treating “optional” as “no penalty.” The input layout and prompts were corrected to preserve one decision per line and forbid unsupported consequences, then regression tests were added. | Commit `3b861b7`; `DecisionSweepPage.tsx`; prompt assertions in `tests/unit/openrouterGateway.test.ts`. The credential-gated schema smoke harness remains in `tests/integration/model-smoke.test.ts`. The live response itself was not committed because it may contain provider output and is not needed to reproduce the test. |
| Test design and review | Designed tests around invariants rather than screenshots: event immutability, replay, lineage cycles and identity, consent revocation, deterministic metrics, provider deadlines/retries, error redaction, schema validation, UI state, API flows, and demo receipts. Follow-up review found and fixed event-integrity and preference-identity defects. | Commits `40707bc` and `21507e7`; `tests/unit/events.test.ts`; `tests/unit/lineage.test.ts`; `tests/unit/consent.test.ts`; `tests/unit/openrouterGateway.test.ts`; `tests/integration/api.test.ts` |
| Safety and red-team cases | Restricted the product to low-stakes, reversible decisions and created deterministic screening for medical, legal, financial, self-harm, violence, irreversible-life, and nonconsenting-person cases. Iterative adversarial examples closed paraphrase and financial-transfer gaps. Unsafe decisions are blocked before recommendation. | Commits `57ac2c1`, `4be382f`, `b2ba9c3`, `7ced8d4`, `9abbb4b`, `2a5a9d0`, `8704c32`, `8740386`, and `32176cd`; `src/domain/risk.ts`; `tests/unit/risk.test.ts`; provider-boundary assertions in `tests/integration/api.test.ts` |
| Reveal and deterministic audit | Built the Proxy You comparison, three-generation preference lineage, Perfect Consent receipt, Demo Profile, Agency Drift Replay, and deterministic Exit Decision Receipt. Kept the real manual exit visible and functional. | Commits `6d56bf5`, `87e49cd`, `c922fea`, and `14575c1`; `src/client/features/drift/`; `src/client/features/proxy/`; `src/client/features/receipt/`; `src/server/fixtures/demoProfile.ts`; `src/server/services/receiptService.ts` |
| Demo and video production | Planned and automated a repeatable browser capture, Remotion edit, synthetic offline narration, captions, chapter framing, and media QA. The final cut explicitly says that Codex/GPT-5.6 built the project and that OpenRouter/DeepSeek is the separate runtime. | Commits `3212419`, `34a8a2d`, `0ef5015`, and `14575c1`; `scripts/record-demo-v2.mjs`; `video/root.tsx`; `docs/demo-video/task15-video-v2-script.md`; `docs/demo-video/task15-video-v2-qa.md` |

Commit authorship remains attributed to the human repository owner. “Contributed” here means the Codex/GPT-5.6 session was used to reason about, draft, implement, test, inspect, and revise the cited work under human direction; it does not mean the model independently owned product decisions or deployed the application.

## Material human decisions

The human builder made the product and scope decisions that shaped the work, including:

1. **Satirize voluntary surrender of judgment, not AI villainy.** The target became the user who repeatedly delegates small choices, with political analogy and sensitive real-world cases deliberately excluded.
2. **Make the assistant useful before revealing the critique.** Decision Sweep was narrowed to clearing three to five delayed, low-stakes decisions and converting recommendations into action artifacts.
3. **Use “Agency Drift” as the public framing.** The project treats alienation as observable provenance drift rather than as an abstract political or philosophical claim.
4. **Show transformation, not only the result.** The final demo added `ASKED -> CONFIRMED -> NOTIFIED -> NOT CONSULTED`, followed by Proxy You, Perfect Consent, and the Exit Decision Receipt.
5. **Keep user agency technically real.** `I'll decide myself` remains visible and functional even though the final video intentionally ends on the darker delegated-exit outcome.
6. **Reject an unnecessary GPT-5.6 runtime integration.** Build Week's Codex/GPT-5.6 requirement is satisfied through the documented build process. The application itself stays on the chosen OpenRouter -> DeepSeek V4 Pro runtime instead of adding a second model merely for submission optics.
7. **Use a restrained visual and demo language.** The UI was unified around green, white, and graphite; loan or other high-risk examples were removed; and the final slogan was chosen as: “ChatGPT helps you think. Easy Mode lets you stop.”

These choices are reflected in the design history (`fb74a40` through `0b14690`) and in the Task 15 implementation and script (`14575c1`).

## Verification and reproducibility

At the Task 15 checkpoint (`14575c1`), the recorded verification was:

- `npm test`: **281 passed, 1 skipped**
- `npm run typecheck`: passed
- `npm run build`: passed
- standalone Playwright master capture: zero page errors and zero console warnings
- final media: 1920x1080 H.264, 25 fps, 150 seconds of picture; full FFmpeg decode passed

The skipped test is the credential-gated live model smoke. It is deliberately opt-in so a routine test run cannot spend API credits or depend on network availability.

To reproduce the offline checks:

```bash
npm ci
npm test
npm run typecheck
npm run build
npm run test:e2e
```

The focused Playwright test follows the model-free `/demo/drift` path through Agency Drift Replay, Proxy You, Perfect Consent, and the Exit Decision Receipt. Its local web servers use a non-secret placeholder credential because that deterministic route never calls OpenRouter.

To verify the model boundary with a small live request, first place an OpenRouter key in the ignored `.env` file, then explicitly opt in:

```bash
RUN_MODEL_SMOKE=1 npm run smoke:models
```

That smoke test parses and recommends for one routine two-decision sweep and validates both responses against the production schemas. It does not print the API key, model reasoning, or full provider response. The deterministic Demo Profile and recorded capture do not call OpenRouter, which keeps the judging path reproducible while leaving the production Decision Sweep route available for a fresh live run.

For video-specific checks and the exact capture boundary, see `docs/demo-video/task15-video-v2-qa.md` and `docs/demo-video/task15-video-v2-script.md`.
