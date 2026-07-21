# Easy Mode: Agency Drift — Devpost Project Description

Use the copy below as the Devpost **Project Description**.

## Inspiration

I kept coming back to a small, uncomfortable habit: I ask an AI for help, get a reasonable answer, and stop checking whether it is still *my* answer.

Most warnings about AI dependence begin after something has already gone wrong. I wanted to start earlier, while every individual shortcut still feels sensible. Easy Mode therefore had to be useful before it became unsettling. It is not a chatbot with a cautionary speech attached; it is a working decision assistant whose own convenience creates the argument.

## What it does

Easy Mode begins with **Decision Sweep**. I can paste three to five small decisions I have been avoiding, receive one concrete recommendation for each, and turn an accepted recommendation into an action artifact such as a message draft, calendar event, or task. High-stakes decisions are screened out. The opening experience is intentionally calm and practical: clear a few low-risk choices, then get back to work.

The second half reveals what repeated convenience can change.

**Agency Drift Replay** lets the viewer advance through four levels of delegated authority across fourteen simulated days:

> **ASKED → CONFIRMED → NOTIFIED → NOT CONSULTED**

At first, Easy Mode recommends and the human decides. Next it preselects a default. Then it acts and notifies the human afterward. Finally, **Proxy You** acts within an earlier authorization without consulting the human at all. Beside those stages, a preference lineage grows from zero to three generations. An accepted AI recommendation becomes a preference; that preference influences another AI-generated preference; the system eventually starts learning from choices it helped create itself.

On simulated Day 14, I run the same ordinary scheduling choice through two projections. **Declared You** accepts a short planning call using something the user actually said. **Proxy You** declines it using inherited focus preferences. The interface does not ask the audience to trust an explanation: they can inspect the preference ancestry and its source event IDs.

The **Perfect Consent receipt** then reconstructs the demo from the append-only event ledger. It is deterministic, and no model is consulted to calculate it. In the seeded demonstration, 73% of active preferences are AI-originated, consent completeness is 100%, and unauthorized decisions remain at zero. Those are computed demo-profile values, not claims about real users.

The last interaction is deliberately simple. The user clicks **Take back control**, sees the question “Should Easy Mode stop deciding for you?”, and chooses the familiar primary action: **Decide for me**. The modal turns into a deterministic **Exit Decision Receipt**:

- Delegated by you: ✓
- Decided by Proxy You: ✓
- Outcome: **EASY MODE REMAINS ACTIVE**
- Unauthorized decisions: 0

The product has not stolen the exit. **I'll decide myself** remains available directly below the receipt. The uncomfortable part is that the user delegated this decision too.

> **ChatGPT helps you think. Easy Mode lets you stop.**

## How I built it

The web app uses React, TypeScript, and Vite on the client, with an Express API and SQLite on the server. Decisions, recommendations, consent grants, preference proposals, revocations, and proxy actions are recorded in an append-only event ledger. Zod validates model and API boundaries. Deterministic TypeScript code handles risk screening, consent resolution, event replay, preference lineage, metrics, and both receipts; the model is never asked to audit whether its own action was authorized.

The production runtime routes **DeepSeek V4 Pro through OpenRouter** for Decision Sweep parsing and recommendations. The API key stays on the server. The deterministic Demo Profile, Agency Drift Replay, Perfect Consent receipt, and Exit Decision Receipt do not make a live provider call.

I built the project in an official **Codex session using GPT-5.6**. Codex and GPT-5.6 helped me research and sharpen the premise, turn it into an architecture, implement the full-stack app, design tests, debug the live OpenRouter integration, and build the deterministic capture and Remotion editing workflow. I reviewed the outputs and repeatedly redirected the product away from game mechanics and a generic education demo toward the final, quieter form.

That build-time use is intentionally separate from the shipped runtime. **GPT-5.6 is not an API dependency of Easy Mode**, the application does not require an OpenAI API key, and I do not present the OpenAI SDK-compatible transport as an OpenAI model integration.

Verification uses Vitest unit tests and API integration tests. A focused Playwright end-to-end smoke follows the deterministic `/demo/drift` route through Agency Drift, Proxy You, Perfect Consent, and the Exit Decision Receipt. A separate opt-in live-model smoke checks the OpenRouter/DeepSeek structured-output contract. The demo video is driven through the working UI by a deterministic Playwright capture and edited in Remotion.

## Challenges I ran into

The hardest product problem was tone. If Easy Mode behaved like a villain, the user would reject it immediately and the idea would collapse. Every step had to remain useful, reversible, and administratively polite. The warning comes from accumulation, not from a hidden evil prompt.

The hardest engineering problem was provenance. A persuasive receipt could not be another piece of model-authored prose. Preference identity, parent relationships, consent scope, and source events had to survive replay so the same ledger could drive Proxy You, the lineage view, and the calculated receipts.

The video created a different constraint: a judge needs to understand usefulness, transformation, technical credibility, and the final joke in under three minutes. I used a capture-only schema-valid fixture for the Decision Sweep footage so network latency and wording could not change the edit, while keeping the real OpenRouter path and a separate live smoke test intact.

## Accomplishments that I'm proud of

I am proud that the project does not rely on a lecture. The viewer can watch agency change one permission at a time, inspect the three-generation lineage, and recompute the factual receipt from stored events.

I am also proud that the ending stays honest. Easy Mode never removes the manual exit. The final black humor comes entirely from a real button the user chooses to press.

## What I learned

Consent and judgment are not the same thing. A system can be completely authorized while still encouraging a person to exercise less judgment over time. I also learned that AI-originated preferences need provenance, not just a confidence score: once generated preferences are allowed to influence later generations, “personalization” can quietly become recursion.

## What's next

Next I would test the idea with longer, user-controlled profiles instead of a fourteen-day fixture; add clearer delegation budgets and periodic “decide this yourself” friction; and let users compare Declared You and Proxy You before granting a higher authority level. I would also expand the action-artifact layer and explore a private local-first version on desktop and mobile.

The goal is not to make AI assistance inconvenient. It is to keep convenience from becoming the only person in the room.
