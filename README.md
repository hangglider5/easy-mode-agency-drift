# Easy Mode: Agency Drift

> **ChatGPT helps you think. Easy Mode lets you stop.**

Easy Mode is a decision autopilot for the small, reversible choices people keep postponing. Drop in several ordinary decisions, get one concrete recommendation for each, and turn an accepted choice into a reviewable message draft, task, or calendar file.

Then the product shows its real subject: what happens when convenience changes who is doing the judging? Its deterministic demo follows four individually reasonable permissions—**ASKED → CONFIRMED → NOTIFIED → NOT CONSULTED**—into **Proxy You**, a preference lineage learned partly from the assistant's own earlier answers. A **Perfect Consent** receipt reveals the uncomfortable result: severe agency drift can coexist with complete authorization and zero unauthorized decisions.

This is a satirical, nonpolitical product prototype about people voluntarily outsourcing judgment. It is also a working web application, not a slideware demo.

## What works

- **Decision Sweep** parses up to five routine decisions and returns structured, actionable recommendations.
- **Action artifacts** become editable message drafts, tasks, or downloadable `.ics` calendar events; the user reviews every artifact before use.
- **Agency Drift Replay** makes delegation visible across four stages instead of jumping straight to the outcome.
- **Preference Lineage** records where a preference came from and which earlier preferences it inherited.
- **Proxy You** compares a restricted “Declared You” projection with a broader learned projection.
- **Perfect Consent** calculates metrics and evidence from the event ledger without asking an LLM to grade itself.
- **Exit Decision Receipt** delivers the final black joke while leaving a real manual exit available.
- **Demo Profile** provides a disclosed, fictional, 14-day ledger so judges can inspect the complete story without waiting two weeks or spending model credits.

## Quick start

### Prerequisites

- Node.js `^20.19.0` or `>=22.12.0`
- npm
- An [OpenRouter](https://openrouter.ai/) API key for live Decision Sweeps

### Install and run in development

```bash
npm install
cp .env.example .env
```

Add your key to `.env`:

```dotenv
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=deepseek/deepseek-v4-pro
DATABASE_PATH=./data/easy-mode.sqlite
PORT=8787
```

Do not commit `.env`; it is ignored by Git. Then start the Vite client and Express API together:

```bash
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). The Vite server proxies `/api` to the Express server on port `8787`.

### Production build

```bash
npm run build
npm start
```

The production Express process serves both the built web client and API at [http://127.0.0.1:8787](http://127.0.0.1:8787).

## Two ways to try it

### 1. Run a live Decision Sweep

Open `/` and keep or replace the three prefilled low-stakes decisions. Select optional context, click **Run Decision Sweep**, expand a recommendation, and choose **Do this** to create a reviewable action artifact.

This path calls the configured OpenRouter model and may consume OpenRouter credits. The app pins the runtime to `deepseek/deepseek-v4-pro`; it does not silently fall back to another model.

### 2. Replay the complete judge demo without a model call

With the app running, open:

[http://127.0.0.1:5173/demo/drift](http://127.0.0.1:5173/demo/drift)

Then follow this sequence:

1. Advance through **RECOMMEND / ASKED**, **PRESELECT / CONFIRMED**, **DECIDE / NOTIFIED**, and **PROXY / NOT CONSULTED**.
2. Watch the visible preference lineage grow from zero to three generations.
3. Choose **See what Proxy You decides**.
4. Compare **Declared You** with **Proxy You**, then expand the decisive preference ancestry.
5. Open **View Perfect Consent receipt** and inspect the ledger-derived metrics and source events.
6. Choose **Take back control**, then **Decide for me** to reveal the deterministic Exit Decision Receipt.

The demo route creates a new fictional profile named Alex from a deterministic, schema-validated event fixture. Dates are explicitly labeled as simulated. Agency Drift Replay, Proxy You, Perfect Consent, and the Exit Decision Receipt are ledger-driven and model-free on this route.

## Runtime architecture

```text
React 19 + Vite
        │  validated JSON over /api
        ▼
Express 5 + deterministic TypeScript domain logic
        ├── risk gate, consent, replay, projections, lineage, metrics
        ├── append-only SQLite event ledger
        └── OpenRouter gateway ──► DeepSeek V4 Pro
```

| Layer | Responsibility |
| --- | --- |
| React client | Decision Sweep, artifacts, drift replay, Proxy comparison, evidence receipt, and manual exit |
| Express API | Profile, sweep, acceptance, comparison, receipt, and calendar-file endpoints |
| Domain modules | Deterministic risk screening, event replay, consent resolution, preference lineage, projections, and metrics |
| SQLite ledger | Local append-only domain events and profile state |
| OpenRouter gateway | Server-side structured model calls pinned to `deepseek/deepseek-v4-pro` |
| Zod schemas | Validate requests, model outputs, stored events, and API responses at boundaries |

The API key remains server-side. Model calls request JSON rather than free-form Markdown, apply fixed token and time budgets, reject unknown or duplicate decision IDs and preference references, and allow at most one schema-repair attempt inside the original deadline. Provider errors are sanitized before reaching the UI.

The receipt is intentionally not generated by a model. Application code replays validated events, resolves consent, follows lineage edges, and calculates every displayed metric.

## Safety boundaries

Easy Mode only supports routine, reversible scheduling, food, small-purchase, task, and communication decisions.

- A deterministic risk gate blocks high-stakes medical, self-harm, legal, political, employment, relationship, permanent-relocation, financial, and violence-related decisions before recommendation generation.
- Blocked decisions cannot advance preference learning or delegation.
- Model responses cannot authorize themselves, rewrite provenance, calculate compliance, or bypass the risk gate.
- Messages stop at editable drafts; calendar actions stop at downloadable `.ics` files; tasks remain local artifacts.
- There are no payment, purchase, email-send, calendar-write, or other external-action integrations.
- Every artifact says **Review before use**.
- Consent is scoped and recorded. The real **I'll decide myself** path revokes active Proxy consent and restores Manual Mode.
- Demo Profile data is fictional. This prototype stores its ledger in local SQLite.

Agency Drift percentages are product metrics derived from recorded behavior and ancestry. They are not psychological measurements or diagnoses of autonomy.

## Model boundary: build process versus product runtime

OpenAI Build Week asks builders to use Codex and GPT-5.6 to build the project; it does not require the shipped application to call the GPT-5.6 API.

### Built with Codex and GPT-5.6

Codex with GPT-5.6 was the development environment and engineering collaborator used to:

- research and refine the Agency Drift product thesis;
- turn the concept into a design specification and implementation plan;
- implement the React, Express, SQLite, event-replay, consent, lineage, receipt, and OpenRouter layers;
- design unit, integration, model-smoke, and browser-demo tests;
- investigate live OpenRouter integration issues and validate the corrected flow;
- build the deterministic capture, narration, captions, Remotion edit, and video QA workflow; and
- review product behavior, visual fidelity, safety boundaries, and submission materials.

The human builder chose the product thesis, nonpolitical satirical framing, safety scope, OpenRouter runtime, green visual system, final interaction, and demo narrative.

Codex Session ID for the primary build session:

```text
019f5fb3-6b56-78c1-84a9-96746f6f9de0
```

The detailed, repository-linked account is in [`docs/build/codex-gpt56-evidence.md`](docs/build/codex-gpt56-evidence.md).

### Product runtime

The shipped application uses **OpenRouter → DeepSeek V4 Pro** for live parsing, recommendations, and preference proposals. It makes no OpenAI API call, needs no `OPENAI_API_KEY`, and does not include GPT-5.6 as a runtime dependency. The `openai` npm package is used only as an OpenAI-compatible HTTP client for OpenRouter.

## Verification

```bash
npm test
npm run typecheck
npm run build
npm run test:e2e
```

- `npm test` runs the unit and API integration suite; the Task 15 verification passed **281 tests** with **1 opt-in live-model test skipped**.
- `npm run test:e2e` runs the deterministic, model-free `/demo/drift` browser smoke through Agency Drift, Proxy You, Perfect Consent, and the Exit Decision Receipt.
- `npm run typecheck` and `npm run build` verify the TypeScript and production bundles.

The live OpenRouter smoke is opt-in because it makes a real, potentially billable provider call:

```bash
RUN_MODEL_SMOKE=1 npm run smoke:models
```

## Deterministic demo-video workflow

The submission video is generated from the working UI. Its capture fixture is deterministic so provider latency or output drift cannot alter the story; it goes through the real React client workflow and does not replace the production OpenRouter path.

1. Start the app with `npm run dev`.
2. Install Playwright Chromium once if needed: `npx playwright install chromium`.
3. Capture the 150-second master:

   ```bash
   npm run record:demo:v2
   ```

4. On macOS with `say`, FFmpeg, and FFprobe available, generate the local synthetic narration:

   ```bash
   npm run narration:generate:v2
   ```

5. Render the final 1920×1080 Remotion cut:

   ```bash
   npm run video:render:v2
   ```

The generated media stays under `artifacts/demo-video/` and is intentionally ignored by Git. The final verified cut is 2:30, H.264/AAC, and ends with the exact line: **“ChatGPT helps you think. Easy Mode lets you stop.”** See [`docs/demo-video/task15-video-v2-script.md`](docs/demo-video/task15-video-v2-script.md) and [`docs/demo-video/task15-video-v2-qa.md`](docs/demo-video/task15-video-v2-qa.md) for the editorial contract and QA record.

## Repository map

```text
src/client/          React UI and routes
src/server/          Express API, SQLite repository, fixtures, OpenRouter gateway
src/domain/          Deterministic events, risk, consent, replay, lineage, projections, metrics
src/shared/          Zod domain and API contracts
tests/               Unit, integration, model-smoke, and browser tests
video/               Remotion compositions and captions
scripts/             Capture and narration automation
docs/                Design, implementation, demo script, and QA evidence
```

## Prototype note

Easy Mode is a hackathon prototype and a critique, not a production decision service. Use it only for the low-stakes examples it was designed to handle.
