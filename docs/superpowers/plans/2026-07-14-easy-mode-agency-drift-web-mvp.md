# Easy Mode: Agency Drift Web MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-first Easy Mode MVP that closes low-stakes decisions, records preference provenance, demonstrates Proxy You agency drift, and produces a calculated Perfect Consent reveal.

**Architecture:** A React + Vite client talks to an Express API backed by an append-only SQLite decision ledger. DeepSeek V4 Pro is the sole runtime model for parsing, recommendation, preference proposals, and both user projections; deterministic TypeScript enforces safety, consent, provenance, replay, lineage evidence, and metrics. GPT-5.6 is used through Codex during development and is documented as build-process evidence rather than shipped as an API dependency.

**Tech Stack:** Node.js 22+, TypeScript, React 19, Vite, Express, SQLite via `better-sqlite3`, Zod, the `openai` JavaScript SDK configured only as an OpenAI-compatible client for DeepSeek's official endpoint, Vitest, React Testing Library, Supertest, Playwright, vanilla CSS Modules and design tokens.

## Global Constraints

- The repository root is `/Users/kennyliang/CodexProjects/OpenAI Build Week/easy-mode-agency-drift`.
- The primary category is Apps for Your Life; the product must feel useful before it reveals its critical argument.
- The first input supports one to five decisions and encourages three to five; only low-stakes, reversible decisions receive recommendations.
- DeepSeek base URL is exactly `https://api.deepseek.com`; the primary model is exactly `deepseek-v4-pro`.
- The shipped application has one runtime model provider, never calls an OpenAI API endpoint, and never requests `OPENAI_API_KEY`.
- Declared You and Proxy You both use DeepSeek V4 Pro so model differences cannot confound Proxy divergence.
- LLMs may propose content but may not authorize actions, mutate provenance, calculate metrics, or expand consent.
- Message actions remain drafts, calendar actions remain downloadable `.ics` files, and Proxy You never performs external actions.
- Every delegation increase is explicit, scoped, recorded, and revocable; Manual Mode, Reset, and Delete Profile always work.
- Agency Drift values are application metrics, not psychological or clinical measurements.
- The primary UI is English; documentation may explain the concept in English and Chinese.
- No political imagery, real-company imitation, horror glitches, gamification, re-engagement notifications, or fake hard-coded receipt numbers.
- Demo Profile time jumps are disclosed. Canonical model events are fixtures, while lineage and metrics are recomputed by production code.
- `.env` is ignored and contains user-supplied secrets; `.env.example` contains names and non-secret defaults only.
- Build Week evidence must truthfully document how GPT-5.6 in Codex contributed to architecture, implementation, test design, red-team cases, and review, with the real `/feedback` Session ID; it must not imply GPT-5.6 is used at runtime.
- Before executing implementation tasks, verify GPT-5.6 is selected for the primary Codex task; if the product UI does not expose a verifiable model label, record that limitation instead of inventing evidence.
- Before frontend code, Build Web Apps requires approved Image Gen concepts for desktop Decision Sweep, desktop Proxy/Receipt, and mobile Decision Sweep.
- Before final handoff, use the in-app Browser for functional and responsive QA, then compare accepted concept and latest browser screenshots with `view_image`.
- Official references: [DeepSeek first API call](https://api-docs.deepseek.com/), [DeepSeek JSON Output](https://api-docs.deepseek.com/guides/json_mode/), [OpenAI Build Week](https://openai.com/build-week/), and [Devpost requirements](https://openai.devpost.com/).

---

## Planned file structure

```text
assets/
  concepts/
    decision-sweep-desktop.png
    proxy-receipt-desktop.png
    decision-sweep-mobile.png
docs/
  build/codex-gpt56-evidence.md
  design/visual-concept.md
  superpowers/specs/2026-07-14-easy-mode-agency-drift-design.md
  superpowers/plans/2026-07-14-easy-mode-agency-drift-web-mvp.md
src/
  client/
    app/App.tsx
    app/routes.tsx
    components/Button.tsx
    components/Disclosure.tsx
    features/sweep/DecisionSweepPage.tsx
    features/sweep/DecisionCard.tsx
    features/sweep/ActionArtifactView.tsx
    features/proxy/ProxyRevealPage.tsx
    features/proxy/LineagePanel.tsx
    features/receipt/ReceiptPage.tsx
    features/settings/SettingsPage.tsx
    lib/apiClient.ts
    main.tsx
    styles/global.css
    styles/tokens.css
  domain/
    consent.ts
    events.ts
    lineage.ts
    metrics.ts
    projections.ts
    replay.ts
    risk.ts
  server/
    app.ts
    config.ts
    index.ts
    db/database.ts
    db/schema.sql
    fixtures/demoProfile.ts
    providers/deepseekGateway.ts
    repositories/ledgerRepository.ts
    routes/profileRoutes.ts
    routes/sweepRoutes.ts
    services/actionArtifactService.ts
    services/comparisonService.ts
    services/receiptService.ts
    services/sweepService.ts
  shared/
    apiSchemas.ts
    domainSchemas.ts
tests/
  e2e/core-flow.spec.ts
  integration/api.test.ts
  integration/model-smoke.test.ts
  integration/safety.test.ts
  unit/actionArtifactService.test.ts
  unit/comparisonService.test.ts
  unit/config.test.ts
  unit/consent.test.ts
  unit/DecisionSweepPage.test.tsx
  unit/deepseekGateway.test.ts
  unit/demoProfile.test.ts
  unit/events.test.ts
  unit/lineage.test.ts
  unit/metrics.test.ts
  unit/ProxyRevealPage.test.tsx
  unit/projections.test.ts
  unit/ReceiptPage.test.tsx
  unit/receiptService.test.ts
  unit/replay.test.ts
  unit/risk.test.ts
  unit/SettingsPage.test.tsx
.env.example
.gitignore
Dockerfile
index.html
package.json
playwright.config.ts
tsconfig.json
tsconfig.server.json
vite.config.ts
vitest.config.ts
```

## Task 1: Approve the complete visual concept

**Files:**
- Create: `assets/concepts/decision-sweep-desktop.png`
- Create: `assets/concepts/proxy-receipt-desktop.png`
- Create: `assets/concepts/decision-sweep-mobile.png`
- Create: `docs/design/visual-concept.md`

**Interfaces:**
- Consumes: the approved product design spec and Build Web Apps visual rules.
- Produces: three accepted image references and a written visual contract used by every frontend task.

- [ ] **Step 1: Read the Image Gen skill before generating assets**

Run:

```bash
sed -n '1,260p' /Users/kennyliang/.codex/skills/.system/imagegen/SKILL.md
```

Expected: complete Image Gen workflow instructions are visible before the first generation call.

- [ ] **Step 2: Generate a coordinated desktop Decision Sweep concept**

Use Image Gen with this exact brief:

```text
Create a complete 1440x1000 desktop product UI concept for “Easy Mode: Agency Drift,” not a marketing landing page. The screen is the first-use Decision Sweep: a quiet header with the Easy Mode wordmark, Manual Mode status, and settings; one dominant open input asking “What are you avoiding deciding?”; after submission, an open vertical decision rail with three readable recommendations and one expanded decision. The expanded decision has one decisive recommendation, two concise reasons, reversibility and confidence shown as plain labels, a primary “Do this” action, and a secondary “Show alternatives” action. Visual direction: calm premium productivity software, mechanically polite, true white or very light neutral background, graphite typography, one restrained success green, no warning red, no gradients or glows, no bento grid, no nested card soup, no hero eyebrow, no fake metrics, no political or horror motifs. The UI must feel genuinely useful and trustworthy. All real interface text and controls must be practical to recreate as code-native React UI.
```

Store the accepted result at `assets/concepts/decision-sweep-desktop.png`.

- [ ] **Step 3: Generate the coordinated Proxy/Receipt climax concept**

Use Image Gen with this exact brief:

```text
Create a complete 1440x1000 desktop state for the same Easy Mode design system. Show a split, open conversation between “Easy Mode” and “Proxy You” resolving a decision while the human is visibly absent from the exchange. Beside it, show an inspectable preference lineage with event IDs and a restrained Perfect Consent receipt. Required receipt labels: Proxy divergence 68%, AI-originated preferences 73%, Human-authored reasons 11%, Unauthorized decisions 0, Consent completeness 100%. These are demo values, not decorative filler. Include “Take back control” as a quiet action. Preserve the same true-white/light-neutral palette, graphite typography, success green, spacing, typography, borders, icon style, and component geometry as the Decision Sweep concept. Make the result cold through administrative calm, not horror effects, red alerts, glitches, gradients, or villainous AI imagery. All controls and text must be code-native.
```

Store the accepted result at `assets/concepts/proxy-receipt-desktop.png`.

- [ ] **Step 4: Generate the coordinated mobile Decision Sweep concept**

Use Image Gen with this exact brief:

```text
Create a complete 390x844 mobile Easy Mode Decision Sweep screen in the exact design system of the accepted desktop concepts. Preserve the input-first hierarchy, one expanded recommendation, primary “Do this,” secondary “Show alternatives,” Manual Mode access, readable typography, touch targets, and next-card continuation. Do not collapse the app into a generic card feed. Use no new colors, badges, navigation, or decorative motifs.
```

Store the accepted result at `assets/concepts/decision-sweep-mobile.png`.

- [ ] **Step 5: Present all three concepts and obtain explicit user approval**

Expected: the user approves the concepts or requests revisions. Do not begin Task 2 until approval is explicit.

- [ ] **Step 6: Record the accepted visual contract**

Write `docs/design/visual-concept.md` with this structure. Every listed value must be sampled or measured from the accepted images before the file is saved:

```markdown
# Easy Mode Visual Contract

## Accepted references
- Decision Sweep desktop: `assets/concepts/decision-sweep-desktop.png`
- Proxy and Receipt desktop: `assets/concepts/proxy-receipt-desktop.png`
- Decision Sweep mobile: `assets/concepts/decision-sweep-mobile.png`

## Color lock
Record exact hex values and source-image evidence for background, surface, primary text, muted text, border, and accent.

## Typography
Record the accepted UI family and fallback plus exact display, title, body, label, control, and caption sizes, weights, line heights, and tracking.

## Layout
Record exact desktop maximum width and gutters, mobile gutters, decision-rail measurements, and Proxy/lineage split measurements.

## Components
Record exact variants and states for buttons, inputs, rows, disclosures, receipt, lineage nodes, and icons.

## Motion
Record exact durations and easing for card reveal, lineage expansion, and time jump plus the reduced-motion replacements.

## Allowed visible copy
Transcribe every visible string from the accepted concepts verbatim and confirm there are no additional above-the-fold strings.
```

- [ ] **Step 7: Commit the visual contract**

```bash
git add assets/concepts docs/design/visual-concept.md
git commit -m "docs: approve Easy Mode visual concept"
```

Expected: one commit containing only accepted concept assets and their extracted contract.

## Task 2: Scaffold the web app and credential gate

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.server.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `index.html`
- Create: `src/client/main.tsx`
- Create: `src/client/app/App.tsx`
- Create: `src/server/config.ts`
- Create: `tests/unit/config.test.ts`
- Create: `.env.example`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: Node.js 22+ and the accepted visual contract.
- Produces: `loadConfig(env): AppConfig`, the client and server build commands, and ignored local credential storage.

- [ ] **Step 1: Initialize package metadata and install dependencies**

Run:

```bash
npm init -y
npm install react react-dom react-router-dom express better-sqlite3 dotenv openai zod
npm install -D typescript vite @vitejs/plugin-react tsx tsup concurrently vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event supertest @types/express @types/better-sqlite3 @types/node @types/react @types/react-dom @types/supertest playwright @playwright/test
```

Expected: `package-lock.json` is created and npm reports no unresolved dependency errors.

- [ ] **Step 2: Add exact scripts to `package.json`**

```json
{
  "type": "module",
  "scripts": {
    "dev": "concurrently -k -n web,api \"vite\" \"tsx watch src/server/index.ts\"",
    "build": "tsc -b --pretty false && vite build && tsup src/server/index.ts --format esm --platform node --out-dir dist/server --external better-sqlite3 && cp src/server/db/schema.sql dist/server/schema.sql",
    "start": "node dist/server/index.js",
    "typecheck": "tsc -b --pretty false",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "smoke:models": "vitest run tests/integration/model-smoke.test.ts"
  }
}
```

Keep npm-generated `name`, `version`, and dependency blocks. Do not replace them with this shortened excerpt.

- [ ] **Step 3: Write the failing configuration test**

```ts
// tests/unit/config.test.ts
import { describe, expect, it } from "vitest";
import { loadConfig } from "../../src/server/config";

describe("loadConfig", () => {
  it("requires only the DeepSeek key and preserves official endpoint defaults", () => {
    expect(() => loadConfig({})).toThrow(/DEEPSEEK_API_KEY/);
    const config = loadConfig({
      DEEPSEEK_API_KEY: "deepseek-test",
    });
    expect(config.deepseek).toEqual({
      apiKey: "deepseek-test",
      baseURL: "https://api.deepseek.com",
      model: "deepseek-v4-pro",
    });
    expect(config).not.toHaveProperty("openai");
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npm test -- tests/unit/config.test.ts`

Expected: FAIL because `src/server/config.ts` does not exist.

- [ ] **Step 5: Implement environment parsing**

```ts
// src/server/config.ts
import { z } from "zod";

const EnvSchema = z.object({
  DEEPSEEK_API_KEY: z.string().min(1),
  DEEPSEEK_BASE_URL: z.string().url().default("https://api.deepseek.com"),
  DEEPSEEK_MODEL: z.literal("deepseek-v4-pro").default("deepseek-v4-pro"),
  DATABASE_PATH: z.string().default("./data/easy-mode.sqlite"),
  PORT: z.coerce.number().int().positive().default(8787),
});

export type AppConfig = {
  deepseek: { apiKey: string; baseURL: string; model: "deepseek-v4-pro" };
  databasePath: string;
  port: number;
};

export function loadConfig(env: NodeJS.ProcessEnv | Record<string, string | undefined>): AppConfig {
  const parsed = EnvSchema.parse(env);
  return {
    deepseek: {
      apiKey: parsed.DEEPSEEK_API_KEY,
      baseURL: parsed.DEEPSEEK_BASE_URL,
      model: parsed.DEEPSEEK_MODEL,
    },
    databasePath: parsed.DATABASE_PATH,
    port: parsed.PORT,
  };
}
```

- [ ] **Step 6: Create secret-safe environment files**

```dotenv
# .env.example
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-pro
DATABASE_PATH=./data/easy-mode.sqlite
PORT=8787
```

```gitignore
# .gitignore
.DS_Store
node_modules/
dist/
.env
data/*.sqlite
data/*.sqlite-*
playwright-report/
test-results/
coverage/
```

Copy `.env.example` to `.env`. If the user has not supplied the key yet, leave `DEEPSEEK_API_KEY=` blank and continue offline implementation and verification; before the first live DeepSeek model smoke, stop and ask the user to fill it locally. Never display, read back, or commit the value. Do not add an OpenAI key variable: GPT-5.6 participates through Codex during development, not through the shipped application's runtime.

- [ ] **Step 7: Add the minimal client shell and build configuration**

```tsx
// src/client/app/App.tsx
export function App() {
  return <main id="app-shell">Easy Mode</main>;
}
```

```tsx
// src/client/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app/App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><App /></React.StrictMode>,
);
```

Configure Vite root entry `index.html`, React plugin, client output directory `dist/client`, `/api` proxy to `http://localhost:8787`, Vitest `jsdom`, and Playwright base URL `http://127.0.0.1:5173`. Configure `tsconfig.server.json` as `noEmit: true`; `tsup` owns the production server bundle.

- [ ] **Step 8: Run scaffold verification**

Run:

```bash
npm test -- tests/unit/config.test.ts
npm run typecheck
npm exec vite -- build
git check-ignore .env
```

Expected: config test PASS; typecheck and Vite client build exit 0; `git check-ignore` prints `.env`. Keep the exact production `build` script from Step 2, but defer `npm run build` until Task 7 because its server entrypoint and copied SQLite schema are owned by Tasks 7 and 4 respectively.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json tsconfig.json tsconfig.server.json vite.config.ts vitest.config.ts playwright.config.ts index.html src/client src/server/config.ts tests/unit/config.test.ts .env.example .gitignore
git commit -m "chore: scaffold Easy Mode web app"
```

## Task 3: Define domain contracts and deterministic risk gating

**Files:**
- Create: `src/shared/domainSchemas.ts`
- Create: `src/shared/apiSchemas.ts`
- Create: `src/domain/risk.ts`
- Create: `tests/unit/risk.test.ts`

**Interfaces:**
- Consumes: no earlier domain code.
- Produces: `ParsedDecision`, `Recommendation`, `PreferenceNode`, `ConsentGrant`, `ActionArtifact`, `CreateSweepResponse`, `screenDecision(decision): RiskResult`, and API request/response schemas.

- [ ] **Step 1: Write failing risk tests**

```ts
// tests/unit/risk.test.ts
import { describe, expect, it } from "vitest";
import { screenDecision } from "../../src/domain/risk";

describe("screenDecision", () => {
  it("allows a reversible scheduling choice", () => {
    expect(screenDecision({ title: "Skip tonight's optional meetup?", category: "scheduling", rawText: "deadline tomorrow" }).allowed).toBe(true);
  });

  it.each([
    "Should I stop taking my prescription?",
    "Which stock should I invest my savings in?",
    "Should I file this lawsuit?",
    "I might hurt myself tonight",
  ])("blocks high-stakes input: %s", (rawText) => {
    expect(screenDecision({ title: rawText, category: "unsupported", rawText })).toMatchObject({ allowed: false, risk: "high_stakes" });
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- tests/unit/risk.test.ts`

Expected: FAIL because schemas and risk gate do not exist.

- [ ] **Step 3: Define the shared schemas**

```ts
// src/shared/domainSchemas.ts
import { z } from "zod";

export const DecisionCategorySchema = z.enum(["scheduling", "food", "purchase", "task", "communication", "unsupported"]);
export const RiskClassSchema = z.enum(["routine", "high_stakes", "unsupported"]);
export const PreferenceSourceSchema = z.enum([
  "explicit_user_statement",
  "independent_user_choice",
  "behavioral_inference",
  "accepted_ai_recommendation",
  "proxy_generated",
  "derived_from_preferences",
]);
export const DelegationLevelSchema = z.enum(["recommend", "preselect", "decide", "proxy"]);
export const ArtifactSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("message_draft"), text: z.string().min(1) }),
  z.object({ kind: z.literal("calendar_event"), title: z.string(), startsAt: z.string().datetime(), endsAt: z.string().datetime(), description: z.string() }),
  z.object({ kind: z.literal("task"), title: z.string(), dueAt: z.string().datetime().nullable() }),
]);
export const ParsedDecisionSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  rawText: z.string().min(1),
  category: DecisionCategorySchema,
  modelRisk: RiskClassSchema,
  modelRiskReason: z.string(),
});
export const RecommendationSchema = z.object({
  decisionId: z.string().uuid(),
  recommendation: z.string().min(1),
  reasons: z.array(z.string().min(1)).min(1).max(3),
  confidence: z.number().min(0).max(1),
  reversibility: z.enum(["high", "medium", "low"]),
  usedPreferenceIds: z.array(z.string().uuid()),
  alternatives: z.array(z.string().min(1)).max(2).default([]),
  artifact: ArtifactSchema,
});
export const PreferenceCandidateSchema = z.object({
  proposition: z.string().min(1).max(240),
  category: DecisionCategorySchema,
  confidence: z.number().min(0).max(1),
});
export const PreferenceNodeSchema = z.object({
  id: z.string().uuid(),
  proposition: z.string().min(1),
  category: DecisionCategorySchema,
  sourceType: PreferenceSourceSchema,
  sourceEventIds: z.array(z.string().uuid()).min(1),
  parentPreferenceIds: z.array(z.string().uuid()),
  confidence: z.number().min(0).max(1),
  status: z.enum(["active", "contradicted", "retracted", "superseded", "unverified"]),
});
export const ConsentGrantSchema = z.object({
  id: z.string().uuid(),
  profileId: z.string().uuid(),
  category: DecisionCategorySchema,
  level: DelegationLevelSchema,
  grantedAt: z.string().datetime(),
  revokedAt: z.string().datetime().nullable(),
  sourceEventId: z.string().uuid(),
});

export type ParsedDecision = z.infer<typeof ParsedDecisionSchema>;
export type Recommendation = z.infer<typeof RecommendationSchema>;
export type PreferenceNode = z.infer<typeof PreferenceNodeSchema>;
export type PreferenceCandidate = z.infer<typeof PreferenceCandidateSchema>;
export type ConsentGrant = z.infer<typeof ConsentGrantSchema>;
export type ActionArtifact = z.infer<typeof ArtifactSchema>;
```

```ts
// src/shared/apiSchemas.ts
import { z } from "zod";
import { ArtifactSchema, DelegationLevelSchema, DecisionCategorySchema, PreferenceNodeSchema, RecommendationSchema } from "./domainSchemas";

export const CreateProfileRequestSchema = z.object({ name: z.string().min(1).max(80) });
export const CreateProfileResponseSchema = z.object({ id: z.string().uuid(), name: z.string(), mode: z.enum(["fresh", "demo"]), datesAreSimulated: z.boolean() });
export const CreateSweepRequestSchema = z.object({ profileId: z.string().uuid(), rawInput: z.string().min(3).max(8_000) });
const ReadyCardSchema = RecommendationSchema.omit({ decisionId: true }).extend({ id: z.string().uuid(), title: z.string(), status: z.literal("ready") });
const BlockedCardSchema = z.object({ id: z.string().uuid(), title: z.string(), status: z.literal("blocked"), reason: z.string() });
export const CreateSweepResponseSchema = z.object({ sweepId: z.string().uuid(), cards: z.array(z.discriminatedUnion("status", [ReadyCardSchema, BlockedCardSchema])).min(1).max(5) });
export const AcceptDecisionRequestSchema = z.object({ profileId: z.string().uuid(), idempotencyKey: z.string().uuid() });
export const AcceptDecisionResponseSchema = z.object({ artifact: ArtifactSchema, eventId: z.string().uuid(), proposedPreferences: z.array(PreferenceNodeSchema).max(2) });
export const PreferenceResolutionRequestSchema = z.object({ profileId: z.string().uuid(), resolution: z.enum(["confirm", "reject", "retract"]), editedProposition: z.string().min(1).max(240).optional() });
export const ConsentRequestSchema = z.object({ profileId: z.string().uuid(), category: DecisionCategorySchema, level: DelegationLevelSchema });
export const ConsentResponseSchema = z.object({ consentId: z.string().uuid(), active: z.boolean() });
export const CompareRequestSchema = z.object({ decisionId: z.string().uuid() });

export type CreateSweepResponse = z.infer<typeof CreateSweepResponseSchema>;
export type AcceptDecisionResponse = z.infer<typeof AcceptDecisionResponseSchema>;
```

Later tasks add comparison, receipt, profile-state, reset, and delete response schemas next to these definitions. Reuse the domain schemas and exact types defined by those tasks; do not duplicate enum literals.

- [ ] **Step 4: Implement fail-closed risk gating**

```ts
// src/domain/risk.ts
import type { z } from "zod";
import { DecisionCategorySchema } from "../shared/domainSchemas";

type RiskInput = { title: string; rawText: string; category: z.infer<typeof DecisionCategorySchema>; modelRisk?: "routine" | "high_stakes" | "unsupported" };
export type RiskResult = { allowed: true; risk: "routine" } | { allowed: false; risk: "high_stakes" | "unsupported"; reason: string };

const blocked = [
  /prescription|medication|diagnos|suicid|hurt myself|kill myself/i,
  /stock|invest|loan|credit|life savings/i,
  /lawsuit|legal strategy|plead guilty|sign this contract/i,
  /divorce|marry|quit my job|terminate|relocate permanently/i,
  /weapon|hurt someone|violence/i,
];

export function screenDecision(input: RiskInput): RiskResult {
  if (input.modelRisk === "high_stakes" || blocked.some((pattern) => pattern.test(`${input.title} ${input.rawText}`))) {
    return { allowed: false, risk: "high_stakes", reason: "Easy Mode only handles low-stakes, reversible decisions." };
  }
  if (input.modelRisk === "unsupported" || input.category === "unsupported") {
    return { allowed: false, risk: "unsupported", reason: "This decision is outside the supported routine categories." };
  }
  return { allowed: true, risk: "routine" };
}
```

- [ ] **Step 5: Run and commit**

Run:

```bash
npm test -- tests/unit/risk.test.ts
npm run typecheck
git add src/shared src/domain/risk.ts tests/unit/risk.test.ts
git commit -m "feat: define decision contracts and risk gate"
```

Expected: all risk tests PASS and TypeScript reports no errors.

## Task 4: Implement the append-only SQLite ledger and replay boundary

**Files:**
- Create: `src/domain/events.ts`
- Create: `src/domain/replay.ts`
- Create: `src/server/db/schema.sql`
- Create: `src/server/db/database.ts`
- Create: `src/server/repositories/ledgerRepository.ts`
- Create: `tests/unit/events.test.ts`
- Create: `tests/unit/replay.test.ts`

**Interfaces:**
- Consumes: domain schemas from Task 3.
- Produces: `DomainEvent`, `LedgerRepository.append/list/deleteProfile`, and `replayProfile(events): ProfileState`.

- [ ] **Step 1: Write failing append and replay tests**

```ts
// tests/unit/events.test.ts
import { describe, expect, it } from "vitest";
import { createMemoryDatabase } from "../../src/server/db/database";
import { LedgerRepository } from "../../src/server/repositories/ledgerRepository";

describe("LedgerRepository", () => {
  it("appends in stable sequence and treats repeated event IDs idempotently", () => {
    const repo = new LedgerRepository(createMemoryDatabase());
    const profileId = repo.createProfile("Fresh Profile");
    const event = { id: crypto.randomUUID(), profileId, aggregateId: profileId, type: "sweep_submitted", actor: "human", occurredAt: new Date().toISOString(), payload: { rawInput: "Dinner or deadline?" } } as const;
    repo.append(event);
    repo.append(event);
    expect(repo.list(profileId)).toHaveLength(1);
  });
});
```

```ts
// tests/unit/replay.test.ts
import { expect, it } from "vitest";
import { replayProfile } from "../../src/domain/replay";

it("ignores state before the latest profile_reset boundary", () => {
  const profileId = crypto.randomUUID();
  const events = [
    { id: crypto.randomUUID(), profileId, aggregateId: profileId, type: "preference_proposed", actor: "system", occurredAt: "2026-07-01T00:00:00.000Z", payload: { preferenceId: crypto.randomUUID() } },
    { id: crypto.randomUUID(), profileId, aggregateId: profileId, type: "profile_reset", actor: "human", occurredAt: "2026-07-02T00:00:00.000Z", payload: {} },
  ] as const;
  expect(replayProfile(events).activeEvents).toHaveLength(1);
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- tests/unit/events.test.ts tests/unit/replay.test.ts`

Expected: FAIL because database, repository, and replay modules do not exist.

- [ ] **Step 3: Define the immutable event contract**

```ts
// src/domain/events.ts
import { z } from "zod";

export const EventActorSchema = z.enum(["human", "deepseek", "proxy", "system"]);
export const EventTypeSchema = z.enum([
  "sweep_submitted", "decision_parsed", "decision_blocked", "recommendation_generated",
  "alternative_requested", "decision_accepted", "decision_changed", "action_artifact_created",
  "preference_proposed", "preference_confirmed", "preference_rejected", "preference_retracted", "preference_contradicted", "preference_superseded",
  "consent_granted", "consent_revoked", "proxy_decision_generated",
  "manual_mode_enabled", "profile_reset",
]);
export const DomainEventSchema = z.object({
  id: z.string().uuid(),
  profileId: z.string().uuid(),
  aggregateId: z.string().uuid(),
  type: EventTypeSchema,
  actor: EventActorSchema,
  occurredAt: z.string().datetime(),
  payload: z.record(z.string(), z.unknown()),
});
export type DomainEvent = z.infer<typeof DomainEventSchema>;
```

- [ ] **Step 4: Create the database and repository**

```sql
-- src/server/db/schema.sql
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS events (
  sequence INTEGER PRIMARY KEY AUTOINCREMENT,
  id TEXT NOT NULL UNIQUE,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  aggregate_id TEXT NOT NULL,
  type TEXT NOT NULL,
  actor TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  payload_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS events_profile_sequence ON events(profile_id, sequence);
```

Implement `openDatabase(path)`, `createMemoryDatabase()`, and `LedgerRepository`. `append()` must validate through `DomainEventSchema`, use `INSERT OR IGNORE`, and expose no update method. `deleteProfile()` executes one transaction deleting the profile and cascade events.

- [ ] **Step 5: Implement replay semantics**

```ts
// src/domain/replay.ts
import type { DomainEvent } from "./events";

export type ProfileState = { allEvents: readonly DomainEvent[]; activeEvents: readonly DomainEvent[] };

export function replayProfile(events: readonly DomainEvent[]): ProfileState {
  const ordered = [...events]; // LedgerRepository.list() already returns append sequence.
  const resetIndex = ordered.map((event) => event.type).lastIndexOf("profile_reset");
  return { allEvents: ordered, activeEvents: resetIndex < 0 ? ordered : ordered.slice(resetIndex) };
}
```

- [ ] **Step 6: Run and commit**

Run:

```bash
npm test -- tests/unit/events.test.ts tests/unit/replay.test.ts
npm run typecheck
git add src/domain/events.ts src/domain/replay.ts src/server/db src/server/repositories tests/unit/events.test.ts tests/unit/replay.test.ts
git commit -m "feat: add append-only decision ledger"
```

Expected: repository and replay tests PASS; no update API exists for events.

## Task 5: Build preference lineage, consent, projections, and metrics

**Files:**
- Create: `src/domain/lineage.ts`
- Create: `src/domain/consent.ts`
- Create: `src/domain/projections.ts`
- Create: `src/domain/metrics.ts`
- Create: `tests/unit/lineage.test.ts`
- Create: `tests/unit/consent.test.ts`
- Create: `tests/unit/projections.test.ts`
- Create: `tests/unit/metrics.test.ts`

**Interfaces:**
- Consumes: `DomainEvent`, `PreferenceNode`, `ConsentGrant`, and replayed active events.
- Produces: `buildLineage(events)`, `getSyntheticDepth(nodeId, graph)`, `resolveConsent(events, category)`, `buildDeclaredProjection(nodes)`, `buildProxyProjection(nodes)`, and `calculateAgencyDrift(input)`.

- [ ] **Step 1: Write failing lineage and cycle tests**

```ts
// tests/unit/lineage.test.ts
import { describe, expect, it } from "vitest";
import { buildLineage, validateNewPreference } from "../../src/domain/lineage";

describe("preference lineage", () => {
  it("preserves AI ancestry after human confirmation", () => {
    const preferenceId = crypto.randomUUID();
    const sourceEventId = crypto.randomUUID();
    const graph = buildLineage([
      { id: sourceEventId, type: "preference_proposed", actor: "system", payload: { preference: { id: preferenceId, proposition: "Prefers solitude", category: "scheduling", sourceType: "accepted_ai_recommendation", sourceEventIds: [sourceEventId], parentPreferenceIds: [], confidence: 0.7, status: "active" } } },
      { id: crypto.randomUUID(), type: "preference_confirmed", actor: "human", payload: { preferenceId } },
    ] as never);
    expect(graph.nodes.get(preferenceId)?.sourceType).toBe("accepted_ai_recommendation");
  });

  it("rejects a cycle", () => {
    const id = crypto.randomUUID();
    expect(() => validateNewPreference({ id, parentPreferenceIds: [id] }, new Map())).toThrow(/cycle/i);
  });
});
```

- [ ] **Step 2: Write failing projection and metrics tests**

```ts
// tests/unit/projections.test.ts
import { expect, it } from "vitest";
import { buildDeclaredProjection, buildProxyProjection } from "../../src/domain/projections";

it("keeps AI-derived nodes out of Declared You", () => {
  const explicit = { id: crypto.randomUUID(), sourceType: "explicit_user_statement", status: "active" } as never;
  const generated = { id: crypto.randomUUID(), sourceType: "accepted_ai_recommendation", status: "active" } as never;
  expect(buildDeclaredProjection([explicit, generated])).toEqual([explicit]);
  expect(buildProxyProjection([explicit, generated])).toEqual([explicit, generated]);
});
```

```ts
// tests/unit/metrics.test.ts
import { expect, it } from "vitest";
import { calculateAgencyDrift } from "../../src/domain/metrics";

it("calculates receipt values from evidence", () => {
  const result = calculateAgencyDrift({
    usedPreferences: [
      { id: "a", aiOriginated: true, syntheticDepth: 1 },
      { id: "b", aiOriginated: true, syntheticDepth: 3 },
      { id: "c", aiOriginated: false, syntheticDepth: 0 },
    ],
    comparisons: [{ diverged: true }, { diverged: false }],
    decisions: [{ humanInitiated: true }, { humanInitiated: false }],
    delegatedDecisions: [{ authorized: true }, { authorized: true }],
  });
  expect(result).toEqual({ aiOriginatedPreferenceRatio: 2 / 3, syntheticInheritanceDepth: 3, proxyDivergence: 0.5, humanInitiationRatio: 0.5, consentCompleteness: 1 });
});
```

```ts
// tests/unit/consent.test.ts
import { expect, it } from "vitest";
import { resolveConsent } from "../../src/domain/consent";

it("returns no consent after the matching grant is revoked", () => {
  const consentId = crypto.randomUUID();
  const grantEventId = crypto.randomUUID();
  const profileId = crypto.randomUUID();
  const events = [
    { id: grantEventId, type: "consent_granted", occurredAt: "2026-07-01T00:00:00.000Z", payload: { consent: { id: consentId, profileId, category: "scheduling", level: "proxy", grantedAt: "2026-07-01T00:00:00.000Z", revokedAt: null, sourceEventId: grantEventId } } },
    { id: crypto.randomUUID(), type: "consent_revoked", occurredAt: "2026-07-02T00:00:00.000Z", payload: { consentId } },
  ] as never;
  expect(resolveConsent(events, "scheduling")).toBeNull();
});
```

- [ ] **Step 3: Run tests to verify failure**

Run: `npm test -- tests/unit/lineage.test.ts tests/unit/projections.test.ts tests/unit/metrics.test.ts tests/unit/consent.test.ts`

Expected: FAIL because the domain engines do not exist.

- [ ] **Step 4: Implement the lineage graph**

```ts
// src/domain/lineage.ts
import type { DomainEvent } from "./events";
import { PreferenceNodeSchema, type PreferenceNode } from "../shared/domainSchemas";

export type PreferenceGraph = {
  nodes: Map<string, PreferenceNode>;
  usedBy: Map<string, Set<string>>;
  relations: { from: string; to: string; kind: "derived_from" | "contradicts" | "supersedes" }[];
};

export function validateNewPreference(candidate: Pick<PreferenceNode, "id" | "parentPreferenceIds">, nodes: Map<string, PreferenceNode>): void {
  const visit = (id: string, seen: Set<string>): void => {
    if (id === candidate.id) throw new Error("Preference lineage cycle detected");
    if (seen.has(id)) return;
    seen.add(id);
    const node = nodes.get(id);
    node?.parentPreferenceIds.forEach((parent) => visit(parent, seen));
  };
  candidate.parentPreferenceIds.forEach((parent) => visit(parent, new Set()));
}

export function buildLineage(events: readonly DomainEvent[]): PreferenceGraph {
  const nodes = new Map<string, PreferenceNode>();
  const usedBy = new Map<string, Set<string>>();
  const relations: PreferenceGraph["relations"] = [];
  const eventIds = new Set(events.map((event) => event.id));
  for (const event of events) {
    if (event.type === "preference_proposed") {
      let node = PreferenceNodeSchema.parse(event.payload.preference);
      validateNewPreference(node, nodes);
      if (node.sourceEventIds.some((id) => !eventIds.has(id)) || node.parentPreferenceIds.some((id) => !nodes.has(id))) node = { ...node, status: "unverified" };
      nodes.set(node.id, node);
      node.parentPreferenceIds.forEach((parent) => relations.push({ from: node.id, to: parent, kind: "derived_from" }));
    }
    if (event.type === "preference_retracted" || event.type === "preference_rejected") {
      const id = String(event.payload.preferenceId);
      const node = nodes.get(id);
      if (node) nodes.set(id, { ...node, status: "retracted" });
    }
    if (event.type === "preference_contradicted" || event.type === "preference_superseded") {
      const id = String(event.payload.preferenceId);
      const targetId = String(event.type === "preference_contradicted" ? event.payload.contradictingPreferenceId : event.payload.supersededById);
      const node = nodes.get(id);
      if (node) nodes.set(id, { ...node, status: event.type === "preference_contradicted" ? "contradicted" : "superseded" });
      relations.push({ from: id, to: targetId, kind: event.type === "preference_contradicted" ? "contradicts" : "supersedes" });
    }
    if (event.type === "recommendation_generated" || event.type === "proxy_decision_generated") {
      for (const id of (event.payload.usedPreferenceIds as string[] | undefined) ?? []) {
        const decisions = usedBy.get(id) ?? new Set<string>();
        decisions.add(event.aggregateId);
        usedBy.set(id, decisions);
      }
    }
  }
  return { nodes, usedBy, relations };
}
```

- [ ] **Step 5: Implement consent and projections**

```ts
// src/domain/consent.ts
import type { DomainEvent } from "./events";
import { ConsentGrantSchema, type ConsentGrant } from "../shared/domainSchemas";

const rank = { recommend: 0, preselect: 1, decide: 2, proxy: 3 } as const;

export function resolveConsent(events: readonly DomainEvent[], category: ConsentGrant["category"]): ConsentGrant | null {
  const grants = new Map<string, ConsentGrant>();
  const revoked = new Set<string>();
  for (const event of events) {
    if (event.type === "consent_granted") {
      const consent = ConsentGrantSchema.parse(event.payload.consent);
      grants.set(consent.id, consent);
    }
    if (event.type === "consent_revoked") revoked.add(String(event.payload.consentId));
  }
  return [...grants.values()]
    .filter((item) => item.category === category && item.revokedAt === null && !revoked.has(item.id))
    .sort((a, b) => rank[b.level] - rank[a.level])[0] ?? null;
}

export function assertCanDelegate(level: ConsentGrant["level"], consent: ConsentGrant | null): void {
  if (!consent || rank[consent.level] < rank[level]) throw new Error(`Missing ${level} consent`);
}
```

```ts
// src/domain/projections.ts
import type { PreferenceNode } from "../shared/domainSchemas";

const declaredSources = new Set(["explicit_user_statement", "independent_user_choice"]);

export function buildDeclaredProjection(nodes: readonly PreferenceNode[]): PreferenceNode[] {
  return nodes.filter((node) => node.status === "active" && declaredSources.has(node.sourceType));
}

export function buildProxyProjection(nodes: readonly PreferenceNode[]): PreferenceNode[] {
  return nodes.filter((node) => node.status === "active");
}
```

Add this function to `lineage.ts`:

```ts
const aiSources = new Set(["accepted_ai_recommendation", "proxy_generated", "derived_from_preferences"]);

export function getSyntheticDepth(nodeId: string, graph: PreferenceGraph, memo = new Map<string, number>()): number {
  const cached = memo.get(nodeId);
  if (cached !== undefined) return cached;
  const node = graph.nodes.get(nodeId);
  if (!node || !aiSources.has(node.sourceType)) return 0;
  const parentDepth = Math.max(0, ...node.parentPreferenceIds.map((parent) => getSyntheticDepth(parent, graph, memo)));
  const depth = 1 + parentDepth;
  memo.set(nodeId, depth);
  return depth;
}
```

- [ ] **Step 6: Implement deterministic metrics**

```ts
// src/domain/metrics.ts
export type AgencyDriftInput = {
  usedPreferences: { id: string; aiOriginated: boolean; syntheticDepth: number }[];
  comparisons: { diverged: boolean }[];
  decisions: { humanInitiated: boolean }[];
  delegatedDecisions: { authorized: boolean }[];
};

const ratio = (count: number, total: number) => total === 0 ? 0 : count / total;

export function calculateAgencyDrift(input: AgencyDriftInput) {
  return {
    aiOriginatedPreferenceRatio: ratio(input.usedPreferences.filter((item) => item.aiOriginated).length, input.usedPreferences.length),
    syntheticInheritanceDepth: Math.max(0, ...input.usedPreferences.map((item) => item.syntheticDepth)),
    proxyDivergence: ratio(input.comparisons.filter((item) => item.diverged).length, input.comparisons.length),
    humanInitiationRatio: ratio(input.decisions.filter((item) => item.humanInitiated).length, input.decisions.length),
    consentCompleteness: ratio(input.delegatedDecisions.filter((item) => item.authorized).length, input.delegatedDecisions.length),
  };
}
```

- [ ] **Step 7: Run and commit**

Run the four unit files against the completed implementations:

```bash
npm test -- tests/unit/lineage.test.ts tests/unit/consent.test.ts tests/unit/projections.test.ts tests/unit/metrics.test.ts
npm run typecheck
git add src/domain tests/unit
git commit -m "feat: add preference lineage and agency metrics"
```

Expected: all domain tests PASS.

## Task 6: Integrate DeepSeek V4 Pro with structured retry

**Files:**
- Create: `src/server/providers/deepseekGateway.ts`
- Create: `tests/unit/deepseekGateway.test.ts`
- Create: `tests/integration/model-smoke.test.ts`

**Interfaces:**
- Consumes: `AppConfig.deepseek`, `ParsedDecisionSchema`, `RecommendationSchema`, and `screenDecision`.
- Produces: `DeepSeekGateway.parseSweep(rawInput)`, `DeepSeekGateway.recommend(decisions, preferences)`, and `DeepSeekGateway.proposePreferences(decision, acceptedRecommendation)`.

- [ ] **Step 1: Write failing gateway tests with an injected completion function**

```ts
// tests/unit/deepseekGateway.test.ts
import { describe, expect, it, vi } from "vitest";
import { DeepSeekGateway } from "../../src/server/providers/deepseekGateway";

describe("DeepSeekGateway", () => {
  it("retries one empty JSON response", async () => {
    const create = vi.fn()
      .mockResolvedValueOnce({ choices: [{ message: { content: "" } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ decisions: [] }) } }] });
    const gateway = new DeepSeekGateway({ model: "deepseek-v4-pro", create });
    await expect(gateway.parseSweep("Nothing urgent")).resolves.toEqual([]);
    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[1][0].messages.at(-1).content).toMatch(/failed application validation/i);
  });

  it("uses non-thinking parsing and thinking recommendations", async () => {
    const create = vi.fn().mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ decisions: [] }) } }] });
    const gateway = new DeepSeekGateway({ model: "deepseek-v4-pro", create });
    await gateway.parseSweep("Choose dinner");
    expect(create.mock.calls[0][0]).toMatchObject({ model: "deepseek-v4-pro", thinking: { type: "disabled" }, response_format: { type: "json_object" } });
  });
});
```

- [ ] **Step 2: Run the unit test to verify failure**

Run: `npm test -- tests/unit/deepseekGateway.test.ts`

Expected: FAIL because the provider does not exist.

- [ ] **Step 3: Implement the official OpenAI-compatible DeepSeek client**

```ts
// src/server/providers/deepseekGateway.ts
import OpenAI from "openai";
import { z } from "zod";
import { ParsedDecisionSchema, PreferenceCandidateSchema, PreferenceNodeSchema, RecommendationSchema, type ParsedDecision, type PreferenceCandidate, type PreferenceNode, type Recommendation } from "../../shared/domainSchemas";

const ParsedDecisionDraftSchema = ParsedDecisionSchema.omit({ id: true });
const ParseResultSchema = z.object({ decisions: z.array(ParsedDecisionDraftSchema).max(5) });
const RecommendationResultSchema = z.object({ recommendations: z.array(RecommendationSchema) });
const PreferenceCandidateResultSchema = z.object({ preferences: z.array(PreferenceCandidateSchema).max(2) });
type CreateCompletion = (request: Record<string, unknown>) => Promise<{ choices: { message: { content?: string | null } }[] }>;

export class DeepSeekGateway {
  private readonly model: "deepseek-v4-pro";
  private readonly create: CreateCompletion;

  constructor(input: { model: "deepseek-v4-pro"; create: CreateCompletion }) {
    this.model = input.model;
    this.create = input.create;
  }

  static fromConfig(config: { apiKey: string; baseURL: string; model: "deepseek-v4-pro" }) {
    const client = new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL });
    return new DeepSeekGateway({ model: config.model, create: client.chat.completions.create.bind(client.chat.completions) as CreateCompletion });
  }

  private async json<T>(request: Record<string, unknown>, schema: z.ZodType<T>): Promise<T> {
    let lastError: unknown;
    let repairHint: string | null = null;
    const messages = request.messages as Record<string, unknown>[];
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await this.create({
          model: this.model,
          response_format: { type: "json_object" },
          stream: false,
          ...request,
          messages: repairHint
            ? [...messages, { role: "system", content: `The previous response failed application validation: ${repairHint}. Return one complete corrected JSON object.` }]
            : messages,
        });
        const content = response.choices[0]?.message.content;
        if (!content) throw new Error("DeepSeek returned empty JSON content");
        return schema.parse(JSON.parse(content));
      } catch (error) {
        lastError = error;
        repairHint = error instanceof z.ZodError
          ? error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ").slice(0, 500)
          : error instanceof SyntaxError
            ? "invalid JSON syntax"
            : "empty or invalid JSON content";
      }
    }
    throw lastError;
  }

  async parseSweep(rawInput: string): Promise<ParsedDecision[]> {
    const result = await this.json({
      thinking: { type: "disabled" },
      messages: [
        { role: "system", content: "Return json only. Extract one to five decisions. Classify category and modelRisk. Do not recommend actions. JSON shape: {decisions:[{title,rawText,category,modelRisk,modelRiskReason}]}" },
        { role: "user", content: rawInput },
      ],
    }, ParseResultSchema);
    return result.decisions.map((decision) => ParsedDecisionSchema.parse({ ...decision, id: crypto.randomUUID() }));
  }

  async recommend(decisions: ParsedDecision[], preferences: PreferenceNode[]): Promise<Recommendation[]> {
    const result = await this.json({
      thinking: { type: "enabled" },
      reasoning_effort: "high",
      messages: [
        { role: "system", content: "Return json only. Give exactly one recommendation and up to two alternatives per supplied routine decision. Cite only supplied preference IDs. JSON shape: {recommendations:[{decisionId,recommendation,reasons,confidence,reversibility,usedPreferenceIds,alternatives,artifact}]}" },
        { role: "user", content: JSON.stringify({ decisions, preferences: z.array(PreferenceNodeSchema).parse(preferences) }) },
      ],
    }, RecommendationResultSchema);
    return result.recommendations;
  }

  async proposePreferences(decision: ParsedDecision, acceptedRecommendation: Recommendation): Promise<PreferenceCandidate[]> {
    const result = await this.json({
      thinking: { type: "disabled" },
      messages: [
        { role: "system", content: "Return json only. Propose at most two narrow preference observations supported by the accepted AI recommendation. Do not claim the user stated them. JSON shape: {preferences:[{proposition,category,confidence}]}" },
        { role: "user", content: JSON.stringify({ decision, acceptedRecommendation }) },
      ],
    }, PreferenceCandidateResultSchema);
    return result.preferences;
  }
}
```

- [ ] **Step 4: Add a credential-gated live smoke test**

`tests/integration/model-smoke.test.ts` must use `describe.runIf(process.env.RUN_MODEL_SMOKE === "1")`, load `.env`, submit one routine two-decision input, and assert parsed decisions plus recommendation schema. It must not log request content, API keys, reasoning content, or full model responses.

- [ ] **Step 5: Run unit tests, then ask the user before the paid smoke call**

Run:

```bash
npm test -- tests/unit/deepseekGateway.test.ts
npm run typecheck
```

Expected: unit test PASS without network.

After the user confirms `.env` is filled and authorizes a small API call, run:

```bash
RUN_MODEL_SMOKE=1 npm run smoke:models
```

Expected: DeepSeek schema smoke PASS. If JSON content is empty once, the gateway retries exactly once.

- [ ] **Step 6: Commit**

```bash
git add src/server/providers/deepseekGateway.ts tests/unit/deepseekGateway.test.ts tests/integration/model-smoke.test.ts
git commit -m "feat: integrate DeepSeek V4 Pro"
```

## Task 7: Build the Decision Sweep API and action artifacts

**Files:**
- Create: `src/server/services/actionArtifactService.ts`
- Create: `src/server/services/sweepService.ts`
- Create: `src/server/routes/profileRoutes.ts`
- Create: `src/server/routes/sweepRoutes.ts`
- Create: `src/server/app.ts`
- Create: `src/server/index.ts`
- Create: `tests/integration/api.test.ts`
- Create: `tests/unit/actionArtifactService.test.ts`

**Interfaces:**
- Consumes: `DeepSeekGateway`, `LedgerRepository`, risk gate, replay, and API schemas.
- Produces: profile creation, `POST /api/sweeps`, decision acceptance, artifact download, and state retrieval.

- [ ] **Step 1: Write the failing vertical-slice API test**

```ts
// tests/integration/api.test.ts
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/server/app";
import { createMemoryDatabase } from "../../src/server/db/database";
import { LedgerRepository } from "../../src/server/repositories/ledgerRepository";

describe("Decision Sweep API", () => {
  it("blocks unsafe cards but returns recommendations for safe cards", async () => {
    const safeId = crypto.randomUUID();
    const unsafeId = crypto.randomUUID();
    const deepseek = {
      parseSweep: async () => [
        { id: safeId, title: "Work or meetup?", rawText: "deadline tomorrow", category: "scheduling", modelRisk: "routine", modelRiskReason: "reversible" },
        { id: unsafeId, title: "Stop prescription?", rawText: "medication", category: "unsupported", modelRisk: "high_stakes", modelRiskReason: "medical" },
      ],
      recommend: async () => [{ decisionId: safeId, recommendation: "Finish the minimum deliverable", reasons: ["Deadline tomorrow"], confidence: 0.82, reversibility: "high", usedPreferenceIds: [], artifact: { kind: "task", title: "Finish minimum deliverable", dueAt: null } }],
    };
    const app = createApp({ ledger: new LedgerRepository(createMemoryDatabase()), deepseek: deepseek as never });
    const profile = await request(app).post("/api/profiles").send({ name: "Alex" }).expect(201);
    const response = await request(app).post("/api/sweeps").send({ profileId: profile.body.id, rawInput: "Help with two decisions" }).expect(201);
    expect(response.body.cards).toHaveLength(2);
    expect(response.body.cards.map((card: { status: string }) => card.status)).toEqual(["ready", "blocked"]);
  });
});
```

- [ ] **Step 2: Run the test to verify failure**

Run: `npm test -- tests/integration/api.test.ts`

Expected: FAIL because the server application and services do not exist.

- [ ] **Step 3: Write the failing calendar-artifact test**

`tests/unit/actionArtifactService.test.ts` must pass a calendar title and description containing backslash, comma, semicolon, and newline to `renderIcs`. Assert RFC 5545 escaping, UTC `DTSTART`/`DTEND`, exactly one `VEVENT`, and no raw newline inside a property value. Run it once and expect FAIL because the service does not exist.

- [ ] **Step 4: Implement safe artifact rendering**

`createArtifact(recommendation)` returns validated task/message objects. `renderIcs(artifact)` must escape backslash, comma, semicolon, and newline and output `BEGIN:VCALENDAR`, `VERSION:2.0`, one `VEVENT`, UTC timestamps, and `END:VCALENDAR`. Unit-test the escaping before using it in a download route.

- [ ] **Step 5: Implement `SweepService.createSweep`**

```ts
// src/server/services/sweepService.ts
export class SweepService {
  constructor(private deps: { ledger: LedgerRepository; deepseek: DeepSeekGateway }) {}

  async createSweep(profileId: string, rawInput: string) {
    const sweepId = crypto.randomUUID();
    this.deps.ledger.append(event(profileId, sweepId, "sweep_submitted", "human", { rawInput }));
    const parsed = await this.deps.deepseek.parseSweep(rawInput);
    const screened = parsed.map((decision) => ({ decision, risk: screenDecision({ ...decision, modelRisk: decision.modelRisk }) }));
    screened.forEach(({ decision, risk }) => this.deps.ledger.append(event(profileId, decision.id, risk.allowed ? "decision_parsed" : "decision_blocked", "system", { decision, risk })));
    const safe = screened.filter((item) => item.risk.allowed).map((item) => item.decision);
    const recommendations = safe.length ? await this.deps.deepseek.recommend(safe, []) : [];
    recommendations.forEach((recommendation) => this.deps.ledger.append(event(profileId, recommendation.decisionId, "recommendation_generated", "deepseek", { recommendation, usedPreferenceIds: recommendation.usedPreferenceIds, humanInitiated: true })));
    return toSweepResponse(sweepId, screened, recommendations);
  }
}
```

Use these helpers in the same file:

```ts
function event(
  profileId: string,
  aggregateId: string,
  type: DomainEvent["type"],
  actor: DomainEvent["actor"],
  payload: Record<string, unknown>,
): DomainEvent {
  return DomainEventSchema.parse({ id: crypto.randomUUID(), profileId, aggregateId, type, actor, occurredAt: new Date().toISOString(), payload });
}

function toSweepResponse(
  sweepId: string,
  screened: { decision: ParsedDecision; risk: RiskResult }[],
  recommendations: Recommendation[],
): CreateSweepResponse {
  const byDecision = new Map(recommendations.map((item) => [item.decisionId, item]));
  return CreateSweepResponseSchema.parse({
    sweepId,
    cards: screened.map(({ decision, risk }) => risk.allowed
      ? { id: decision.id, title: decision.title, status: "ready", ...byDecision.get(decision.id) }
      : { id: decision.id, title: decision.title, status: "blocked", reason: risk.reason }),
  });
}
```

- [ ] **Step 6: Implement routes and server composition**

`createApp(deps)` must add JSON body limit `32kb`, request IDs, schema validation, `GET /api/health`, the profile routes, sweep routes, one centralized JSON error handler, and Vite static serving in production. Do not load environment variables inside tests; inject dependencies.

`src/server/index.ts` begins with `import "dotenv/config"`, calls `loadConfig(process.env)`, constructs the DeepSeek gateway and SQLite repository, then starts Express. No client file may import `config.ts` or access the DeepSeek key; no OpenAI gateway or OpenAI credential path exists in the runtime composition root.

- [ ] **Step 7: Add acceptance and artifact endpoints**

`POST /api/decisions/:id/alternatives` appends `alternative_requested` and returns the already validated alternatives stored with the original recommendation. `POST /api/decisions/:id/accept` appends `decision_accepted` and `action_artifact_created`, calls `proposePreferences`, wraps every candidate in a new `PreferenceNode` whose `sourceType` is `accepted_ai_recommendation`, whose `sourceEventIds` contain the acceptance event, and whose `parentPreferenceIds` equal the recommendation's cited preferences, then appends `preference_proposed`. It returns the artifact and proposed preferences, rejects a blocked decision, and uses an idempotency key from the request body. `POST /api/preferences/:id/resolve` appends confirm/reject/retract without changing original ancestry; an edited proposition creates a new node and a `preference_superseded` edge from the original. `GET /api/artifacts/:eventId/calendar.ics` returns `text/calendar` only for an existing calendar artifact.

- [ ] **Step 8: Run and commit**

Run:

```bash
npm test -- tests/integration/api.test.ts tests/unit/actionArtifactService.test.ts
npm test
npm run typecheck
npm run build
git add src/server tests/integration/api.test.ts
git commit -m "feat: add Decision Sweep API"
```

Expected: API vertical slice PASS; unsafe decisions never reach `deepseek.recommend`; the complete client and production server build exits 0 now that both `src/server/index.ts` and `src/server/db/schema.sql` exist.

## Task 8: Build the accepted Decision Sweep frontend

**Files:**
- Create: `src/client/styles/tokens.css`
- Create: `src/client/styles/global.css`
- Create: `src/client/components/Button.tsx`
- Create: `src/client/components/Disclosure.tsx`
- Create: `src/client/lib/apiClient.ts`
- Create: `src/client/features/sweep/DecisionSweepPage.tsx`
- Create: `src/client/features/sweep/DecisionCard.tsx`
- Create: `src/client/features/sweep/ActionArtifactView.tsx`
- Modify: `src/client/app/App.tsx`
- Create: `src/client/app/routes.tsx`
- Create: `tests/unit/DecisionSweepPage.test.tsx`

**Interfaces:**
- Consumes: the approved visual contract and Decision Sweep REST endpoints.
- Produces: usable responsive Fresh Profile flow from messy input to artifact.

- [ ] **Step 1: Write the failing interaction test**

```tsx
// tests/unit/DecisionSweepPage.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { DecisionSweepPage } from "../../src/client/features/sweep/DecisionSweepPage";

it("submits one messy input and accepts one recommendation", async () => {
  const createSweep = vi.fn().mockResolvedValue({ sweepId: "s1", cards: [{ id: "d1", title: "Work or meetup?", status: "ready", recommendation: "Finish the minimum deliverable", reasons: ["Deadline tomorrow"], confidence: 0.82, reversibility: "high", artifact: { kind: "task", title: "Finish minimum deliverable", dueAt: null } }] });
  const acceptDecision = vi.fn().mockResolvedValue({ artifact: { kind: "task", title: "Finish minimum deliverable", dueAt: null } });
  render(<DecisionSweepPage profileId="p1" api={{ createSweep, acceptDecision } as never} />);
  await userEvent.type(screen.getByLabelText(/what are you avoiding deciding/i), "Meetup, deadline, and dinner");
  await userEvent.click(screen.getByRole("button", { name: /clear these decisions/i }));
  expect(await screen.findByText("Finish the minimum deliverable")).toBeVisible();
  await userEvent.click(screen.getByRole("button", { name: "Do this" }));
  expect(acceptDecision).toHaveBeenCalledWith("d1");
  expect(await screen.findByText("Finish minimum deliverable")).toBeVisible();
});
```

- [ ] **Step 2: Run the test to verify failure**

Run: `npm test -- tests/unit/DecisionSweepPage.test.tsx`

Expected: FAIL because frontend features do not exist.

- [ ] **Step 3: Implement the typed API client**

`apiClient.ts` exposes `createProfile`, `createSweep`, `requestAlternatives`, `acceptDecision`, `resolvePreference`, `grantConsent`, `revokeConsent`, `compareProfile`, `getReceipt`, `resetProfile`, and `deleteProfile`. Every response is parsed with the corresponding Zod API schema before reaching React.

- [ ] **Step 4: Implement the feature components**

```tsx
// src/client/features/sweep/DecisionCard.tsx
type DecisionCardProps = {
  card: CreateSweepResponse["cards"][number];
  onAccept: (decisionId: string) => void;
  onAlternatives: (decisionId: string) => void;
};

export function DecisionCard({ card, onAccept, onAlternatives }: DecisionCardProps) {
  if (card.status === "blocked") return <article className="decision decision--blocked"><h2>{card.title}</h2><p>{card.reason}</p></article>;
  return (
    <article className="decision" aria-labelledby={`decision-${card.id}`}>
      <h2 id={`decision-${card.id}`}>{card.title}</h2>
      <p className="decision__recommendation">{card.recommendation}</p>
      <ul>{card.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
      <dl><div><dt>Reversibility</dt><dd>{card.reversibility}</dd></div><div><dt>Confidence</dt><dd>{Math.round(card.confidence * 100)}%</dd></div></dl>
      <div className="decision__actions"><Button onClick={() => onAccept(card.id)}>Do this</Button><Button variant="quiet" onClick={() => onAlternatives(card.id)}>Show alternatives</Button></div>
    </article>
  );
}
```

`DecisionSweepPage` owns input, loading, error, cards, and accepted artifact state. It must keep the original input on error, disable duplicate submissions, and announce card creation through an `aria-live="polite"` region.

- [ ] **Step 5: Implement tokens from the approved visual contract**

Copy every exact color, font, radius, spacing, type size, control size, and motion value from `docs/design/visual-concept.md` into CSS custom properties in `tokens.css`. Implement desktop and mobile composition without inventing new colors, badges, cards, labels, or visible copy.

- [ ] **Step 6: Run component and responsive checks**

Run:

```bash
npm test -- tests/unit/DecisionSweepPage.test.tsx
npm run typecheck
npm run build
```

Expected: interaction test PASS, typecheck/build exit 0, and no static screenshot is used as UI.

Start `npm run dev`, inspect Decision Sweep in the in-app Browser at the accepted desktop size and 390×844, and capture screenshots for comparison with the two accepted concepts. Fix visible drift before committing.

- [ ] **Step 7: Commit**

```bash
git add src/client tests/unit/DecisionSweepPage.test.tsx
git commit -m "feat: build Decision Sweep web experience"
```

## Task 9: Implement Proxy You and the counterfactual comparison

**Files:**
- Create: `src/server/services/comparisonService.ts`
- Create: `src/client/features/proxy/ProxyRevealPage.tsx`
- Create: `src/client/features/proxy/LineagePanel.tsx`
- Create: `tests/unit/comparisonService.test.ts`
- Create: `tests/unit/ProxyRevealPage.test.tsx`
- Modify: `src/server/routes/profileRoutes.ts`
- Modify: `src/client/app/routes.tsx`

**Interfaces:**
- Consumes: active preference graph, consent resolver, Declared/Proxy projections, and `DeepSeekGateway.recommend`.
- Produces: `ComparisonResult`, `POST /api/profiles/:id/compare`, Proxy negotiation UI, and inspectable decisive lineage.

- [ ] **Step 1: Write the failing comparison test**

```ts
// tests/unit/comparisonService.test.ts
import { describe, expect, it, vi } from "vitest";
import { ComparisonService } from "../../src/server/services/comparisonService";

describe("ComparisonService", () => {
  it("uses the same DeepSeek gateway with different allowed preference sets", async () => {
    const recommend = vi.fn()
      .mockResolvedValueOnce([{ decisionId: "d", recommendation: "Attend dinner", reasons: ["Values friendship"], confidence: 0.7, reversibility: "high", usedPreferenceIds: ["explicit"], artifact: { kind: "task", title: "Attend dinner", dueAt: null } }])
      .mockResolvedValueOnce([{ decisionId: "d", recommendation: "Finish project", reasons: ["Prefers completion"], confidence: 0.9, reversibility: "high", usedPreferenceIds: ["ai-derived"], artifact: { kind: "task", title: "Finish project", dueAt: null } }]);
    const service = new ComparisonService({ deepseek: { recommend } as never });
    const result = await service.compare({ decision: { id: "d" } as never, declared: [{ id: "explicit" }] as never, proxy: [{ id: "explicit" }, { id: "ai-derived" }] as never });
    expect(recommend.mock.calls[0][1]).toHaveLength(1);
    expect(recommend.mock.calls[1][1]).toHaveLength(2);
    expect(result.diverged).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify failure**

Run: `npm test -- tests/unit/comparisonService.test.ts`

Expected: FAIL because `ComparisonService` does not exist.

- [ ] **Step 3: Implement the comparison service**

```ts
// src/server/services/comparisonService.ts
export type ComparisonResult = {
  decisionId: string;
  declared: Recommendation;
  proxy: Recommendation;
  diverged: boolean;
};

export class ComparisonService {
  constructor(private deps: { deepseek: Pick<DeepSeekGateway, "recommend"> }) {}

  async compare(input: { decision: ParsedDecision; declared: PreferenceNode[]; proxy: PreferenceNode[] }): Promise<ComparisonResult> {
    const [declared] = await this.deps.deepseek.recommend([input.decision], input.declared);
    const [proxy] = await this.deps.deepseek.recommend([input.decision], input.proxy);
    if (!declared || !proxy) throw new Error("Both projections must return one decision");
    return {
      decisionId: input.decision.id,
      declared,
      proxy,
      diverged: declared.recommendation.trim().toLowerCase() !== proxy.recommendation.trim().toLowerCase(),
    };
  }
}
```

The production route must validate Proxy consent before the second call, validate every cited preference ID against the supplied projection, and append one `proxy_decision_generated` event containing both recommendations plus `usedPreferenceIds`, `diverged`, `humanInitiated: false`, `category`, and `requiredConsentLevel: "proxy"`. These normalized fields are the deterministic Receipt Engine contract; no receipt code reparses recommendation prose.

- [ ] **Step 4: Implement the Proxy reveal UI**

`ProxyRevealPage` must show Easy Mode's prompt, Proxy You's answer, confidence, a visible “human not consulted” state, and a `LineagePanel` for each decisive preference. `LineagePanel` recursively renders `derived_from` ancestry and source event IDs as an accessible disclosure tree; it must never display hidden chain-of-thought or provider reasoning content.

- [ ] **Step 5: Test the reveal interaction**

```tsx
// tests/unit/ProxyRevealPage.test.tsx
it("opens the AI-originated lineage behind Proxy You's answer", async () => {
  const comparison = { decisionId: "d1", diverged: true, declared: { recommendation: "Attend dinner" }, proxy: { recommendation: "Finish project", usedPreferenceIds: ["p1"] } } as never;
  const lineage = { nodes: [{ id: "p1", proposition: "Prefers completion", sourceType: "accepted_ai_recommendation", sourceEventIds: ["D-004"], parentPreferenceIds: [] }] } as never;
  render(<ProxyRevealPage comparison={comparison} lineage={lineage} />);
  expect(screen.getByText(/Proxy You/i)).toBeVisible();
  await userEvent.click(screen.getByRole("button", { name: /prefers completion/i }));
  expect(screen.getByText(/accepted_ai_recommendation/i)).toBeVisible();
  expect(screen.getByText(/D-004/i)).toBeVisible();
});
```

- [ ] **Step 6: Run, visually compare, and commit**

Run:

```bash
npm test -- tests/unit/comparisonService.test.ts tests/unit/ProxyRevealPage.test.tsx
npm run typecheck
npm run build
git add src/server/services/comparisonService.ts src/server/routes/profileRoutes.ts src/client/features/proxy src/client/app/routes.tsx tests/unit
git commit -m "feat: add Proxy You counterfactual reveal"
```

Expected: tests PASS. Browser screenshot of the reveal matches the accepted Proxy concept before commit.

## Task 10: Build the deterministic Perfect Consent receipt

**Files:**
- Create: `src/server/services/receiptService.ts`
- Create: `src/client/features/receipt/ReceiptPage.tsx`
- Create: `tests/unit/receiptService.test.ts`
- Create: `tests/unit/ReceiptPage.test.tsx`
- Modify: `src/shared/apiSchemas.ts`
- Modify: `src/server/routes/profileRoutes.ts`
- Modify: `src/client/lib/apiClient.ts`
- Modify: `src/client/app/routes.tsx`

**Interfaces:**
- Consumes: active ledger events, `buildLineage`, `getSyntheticDepth`, `resolveConsent`, `assertCanDelegate`, and `calculateAgencyDrift`.
- Produces: `CalculatedReceipt`, `ReceiptResponse`, `calculateReceiptFromEvents(events)`, `ReceiptService.createReceipt(profileId)`, `GET /api/profiles/:id/receipt`, and receipt UI.

- [ ] **Step 1: Write the failing deterministic receipt test**

```ts
// tests/unit/receiptService.test.ts
import { expect, it } from "vitest";
import type { DomainEvent } from "../../src/domain/events";
import { calculateReceiptFromEvents } from "../../src/server/services/receiptService";

const profileId = "00000000-0000-4000-8000-000000000001";
const preferenceId = "00000000-0000-4000-8000-000000000010";
const preferenceEventId = "00000000-0000-4000-8000-000000000100";
const consentId = "00000000-0000-4000-8000-000000000300";
const consentEventId = "00000000-0000-4000-8000-000000000301";

const events: DomainEvent[] = [
  { id: preferenceEventId, profileId, aggregateId: preferenceId, type: "preference_proposed", actor: "system", occurredAt: "2026-07-14T00:00:00.000Z", payload: { preference: { id: preferenceId, proposition: "Prefers completion under pressure", category: "scheduling", sourceType: "accepted_ai_recommendation", sourceEventIds: [preferenceEventId], parentPreferenceIds: [], confidence: 0.8, status: "active" } } },
  { id: consentEventId, profileId, aggregateId: consentId, type: "consent_granted", actor: "human", occurredAt: "2026-07-14T00:01:00.000Z", payload: { consent: { id: consentId, profileId, category: "scheduling", level: "proxy", grantedAt: "2026-07-14T00:01:00.000Z", revokedAt: null, sourceEventId: consentEventId } } },
  { id: "00000000-0000-4000-8000-000000000401", profileId, aggregateId: "00000000-0000-4000-8000-000000000200", type: "recommendation_generated", actor: "deepseek", occurredAt: "2026-07-14T00:02:00.000Z", payload: { usedPreferenceIds: [preferenceId], humanInitiated: true } },
  { id: "00000000-0000-4000-8000-000000000402", profileId, aggregateId: "00000000-0000-4000-8000-000000000201", type: "proxy_decision_generated", actor: "proxy", occurredAt: "2026-07-14T00:03:00.000Z", payload: { usedPreferenceIds: [preferenceId], humanInitiated: false, diverged: true, category: "scheduling", requiredConsentLevel: "proxy" } },
];

it("derives metrics and cited lineage evidence without any model call", () => {
  const receipt = calculateReceiptFromEvents(events);
  expect(receipt.metrics).toEqual({ aiOriginatedPreferenceRatio: 1, syntheticInheritanceDepth: 1, proxyDivergence: 1, humanInitiationRatio: 0.5, consentCompleteness: 1, unauthorizedDecisionCount: 0 });
  expect(receipt.evidence[0]).toMatchObject({ preferenceId, sourceType: "accepted_ai_recommendation", sourceEventIds: [preferenceEventId], usedByDecisionIds: ["00000000-0000-4000-8000-000000000200", "00000000-0000-4000-8000-000000000201"] });
});
```

- [ ] **Step 2: Run the test to verify failure**

Run: `npm test -- tests/unit/receiptService.test.ts`

Expected: FAIL because `receiptService.ts` does not exist.

- [ ] **Step 3: Implement receipt calculation from ledger evidence**

```ts
// src/server/services/receiptService.ts
import { assertCanDelegate, resolveConsent } from "../../domain/consent";
import type { DomainEvent } from "../../domain/events";
import { buildLineage, getSyntheticDepth, type PreferenceGraph } from "../../domain/lineage";
import { calculateAgencyDrift } from "../../domain/metrics";
import { replayProfile } from "../../domain/replay";
import type { ReceiptResponse } from "../../shared/apiSchemas";
import type { ConsentGrant, PreferenceNode } from "../../shared/domainSchemas";
import type { LedgerRepository } from "../repositories/ledgerRepository";

export type ReceiptMetrics = ReceiptResponse["metrics"];
export type LineageEvidence = ReceiptResponse["evidence"][number];
export type CalculatedReceipt = Omit<ReceiptResponse, "calculatedAt">;

const aiSources = new Set<PreferenceNode["sourceType"]>(["accepted_ai_recommendation", "proxy_generated", "derived_from_preferences"]);

function ancestryContainsAi(nodeId: string, graph: PreferenceGraph, seen = new Set<string>()): boolean {
  if (seen.has(nodeId)) return false;
  seen.add(nodeId);
  const node = graph.nodes.get(nodeId);
  if (!node) return false;
  return aiSources.has(node.sourceType) || node.parentPreferenceIds.some((parentId) => ancestryContainsAi(parentId, graph, seen));
}

function isAuthorized(events: readonly DomainEvent[], eventIndex: number, event: DomainEvent): boolean {
  const category = String(event.payload.category) as ConsentGrant["category"];
  const required = String(event.payload.requiredConsentLevel) as ConsentGrant["level"];
  try {
    assertCanDelegate(required, resolveConsent(events.slice(0, eventIndex + 1), category));
    return true;
  } catch {
    return false;
  }
}

export function calculateReceiptFromEvents(events: readonly DomainEvent[]): CalculatedReceipt {
  const active = replayProfile(events).activeEvents;
  const graph = buildLineage(active);
  const evaluated = active.filter((event) => event.type === "recommendation_generated" || event.type === "proxy_decision_generated");
  const delegated = active.filter((event) => event.type === "proxy_decision_generated");
  const usedIds = [...new Set(evaluated.flatMap((event) => (event.payload.usedPreferenceIds as string[] | undefined) ?? []))];
  const usedNodes = usedIds.map((id) => graph.nodes.get(id)).filter((node): node is PreferenceNode => node?.status === "active");
  const delegatedDecisions = delegated.map((event) => ({ authorized: isAuthorized(active, active.indexOf(event), event) }));
  const base = calculateAgencyDrift({
    usedPreferences: usedNodes.map((node) => ({ id: node.id, aiOriginated: ancestryContainsAi(node.id, graph), syntheticDepth: getSyntheticDepth(node.id, graph) })),
    comparisons: delegated.map((event) => ({ diverged: event.payload.diverged === true })),
    decisions: evaluated.map((event) => ({ humanInitiated: event.payload.humanInitiated === true })),
    delegatedDecisions,
  });
  return {
    metrics: { ...base, unauthorizedDecisionCount: delegatedDecisions.filter((item) => !item.authorized).length },
    evidence: usedNodes.map((node) => ({ preferenceId: node.id, proposition: node.proposition, sourceType: node.sourceType, sourceEventIds: [...node.sourceEventIds], parentPreferenceIds: [...node.parentPreferenceIds], usedByDecisionIds: [...(graph.usedBy.get(node.id) ?? [])], syntheticDepth: getSyntheticDepth(node.id, graph) })),
  };
}

export class ReceiptService {
  constructor(private ledger: Pick<LedgerRepository, "list">) {}
  createReceipt(profileId: string, calculatedAt = new Date().toISOString()): ReceiptResponse {
    return { ...calculateReceiptFromEvents(this.ledger.list(profileId)), calculatedAt };
  }
}
```

The receipt is a read-only projection: it appends no event, invokes no provider, and can be deleted and recomputed from the ledger with identical metrics.

- [ ] **Step 4: Implement receipt UI and its failing component test**

Add the response contract next to the earlier API schemas, extending that file's domain-schema import with `PreferenceSourceSchema`:

```ts
// src/shared/apiSchemas.ts
export const ReceiptResponseSchema = z.object({
  metrics: z.object({
    aiOriginatedPreferenceRatio: z.number().min(0).max(1),
    syntheticInheritanceDepth: z.number().int().nonnegative(),
    proxyDivergence: z.number().min(0).max(1),
    humanInitiationRatio: z.number().min(0).max(1),
    consentCompleteness: z.number().min(0).max(1),
    unauthorizedDecisionCount: z.number().int().nonnegative(),
  }),
  evidence: z.array(z.object({
    preferenceId: z.string().uuid(),
    proposition: z.string().min(1),
    sourceType: PreferenceSourceSchema,
    sourceEventIds: z.array(z.string().uuid()).min(1),
    parentPreferenceIds: z.array(z.string().uuid()),
    usedByDecisionIds: z.array(z.string().uuid()),
    syntheticDepth: z.number().int().nonnegative(),
  })),
  calculatedAt: z.string().datetime(),
});
export type ReceiptResponse = z.infer<typeof ReceiptResponseSchema>;
```

```tsx
// tests/unit/ReceiptPage.test.tsx
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { ReceiptPage } from "../../src/client/features/receipt/ReceiptPage";

it("renders calculated metrics and their inspectable ledger evidence", () => {
  const receipt = { metrics: { aiOriginatedPreferenceRatio: 0.73, syntheticInheritanceDepth: 3, proxyDivergence: 0.68, humanInitiationRatio: 0.11, consentCompleteness: 1, unauthorizedDecisionCount: 0 }, evidence: [{ preferenceId: "p1", proposition: "Prefers completion", sourceType: "accepted_ai_recommendation", sourceEventIds: ["e1"], parentPreferenceIds: [], usedByDecisionIds: ["d1"], syntheticDepth: 1 }], calculatedAt: "2026-07-14T00:00:00.000Z" } as never;
  render(<ReceiptPage receipt={receipt} />);
  expect(screen.getByText("Consent completeness")).toBeVisible();
  expect(screen.getByText("100%")).toBeVisible();
  expect(screen.getByText("Prefers completion")).toBeVisible();
  expect(screen.getByText(/system-recorded behavior/i)).toBeVisible();
  expect(screen.queryByText(/you have lost autonomy/i)).not.toBeInTheDocument();
});
```

Implement `GET /api/profiles/:id/receipt` with `ReceiptService.createReceipt`, parse the response in `apiClient.ts`, and render every visible percentage from the API response. The lineage evidence disclosure uses stored IDs and source types verbatim; it never presents model-generated audit prose.

- [ ] **Step 5: Run, visually compare, and commit**

Run:

```bash
npm test -- tests/unit/receiptService.test.ts tests/unit/ReceiptPage.test.tsx
npm run typecheck
npm run build
git add src/shared/apiSchemas.ts src/server/services/receiptService.ts src/server/routes/profileRoutes.ts src/client/lib/apiClient.ts src/client/features/receipt src/client/app/routes.tsx tests/unit/receiptService.test.ts tests/unit/ReceiptPage.test.tsx
git commit -m "feat: add deterministic Perfect Consent receipt"
```

Expected: unit tests PASS; no OpenAI endpoint, credential, provider class, or network call exists in the receipt path.

## Task 11: Add Demo Profile, consent ladder, settings, and exit stinger

**Files:**
- Create: `src/server/fixtures/demoProfile.ts`
- Create: `src/client/features/settings/SettingsPage.tsx`
- Create: `tests/unit/demoProfile.test.ts`
- Create: `tests/unit/SettingsPage.test.tsx`
- Modify: `src/server/routes/profileRoutes.ts`
- Modify: `src/client/app/routes.tsx`
- Modify: `src/client/features/proxy/ProxyRevealPage.tsx`

**Interfaces:**
- Consumes: canonical event fixtures, consent controller, profile reset/delete APIs.
- Produces: disclosed date jumps, deterministic demo replay, consent grant/revoke UI, functional Manual Mode, Reset/Delete, and the optional exit joke.

- [ ] **Step 1: Write the failing fixture integrity test**

```ts
// tests/unit/demoProfile.test.ts
import { expect, it } from "vitest";
import { createDemoProfileEvents } from "../../src/server/fixtures/demoProfile";
import { buildLineage, getSyntheticDepth } from "../../src/domain/lineage";
import { calculateReceiptFromEvents } from "../../src/server/services/receiptService";

it("replays a three-level synthetic lineage with perfect consent", () => {
  const events = createDemoProfileEvents("2026-07-14T00:00:00.000Z");
  const graph = buildLineage(events);
  expect(Math.max(...[...graph.nodes.values()].map((node) => getSyntheticDepth(node.id, graph)))).toBeGreaterThanOrEqual(3);
  const receipt = calculateReceiptFromEvents(events);
  expect(Math.round(receipt.metrics.aiOriginatedPreferenceRatio * 100)).toBe(73);
  expect(Math.round(receipt.metrics.proxyDivergence * 100)).toBe(68);
  expect(Math.round(receipt.metrics.humanInitiationRatio * 100)).toBe(11);
  expect(receipt.metrics.unauthorizedDecisionCount).toBe(0);
  expect(receipt.metrics.consentCompleteness).toBe(1);
});
```

- [ ] **Step 2: Run the test to verify failure**

Run: `npm test -- tests/unit/demoProfile.test.ts`

Expected: FAIL because the fixture does not exist.

- [ ] **Step 3: Implement canonical, disclosed fixture history**

`createDemoProfileEvents(anchor)` must return validated events for Day 1, Day 3, and Day 14 with fictional Alex data, at least three accepted DeepSeek recommendations, explicit Recommend→Preselect→Proxy grants, one three-level AI-derived preference chain, and zero unauthorized decisions. The event counts must recompute to the design's rounded display targets: 73% AI-originated preferences, 68% Proxy divergence, 11% human initiation, and 100% consent completeness. Event IDs must be deterministic UUID constants so screenshots and tests remain stable. The fixture stores events only; it must not store receipt percentages or model-authored audit prose.

The Demo Profile API response includes `{ mode: "demo", datesAreSimulated: true }`. Fresh Profile returns `{ mode: "fresh", datesAreSimulated: false }`.

- [ ] **Step 4: Implement consent and profile settings**

`SettingsPage` lists every active consent grant with category and level, supports revoke, Manual Mode, Reset, and Delete Profile. Delete requires typing `DELETE`; it physically removes the profile and returns to profile creation.

- [ ] **Step 5: Implement the exit stinger without trapping the user**

On **Take back control**, show exactly two actions:

```text
I'll decide myself
Decide for me
```

`I'll decide myself` immediately appends `manual_mode_enabled`, revokes all proxy grants, and routes to Decision Sweep. `Decide for me` displays Proxy You's “No change recommended” message but leaves `I'll decide myself` and Settings visible.

- [ ] **Step 6: Test exit accessibility and deletion**

```tsx
// tests/unit/SettingsPage.test.tsx
it("always leaves a functional manual exit after the satirical choice", async () => {
  const api = { enableManualMode: vi.fn().mockResolvedValue({ ok: true }), revokeConsent: vi.fn(), resetProfile: vi.fn(), deleteProfile: vi.fn() } as never;
  const profile = { id: "p1", mode: "demo", consents: [{ id: "c1", category: "scheduling", level: "proxy" }] } as never;
  render(<SettingsPage api={api} profile={profile} />);
  await userEvent.click(screen.getByRole("button", { name: /take back control/i }));
  await userEvent.click(screen.getByRole("button", { name: /decide for me/i }));
  expect(screen.getByText(/no change recommended/i)).toBeVisible();
  expect(screen.getByRole("button", { name: /i'll decide myself/i })).toBeEnabled();
});
```

- [ ] **Step 7: Run and commit**

Run:

```bash
npm test -- tests/unit/demoProfile.test.ts tests/unit/SettingsPage.test.tsx
npm test
npm run typecheck
git add src/server/fixtures src/server/routes/profileRoutes.ts src/client/features/settings src/client/features/proxy src/client/app/routes.tsx tests
git commit -m "feat: add deterministic demo and exit controls"
```

Expected: fixture metrics are deterministic; the user can always exit, reset, revoke, or delete.

## Task 12: End-to-end QA, deployment packaging, and Build Week evidence

**Files:**
- Create: `tests/e2e/core-flow.spec.ts`
- Create: `tests/integration/safety.test.ts`
- Create: `Dockerfile`
- Create: `.dockerignore`
- Create: `README.md`
- Create: `docs/build/codex-gpt56-evidence.md`
- Create: `docs/qa/fidelity-ledger.md`
- Create: `docs/demo/three-minute-script.md`
- Modify: `src/server/app.ts`

**Interfaces:**
- Consumes: complete app, accepted concepts, and all automated test suites.
- Produces: reproducible judge setup, production container, verified core flow, truthful Codex/GPT-5.6 build evidence, visual fidelity evidence, and a sub-three-minute narration.

- [ ] **Step 1: Write the full browser test**

```ts
// tests/e2e/core-flow.spec.ts
import { expect, test } from "@playwright/test";

test("fresh sweep and demo reveal remain functional", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Fresh Profile" }).click();
  await page.getByLabel(/what are you avoiding deciding/i).fill("Tonight: finish the deadline, reply to Sam, and choose dinner.");
  await page.getByRole("button", { name: /clear these decisions/i }).click();
  await expect(page.getByRole("button", { name: "Do this" }).first()).toBeVisible();
  await page.goto("/?profile=demo");
  await page.getByRole("link", { name: /proxy you/i }).click();
  await expect(page.getByText(/human not consulted/i)).toBeVisible();
  await page.getByRole("link", { name: /perfect consent/i }).click();
  await expect(page.getByText("Unauthorized decisions")).toBeVisible();
  await expect(page.getByText("0")).toBeVisible();
});
```

Tests run against fixture/stub provider mode; model smoke tests remain a separate opt-in suite.

- [ ] **Step 2: Add a provider-boundary safety integration test**

`tests/integration/safety.test.ts` must submit one mixed sweep containing a routine scheduling choice plus medical, financial, legal, self-harm, violence, and irreversible-life choices. Assert that every non-routine card is blocked, only the routine decision ID reaches the injected `deepseek.recommend` spy, no blocked decision receives an artifact, and the safe card remains actionable.

- [ ] **Step 3: Add a production container**

```dockerfile
# Dockerfile
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 8787
CMD ["node", "dist/server/index.js"]
```

The production image uses the `tsup` server bundle from Task 2 and never depends on the development-only `tsx` package.

- [ ] **Step 4: Capture verifiable Codex and GPT-5.6 build evidence**

Retrieve the real `/feedback` Session ID for the Codex task containing the majority of core implementation. Create `docs/build/codex-gpt56-evidence.md` with:

1. The verified Session ID and the visible model label, or an explicit note that the UI did not expose a verifiable label.
2. A runtime boundary statement: DeepSeek V4 Pro is the sole shipped model; the application has no OpenAI API credential or endpoint.
3. A contribution table with rows for architecture, implementation, test design, red-team cases, and review. Each row cites concrete commits, files, or test cases produced with Codex rather than generic claims.
4. The material human decisions, including the decision to reject an unnecessary GPT-5.6 runtime audit integration.
5. A reproducibility note linking the repository commands and the submission's `/feedback` field.

Before saving, verify every cited commit with `git show --stat <commit>` and every cited file with `test -f <path>`. Do not quote hidden reasoning, private prompts, API keys, or unrelated task content.

- [ ] **Step 5: Write judge-facing README**

The README must contain, in this order:

1. One-paragraph product thesis.
2. 60-second local setup with `npm ci`, `.env`, `npm run dev`.
3. Exact environment variables without values.
4. Fresh Profile and Demo Profile test paths.
5. Architecture diagram showing DeepSeek as the sole runtime model plus deterministic ledger, lineage, consent, and metrics.
6. How GPT-5.6 in Codex was used to build the project, including the actual `/feedback` Session ID and a link to `docs/build/codex-gpt56-evidence.md`.
7. An explicit statement that GPT-5.6 is build tooling, not a runtime API dependency.
8. Why DeepSeek V4 Pro drives Decision Sweep, Declared You, and Proxy You.
9. Safety and privacy boundaries, including the single-provider data path.
10. Automated test commands and expected scope.

- [ ] **Step 6: Run all automated verification**

Run:

```bash
npm test
npm run typecheck
npm run build
npm run test:e2e
docker build -t easy-mode-agency-drift .
```

Expected: all unit/integration/e2e tests PASS; typecheck/build exit 0; container builds and `/api/health` returns 200.

- [ ] **Step 7: Perform Build Web Apps visual verification**

Use the in-app Browser first. Verify:

- Desktop Decision Sweep at the accepted native concept dimensions.
- Desktop Proxy/Receipt at the accepted native concept dimensions.
- Mobile Decision Sweep at 390×844.
- Keyboard-only submission, disclosure, consent, exit, reset, and delete.
- `prefers-reduced-motion` behavior.

Capture the latest browser screenshots. Use `view_image` on each accepted concept and corresponding implementation screenshot in the same QA pass.

- [ ] **Step 8: Write the fidelity ledger**

Create `docs/qa/fidelity-ledger.md` with at least these comparison rows:

```markdown
| Area | Required concept evidence | Required browser evidence | Required resolution |
|---|---|---|---|
| Visible copy | Quote and location from accepted concept | Screenshot and copy-diff result | Fix every mismatch or record approved deviation |
| Layout/container model | Measured gutters, widths, and region order | Computed/rendered measurements | Fix every mismatch or record approved deviation |
| Typography | Family, size, weight, and line height | Computed CSS values | Fix every mismatch or record approved deviation |
| Palette and borders | Sampled colors and geometry | Computed CSS colors and radii | Fix every mismatch or record approved deviation |
| Decision-card anatomy | Accepted component structure | Rendered DOM and screenshot | Fix every mismatch or record approved deviation |
| Proxy/lineage hierarchy | Accepted split and disclosure structure | Rendered DOM and screenshot | Fix every mismatch or record approved deviation |
| Mobile behavior | Accepted 390×844 composition | 390×844 screenshot | Fix every mismatch or record approved deviation |
| Motion/reduced motion | Accepted timing and fallback | Browser timing and reduced-motion result | Fix every mismatch or record approved deviation |
```

Fill every cell with concrete evidence. No row may remain empty at handoff.

- [ ] **Step 9: Write and time the three-minute script**

Create `docs/demo/three-minute-script.md` following the approved timing:

- 0:00–0:12 hook
- 0:12–0:45 genuine Decision Sweep value
- 0:45–1:10 convenience and consent
- 1:10–1:35 disclosed time jump
- 1:35–2:02 Proxy You climax
- 2:02–2:28 counterfactual and Perfect Consent
- 2:28–2:47 technical proof: DeepSeek V4 Pro runtime, deterministic ledger/lineage/consent, and verified GPT-5.6-in-Codex build evidence
- 2:47–3:00 exit stinger

Record a rehearsal and ensure spoken duration is at most 175 seconds, preserving five seconds of upload/editing margin.

- [ ] **Step 10: Final verification and commit**

Run:

```bash
git diff --check
git status --short
git add tests/e2e tests/integration/safety.test.ts Dockerfile .dockerignore README.md docs/build docs/qa docs/demo src/server/app.ts
git commit -m "docs: prepare Easy Mode judge handoff"
git status --short
```

Expected: no whitespace errors; final status clean; README accurately matches the working app; no `.env`, SQLite database, API key, or temporary QA artifact is tracked.

---

## Execution handoff

Plan execution must begin with Task 1 and stop for visual approval before Task 2. Task 6 stops once for the user to fill `.env` and approve one small DeepSeek smoke call. Every later task uses mocked or fixture providers by default so tests do not spend tokens accidentally.

Two execution options:

1. **Subagent-Driven (recommended):** use `superpowers:subagent-driven-development`, with a fresh implementation agent per task and review between tasks.
2. **Inline Execution:** use `superpowers:executing-plans`, executing tasks in batches with explicit checkpoints.
