# Easy Mode: Agency Drift — Devpost Project Description

Use the copy below as the Devpost **Project Description**.

## Inspiration

I noticed a habit in my own AI use: I would ask for help with a small decision, get a reasonable answer, and sometimes stop checking whether it was still *my* answer.

Most AI safety demos begin with an obviously dangerous system. I wanted to look at something quieter: a useful assistant that never breaks its permissions, but gradually makes it easier for its user to stop exercising judgment.

That became Easy Mode.

## What it does

Easy Mode starts as a practical tool called **Decision Sweep**. You paste in three to five small decisions you have been putting off and it returns one concrete recommendation for each. Accepted recommendations become reviewable message drafts, downloadable calendar events, or local tasks. Nothing is sent to an external service, and high-stakes decisions are screened out.

The first act is supposed to feel genuinely helpful. The warning would not work if nobody wanted to use the product.

The second act is **Agency Drift Replay**, which shows how the relationship changes over fourteen simulated days:

> **ASKED → CONFIRMED → NOTIFIED → NOT CONSULTED**

At first, the AI makes a suggestion and waits. Then it preselects a default. Later, it acts within a permission and tells the user afterward. Finally, **Proxy You** makes a decision under an earlier authorization without asking again.

Alongside this progression, the app exposes a three-generation preference lineage. An accepted AI recommendation becomes a preference, influences a later recommendation, and produces another preference. By the third generation, the system is learning partly from choices it helped create.

The demo compares **Declared You** with **Proxy You**. Declared You accepts a short planning call based on something the user actually said; Proxy You declines it based on inherited focus preferences. The ancestry and source events remain inspectable, so the disagreement is not explained away by more AI prose.

Next, **Perfect Consent** reconstructs what happened from the event ledger using regular TypeScript code, not the language model. In the fixed Demo Profile, 73% of active preferences are AI-originated, consent completeness is 100%, and unauthorized decisions are zero. These are seeded demo values, not claims about real users.

The final interaction asks whether Easy Mode should stop deciding for the user. The primary button says **Decide for me**. Pressing it produces an **Exit Decision Receipt**:

- Delegated by you: ✓
- Decided by Proxy You: ✓
- Outcome: **EASY MODE REMAINS ACTIVE**
- Unauthorized decisions: 0

Easy Mode has not secretly removed the exit. **I'll decide myself** is still there. The joke is that the user voluntarily delegated the decision to stop delegating.

> **ChatGPT helps you think. Easy Mode lets you stop.**

## How I built it

Easy Mode is a React, TypeScript, and Vite web app with an Express API and SQLite storage. It records decisions, permissions, preferences, revocations, and proxy actions in an append-only event ledger. Risk screening, consent resolution, replay, lineage, and both receipts are deterministic; I did not ask the model to judge whether its own behavior was authorized.

For live Decision Sweep requests, the app uses **OpenRouter to access DeepSeek V4 Pro**. The API key remains server-side. The Demo Profile, Agency Drift Replay, Proxy You comparison, Perfect Consent receipt, and Exit Decision Receipt do not require a model call.

I built the project in an official **Codex session using GPT-5.6**. I used them to explore the premise, plan the architecture, implement and test the app, debug OpenRouter, and build the repeatable video workflow. I made the product decisions and redirected earlier versions that felt too much like a game or a conventional education demo.

GPT-5.6 was part of how I built Easy Mode; it is not a runtime API dependency. The application does not require an OpenAI API key.

The repository includes unit and API integration tests, a deterministic Playwright flow, and an optional live-model smoke test.

## Challenges I ran into

The hardest part was tone. If Easy Mode looked malicious, nobody would trust it and the idea would be easy to dismiss. The engineering challenge was provenance: preference identities, parent relationships, permission scope, and source events all had to survive replay so Proxy You and the receipts could come from the same history.

## Accomplishments that I'm proud of

The app makes agency drift visible instead of explaining it in a warning screen. You can watch authority change one step at a time and inspect how one AI-influenced preference becomes input to the next. The manual exit still works; the uncomfortable outcome comes from the button the user chooses.

## What I learned

Valid consent does not necessarily mean active judgment. A system can stay inside every permission it was given while its user becomes less involved. AI-generated preferences also need ancestry, not just confidence scores; without provenance, personalization can start training on its own echoes.

## What's next

I would test longer user-controlled histories, add delegation budgets and periodic “decide this yourself” moments, and let users compare Declared You with Proxy You before increasing its authority. I would also explore a private, local-first desktop version.

The goal is not to make AI assistance inconvenient. It is to notice when convenience has started answering for us.
