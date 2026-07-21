# OpenAI Build Week — Submission Worksheet

Last locally verified: July 21, 2026

Devpost state: project page published; not yet entered into OpenAI Build Week or submitted

Submission deadline: July 21, 2026 at 5:00 PM PT / July 22, 2026 at 8:00 AM GMT+8

## Known form answers

| Field | Answer |
|---|---|
| Project name | **Easy Mode: Agency Drift** |
| Tagline | **An AI assistant that clears your small decisions—then shows what happens when convenience starts choosing for you.** |
| Participant type | **Individual** |
| Primary category | **Apps for Your Life** |
| Country | **Taiwan** |
| Codex Session ID | **019f5fb3-6b56-78c1-84a9-96746f6f9de0** |
| Devpost project | [https://devpost.com/software/easy-mode-agency-drift](https://devpost.com/software/easy-mode-agency-drift) |
| Devpost project ID | **1357853** |
| Project description | Paste from `## Inspiration` through the final paragraph of [`devpost-project-description.md`](./devpost-project-description.md) |
| Code repository URL | [https://github.com/hangglider5/easy-mode-agency-drift](https://github.com/hangglider5/easy-mode-agency-drift) |
| Demo video URL | [https://youtu.be/xxuGp9C3FUM](https://youtu.be/xxuGp9C3FUM) |
| Hosted app URL | **Not provided — website is optional; use the public repository and deterministic local demo** |

## Built with

Use the applicable Devpost technology tags:

- Codex
- GPT-5.6
- React
- TypeScript
- Vite
- Node.js
- Express
- SQLite
- Zod
- OpenRouter
- DeepSeek V4 Pro
- Vitest
- Playwright
- Remotion

## Codex and GPT-5.6 answer

I built Easy Mode in the official Codex session listed above using GPT-5.6. I used them to research and refine the premise, design the event-ledger and preference-lineage architecture, implement and debug the React/Express application, create unit and integration tests, verify the OpenRouter boundary, and build the deterministic Playwright/Remotion demo workflow. I reviewed the work throughout and made the product decisions, including rejecting a game-like version and rejecting an unnecessary GPT-5.6 runtime integration.

GPT-5.6 was part of the build process, not the shipped model API. The production application routes DeepSeek V4 Pro through OpenRouter. Easy Mode does not require an OpenAI API key, and its Perfect Consent and Exit Decision receipts are calculated deterministically from the append-only event ledger.

## Optional judge test instructions

### Fast deterministic path

```bash
git clone https://github.com/hangglider5/easy-mode-agency-drift.git
cd easy-mode-agency-drift
npm ci
cp .env.example .env
# Set OPENROUTER_API_KEY=demo-only-placeholder in .env
npm run dev
```

1. Open `http://localhost:5173/demo/drift`.
2. Click **Continue replay** three times to advance through `RECOMMEND / ASKED`, `PRESELECT / CONFIRMED`, `DECIDE / NOTIFIED`, and `PROXY / NOT CONSULTED`.
3. Watch the preference lineage grow from zero to three generations. Optionally use **Inspect** or **View event ledger** to check its source evidence.
4. Click **See what Proxy You decides**. Compare Declared You with Proxy You and expand the decisive lineage.
5. Open **View Perfect Consent receipt**. The receipt is deterministic and makes no provider call.
6. Click **Take back control**, then **Decide for me**. Verify the Exit Decision Receipt shows `EASY MODE REMAINS ACTIVE` and `Unauthorized decisions 0`.
7. The real exit remains available: click **I'll decide myself** only if you want to restore Manual Mode.

### Live Decision Sweep

1. Open `/` and enter three to five low-stakes, reversible decisions.
2. Click **Run Decision Sweep**.
3. Review the recommendations and select **Do this** to create a message draft, calendar event, or task.

The live path requires a server-side OpenRouter key. For local review:

```bash
npm ci
cp .env.example .env
# Add OPENROUTER_API_KEY to .env
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173). The API key must remain server-side and must never be committed.

## Verification summary

- Public release repository: fresh-cloned and verified after security update commit `4746e86`.
- Fresh install: `npm ci` completed successfully from the public repository lockfile.
- Task 15 video: 150 seconds, 1920×1080, H.264, with required English voiceover.
- Uploaded YouTube video: public metadata resolves successfully with playability status `OK` and a 150-second duration.
- Unit and integration tests: 281 passed and 1 skipped at the Task 15 checkpoint.
- Typecheck and production build: passed at the Task 15 checkpoint.
- Live model coverage: separate OpenRouter/DeepSeek structured-output smoke test.
- Browser E2E: one focused, deterministic Playwright smoke covers Agency Drift → Proxy You → Perfect Consent → Exit Decision Receipt without a model call.
- Video capture: deterministic Playwright-driven product capture.
- Receipt path: ledger-driven and model-free.
- Production dependency audit: 0 vulnerabilities. One low-severity advisory remains in the Windows-only development `esbuild` path pinned by `tsup`; no production dependency is affected.

## Remaining submission blockers

- [x] Create and publish the final code repository and replace the repository URL placeholder.
- [x] Publish the repository publicly under the MIT License.
- [x] Judge access is covered by the public repository; no private collaborator invitations are required.
- [x] Add setup instructions, sample/demo data instructions, and Codex/GPT-5.6 build evidence to the repository README.
- [x] Synchronize the Task 15 Project Description, tagline, and technology tags to the live Devpost project.
- [x] Save the verified YouTube URL and the trimmed, humanized Project Description to Devpost project version 4; confirm both appear on the public page.
- [x] Add a deterministic Playwright end-to-end smoke for the complete judge path.
- [ ] Watch the complete Task 15 video and confirm narration clarity, especially the explicit Codex/GPT-5.6 and runtime-boundary segment.
- [x] Upload the final video to YouTube as public or unlisted, wait for processing, and replace the video URL placeholder.
- [x] Confirm the YouTube URL resolves without authentication and reports playable status `OK`.
- [x] No hosted app is required; the public repository and model-free local judge path are documented.
- [x] Confirm the public Devpost project lists one member only (`Kenny Leung`); submitter type remains Individual.
- [ ] Save all final Devpost fields.
- [ ] Submit to OpenAI Build Week before the deadline.
- [ ] Open Devpost **My Projects** and verify the project is marked **Submitted** in green, not merely saved as a draft.
