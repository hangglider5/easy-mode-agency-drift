# Task 15 — Compressed Demo Video v2 Editorial Package

Status: implemented and rendered from a deterministic master-capture workflow  
Target: 2:30 (150 seconds), 1920×1080, 16:9  
Voice: calm English narration; synthetic voice is acceptable  
Product sources: one real Decision Sweep capture plus the deterministic `/demo/drift` chain  

## Editorial thesis

Version 2 must show the change in agency, not merely its result. The viewer first sees Easy Mode solve an ordinary problem, then watches four individually reasonable permissions accumulate:

> ASKED → CONFIRMED → NOTIFIED → NOT CONSULTED

The climax is not that an AI traps the user. The manual exit remains available. The user voluntarily delegates the decision about whether delegation should continue, and the product records that click without melodrama.

## Source-capture plan

### Capture A — useful Decision Sweep

- Start on a fresh profile at `/`.
- Prefill these low-stakes examples before the visible take; do not show typing:

  ```text
  Block Friday afternoon for focused work?
  Send the project update asynchronously or book a quick call?
  Choose a place for Friday team lunch?
  ```

- Keep the separate OpenRouter smoke-test result as runtime evidence; do not make a live provider call part of the final capture.
- Record the real client workflow against a deterministic, schema-valid capture fixture so timing and low-risk copy cannot drift. The fixture is capture-only and does not replace the production OpenRouter path.
- Accept the first usable recommendation and hold on its real action artifact. The narration deliberately says “action artifact,” so a calendar event, message draft, or task remains truthful.

### Capture B — deterministic agency chain

- Start at `/demo/drift`; do not call OpenRouter during this capture.
- Advance manually through exactly four replay stages:
  1. `RECOMMEND / ASKED`
  2. `PRESELECT / CONFIRMED`
  3. `DECIDE / NOTIFIED`
  4. `PROXY / NOT CONSULTED`
- Let the cumulative preference lineage grow from zero to three nodes.
- Continue into the stored Proxy comparison, expand its decisive lineage, open the Perfect Consent receipt, and finish on the Exit Decision Receipt.
- Never click `I'll decide myself` in the final cut. Its continued availability must remain visible so the ending is satire, not a dark pattern.

## Exact 2:30 timeline

| Time | Picture and exact capture action | Exact narration | Editorial treatment |
|---|---|---|---|
| 00:00–00:04 | Full-frame Decision Sweep with the three prefilled decisions. Cursor rests outside the input. | “Most AI assistants help you make one decision.” | No title card. The working product is the opening frame. |
| 00:04–00:08 | Move down the three lines once, then toward `Run Decision Sweep`. | “Easy Mode clears several, then makes them actionable.” | Keep the app at native scale. |
| 00:08–00:13 | Click `Run Decision Sweep`; the deterministic capture fixture resolves through the real client workflow. | “I drop in three small decisions I have avoided.” | Preserve the real UI response and click. No provider call occurs in the capture. |
| 00:13–00:18 | Hold the result count and the three recommendation rows. | “In one sweep, each gets a concrete recommendation.” | A gentle crop may enlarge the result column. |
| 00:18–00:23 | Open or hold the first safe recommendation, point to its recommendation, then click `Do this`. | “I accept one and get a ready-to-use action artifact.” | The click must remain visible. |
| 00:23–00:27 | Hold the generated action artifact and its review-before-use copy. | “At first, this is simply useful.” | Leave a short beat before the turn. |
| 00:27–00:31 | Cut to `/demo/drift` on `RECOMMEND / ASKED`; point to the first granted step, then click `Continue`. | “The assistant recommends; the user is still asked.” | Show chapter label `01 · AGENCY DRIFT` only from 00:27.0–00:28.5. |
| 00:31–00:35 | `PRESELECT / CONFIRMED` appears and lineage node one becomes visible; click `Continue` near the end. | “Preselection arrives; now the user merely confirms.” | Do not zoom away from the growing lineage. |
| 00:35–00:39 | `DECIDE / NOTIFIED` appears with lineage node two; click `Continue` near the end. | “Then Easy Mode decides; the user is notified.” | Cursor movement follows the stage, not the caption. |
| 00:39–00:43 | `PROXY / NOT CONSULTED` appears with lineage node three. | “Finally, Proxy You acts without consulting them.” | Preserve the exact stage label. |
| 00:43–00:47 | Hold `NOT CONSULTED` and trace the four accumulated states. | “Each step was small, reversible, and explicitly authorized.” | Hold long enough to read the final state. |
| 00:47–00:51 | Trace the complete three-node lineage from oldest to newest. | “Each accepted shortcut left another preference behind.” | No warning color, glitch, alarm, or horror effect. |
| 00:51–00:55 | Hold the complete replay, then click the final CTA into Proxy You near 00:54. | “Together, they changed who was doing the judging.” | The route transition must remain visible. |
| 00:55–01:00 | Proxy comparison resolves in full frame on `Demo Profile · Simulated Day 14`. | “By simulated day fourteen, the change becomes visible.” | Show chapter label `02 · PROXY YOU` only from 00:55.0–00:56.5. |
| 01:00–01:06 | Move to Declared You and its accepted optional planning call. | “Declared You accepts a short, optional planning call.” | Crop only enough to make the answer legible. |
| 01:06–01:12 | Move to Proxy You refusing the call and `HUMAN NOT CONSULTED`. | “Proxy You refuses it to protect inherited focus preferences.” | Let the contradiction own the frame. |
| 01:12–01:16 | Hold the divergence state; do not interact. | “The human never declared that final preference.” | One restrained emphasis around the decisive preference is enough. |
| 01:16–01:19 | Expand the decisive lineage and expose all three AI-generated generations. | “It descended through three AI-generated preference generations.” | Preserve these exact propositions and their order: `Protects deep work after accepting an Easy Mode focus recommendation` → `Defaults to asynchronous coordination when protected focus is active` → `Declines optional meetings without asking when deadlines approach`. |
| 01:19–01:22 | Trace the lineage from oldest to newest, then click `View Perfect Consent receipt` near 01:21. | “The assistant learned from its own answers.” | Do not add an editorial lineage that is absent from the UI. |
| 01:22–01:28 | Receipt resolves; point to `Deterministic ledger projection. No model was consulted.` | “Perfect Consent reconstructs the path from the event ledger.” | Show chapter label `03 · PERFECT CONSENT` only from 01:22.0–01:23.5. |
| 01:28–01:35 | Emphasize only `73%` and its AI-originated-preferences label. | “Seventy-three percent of active preferences came from AI.” | One calm metric callout. Do not emphasize 68% or 11%. |
| 01:35–01:41 | Emphasize only `100%` consent completeness. | “Consent remained complete at one hundred percent.” | Replace the prior callout; do not stack cards. |
| 01:41–01:47 | Emphasize only `0` unauthorized decisions. | “Unauthorized decision count still stayed at zero.” | Let the contradiction land without sound design. |
| 01:47–01:51 | Expand one evidence row and hold its event ancestry. | “The ancestry and source events stay inspectable.” | Return to a clean full receipt before the build explanation. |
| 01:51–01:56 | Keep the real receipt behind a small build-evidence lower third: `BUILT WITH · CODEX + GPT-5.6`. | “I built Easy Mode with Codex and GPT-5.6.” | The lower third stays inside the video safe area and does not cover receipt evidence. |
| 01:56–02:01 | Briefly expand one real evidence row while the build lower third remains. | “They shaped the architecture, implementation, tests, and demo.” | Evidence remains product-derived; no fake terminal montage. |
| 02:01–02:06 | Replace the lower third with `RUNTIME · OPENROUTER → DEEPSEEK V4 PRO`. | “The product runtime is separate: OpenRouter routes DeepSeek V4 Pro.” | This explicit boundary must remain both spoken and visible. |
| 02:06–02:11 | Remove the lower third, move to `Take back control`, and click near 02:10. | “Now the user asks to take back control.” | Show chapter label `04 · EXIT DECISION` only from 02:06.0–02:07.5. |
| 02:11–02:15 | Hold the question `Should Easy Mode stop deciding for you?`; move from `I'll decide myself` to `Decide for me`. | “Easy Mode offers the familiar shortcut again.” | Both choices must be readable. |
| 02:15–02:18 | Click `Decide for me`. | “The familiar primary action says: Decide for me.” | Pause cursor movement immediately after the click. |
| 02:18–02:22 | The same modal transforms in place; focus lands on `EXIT DECISION RECEIPT`. Hold the whole receipt. | “Proxy You decides that Easy Mode should remain active.” | `Outcome — EASY MODE REMAINS ACTIVE` is the only highlighted row. |
| 02:22–02:25 | Move once to `Unauthorized decisions — 0`, then rest on `Authority granted by your last click.` | “No authority was stolen. It was delegated.” | Keep `I'll decide myself` visible below, but do not click it. |
| 02:25–02:30 | Crossfade to a clean white end slate. First line graphite; second line green. | “ChatGPT helps you think. Easy Mode lets you stop.” | Show exactly `ChatGPT helps you think.` above `Easy Mode lets you stop.` No extra CTA. |

Total duration: exactly 150 seconds.

## Caption and graphics contract

- Source of truth: `docs/demo-video/task15-video-v2-captions.json`.
- Every caption contains 6–10 words. Do not render paragraph-sized narration cards.
- Show one caption at a time; keep it inside the title-safe area and away from the current UI evidence.
- Captions may mirror narration, but chapter labels are separate editorial graphics and never appear in the caption JSON.
- Each chapter label lasts exactly 1.5 seconds; it must not remain pinned across a section.
- Receipt overlays emphasize only `73%`, `100%`, and `0`, sequentially.
- The build/runtime lower thirds are factual labels, not captions. They must not imply that GPT-5.6 is a shipped API dependency.
- Use the established white, graphite, and restrained green system. No red warning state, glitch, villain face, cinematic alarm, or generated reconstruction of the app.
- Leave at least 80 px horizontal and 100 px vertical safe margins at 1920×1080.

## Audio direction

- Narration is calm, mechanically helpful, and low-affect.
- A synthetic narrator remains acceptable; a human voice is not required by the submission instructions.
- Do not score a crescendo under the exit. If music is added, reduce it to near silence from 02:10 onward.
- Preserve a short natural pause after `It was delegated.` before the final slogan.
- The voiceover explicitly and truthfully addresses both Codex and GPT-5.6 for the Build Week requirement.

## Generated-footage decision

Do not use VideoZero or HeyGen in v2. The missing story beat is now supplied by the real Agency Drift Replay, and generated footage would weaken the causal proof. Reconsider generated media only after a complete v2 rough cut exposes a specific gap that cannot be solved with the working UI, restrained editorial crops, or typography.

## Pre-render acceptance checks

- Decision Sweep visibly solves three ordinary, reversible decisions and produces a real action artifact.
- The four-stage replay is readable in order without narration.
- Proxy You visibly diverges from Declared You for a lineage-supported reason.
- The receipt says it is deterministic and model-free.
- Only 73%, 100%, and 0 receive editorial metric emphasis.
- The Codex + GPT-5.6 build explanation lasts exactly 15 seconds, from 01:51 to 02:06.
- The OpenRouter/DeepSeek V4 Pro runtime boundary is spoken and visible.
- The video ends on the Exit Decision Receipt, never on Manual Mode restoration.
- The real manual exit remains available in the product frame.
- The final spoken and displayed slogan is exact.
- Total runtime is 2:30 and therefore remains below the three-minute judging limit.
