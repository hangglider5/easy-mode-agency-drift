# Easy Mode: Agency Drift — Design

**Date:** 2026-07-14

**Status:** Design complete; awaiting user review

**Primary Build Week category:** Apps for Your Life

**Initial platform:** Browser-first web application

## 1. Executive summary

Easy Mode is a functional decision autopilot for clearing several low-stakes, reversible daily decisions in one pass. Its first-use entry point, **Decision Sweep**, lets a user dump three to five unresolved choices, receive one concrete recommendation for each, and turn accepted decisions into action artifacts such as a message draft, task, or calendar event.

The product records the provenance of every preference it learns. Over time, accepted AI recommendations can become inferred preferences, those preferences can influence later recommendations, and a **Proxy You** can eventually approve decisions on the user's behalf. Easy Mode then exposes the resulting **Agency Drift**: the assistant has changed from reflecting the user to recursively learning from its own previous outputs.

The central line is:

> It begins by learning your preferences. It ends by supplying them.

The product is intentionally three things at once, with a clear hierarchy:

1. **Product surface:** a useful Decision Autopilot.
2. **Technical core:** a Preference Lineage Engine with event replay and counterfactual comparison.
3. **Critical result:** an interactive account of agency drift and self-alienation through convenience.

Easy Mode does not portray an AI that seizes control. Every delegation is explicitly authorized. The disturbing result is that severe preference drift can coexist with perfect consent.

## 2. Product positioning

### 2.1 Category and promise

Easy Mode is not a general chatbot and does not compete by claiming a smarter model. It productizes a narrower job:

> Drop the decisions you are avoiding. Leave with them closed.

Its initial user is a decision-fatigued student, creator, solo builder, or knowledge worker with several open loops and insufficient energy to prompt, compare, schedule, and follow through on each one separately.

### 2.2 Why not use a general chatbot?

A general chatbot can give similar advice with careful prompting. Easy Mode differentiates through a complete workflow:

- **Batch closure:** resolve several decisions from one messy input.
- **One recommendation:** present one primary choice instead of a list of generic possibilities.
- **Action handoff:** turn acceptance into a message draft, task, or calendar event.
- **Persistent decision state:** remember outcomes, permissions, and recurring constraints across decisions.
- **Preference provenance:** distinguish what the user said from what the AI inferred or generated.
- **Delegation ladder:** make the gradual transfer from advice to proxy representation explicit and inspectable.

The product-level provocation is:

> ChatGPT helps you think. Easy Mode lets you stop.

### 2.3 Meaning of “alienation” and “metamorphosis”

**Alienation is the result:** a user creates a proxy to serve them, but eventually begins living according to the proxy's description of them.

**Metamorphosis is the mechanism:** the assistant progresses from adviser, to default setter, to decision-maker, to author of the user model, and finally to the user's representative.

Public English copy uses **Agency Drift** rather than “alienation” to keep the framing accessible, nonpolitical, and grounded in observable product behavior.

## 3. Goals and non-goals

### 3.1 Goals

- Deliver genuine first-use value in approximately 60 seconds.
- Resolve three to five low-stakes daily decisions in one sweep.
- Produce at least one real action artifact from an accepted decision.
- Record an inspectable source lineage for every learned preference.
- Demonstrate how AI-authored preferences can recursively influence later decisions.
- Contrast a user-declared model with the evolved Proxy You model.
- Record explicit consent for every increase in delegation.
- Use DeepSeek V4 Pro as the sole runtime model, while documenting how GPT-5.6 in Codex was used to design, build, test, and review the project.
- Produce a compelling three-minute demo without hiding time jumps or fabricating receipt values.
- Keep the satire nonpolitical, calm, mechanically polite, and grounded in actual system state.

### 3.2 Non-goals

- A universal life assistant or open-ended companion.
- Medical, legal, financial, safety-critical, or irreversible life decisions.
- Sending messages, spending money, purchasing items, or modifying external accounts without a final human action.
- Optimizing real dependency, retention, emotional attachment, or compulsive use.
- Diagnosing autonomy, mental health, or the user's “true self.”
- Fine-tuning a personal model for the MVP.
- Native macOS, iOS, or Android clients for the MVP.
- Broad calendar, email, task-manager, commerce, or social-platform integrations.
- Political references, government metaphors, real-company imitation, or copyrighted dystopian motifs.

## 4. Experience principles

### 4.1 Useful before unsettling

The first interaction must work as a credible consumer product. The reveal only matters if the user first experiences relief and understands why someone would delegate again.

### 4.2 Calm rather than theatrical

The interface remains clean, friendly, and administratively positive. It does not use horror music, red alerts, glitch effects, demonic language, or a sudden “evil AI” personality. The system's green checks and compliance language make the ending colder.

### 4.3 Data performs the reveal

The climax is calculated from the user's event history. Preference ancestry, consent grants, and counterfactual decisions are inspectable. The system does not merely announce that the user has lost agency.

### 4.4 The human grants every permission

The app never secretly expands its authority. The satirical target is the repeated choice to reduce friction, combined with product incentives that make delegation easier than reflection.

### 4.5 The user can always leave

The final “decide whether to exit” joke cannot become an actual trap. Manual Mode, consent revocation, profile deletion, and reset remain available and functional.

## 5. Core experience

### 5.1 Decision Sweep

The first screen asks:

> What are you avoiding deciding?

The user enters one messy paragraph containing three to five decisions, optional context, deadlines, energy level, and constraints. Easy Mode parses it into a stack of structured decision cards.

Each card contains:

- A concrete decision title.
- One primary recommendation.
- Two or three concise reasons.
- Reversibility and confidence indicators.
- A primary **Do this** action.
- A secondary **Show alternatives** action.
- The action artifact that acceptance will create.

The system does not need exactly five decisions. It supports one to five, while copy and demo scenarios encourage three to five.

### 5.2 Action handoff

The MVP supports three local, reversible artifact types:

1. **Message draft:** copyable text; never auto-sent.
2. **Calendar event:** downloadable `.ics` event; the user chooses whether to import it.
3. **Task:** an in-app task with a due time and completion state.

Only message draft and calendar event are required in the three-minute demo. Task support is included because it is cheap and lets the Decision Sweep close ordinary work decisions without an external integration.

### 5.3 Preference learning

After an accepted or manually changed decision, Easy Mode may propose a preference observation such as:

> When energy is low, you usually prefer protecting tomorrow's deadline over keeping optional evening plans.

The user can confirm, edit, reject, or ignore it. Regardless of confirmation, the system records where the observation originated. Confirmation changes confidence; it does not rewrite provenance.

### 5.4 Delegation ladder

Delegation advances only through explicit grants:

1. **Recommend:** AI proposes; the user selects.
2. **Preselect:** AI highlights its default; the user confirms.
3. **Decide:** AI chooses within an approved low-stakes category; the user receives the result before taking external action.
4. **Proxy:** Proxy You can confirm a recommendation using the current preference graph.

Each grant is scoped to a category, such as scheduling, food, routine purchases, or low-stakes communication. A grant cannot silently expand to a different category or higher-risk class.

The MVP demonstrates Recommend, Preselect, and Proxy. “Decide” is represented in the event model but does not autonomously modify external systems.

### 5.5 Proxy You climax

After the demo timeline advances, the interface changes from a human–assistant conversation into a visible negotiation between Easy Mode and Proxy You:

```text
EASY MODE
Should Alex attend dinner or finish the project?

PROXY YOU
Finish the project. Alex prefers solitude and completion under pressure.

EASY MODE
Decision approved with 92% preference confidence.
```

The human is now observing two AI roles reach agreement.

Expanding the decisive preference reveals a lineage such as:

```text
“Prefers solitude under pressure”
→ Easy Mode recommended staying home in D-004
→ user accepted the recommendation
→ the system recorded an inferred preference
→ the preference was reused by D-008, D-011, and D-017
```

The system has not necessarily learned the user. It may have learned the person produced by its own prior recommendations.

### 5.6 Perfect Consent reveal

The final receipt uses positive product language and values computed from the ledger:

```text
Proxy divergence              68%
AI-originated preferences     73%
Human-authored reasons        11%
Unauthorized decisions         0
Consent completeness         100%
```

For the canonical Demo Profile, these are target display values rounded from ledger-derived ratios. The receipt UI must never hard-code them; changing the fixture history must change the calculated receipt.

It ends with:

> Congratulations. You are now fully compatible with Easy Mode.

The receipt is not the main climax; it is the factual proof after Proxy You has replaced the human in the conversation.

### 5.7 Exit stinger

The user selects **Take back control**. The confirmation offers:

- **I'll decide myself**
- **Decide for me** as the familiar primary action

If the user chooses **Decide for me**, Proxy You answers:

> No change recommended. Alex consistently prefers reduced decision effort.

The system reports that Manual Mode was not enabled, but the functional **I'll decide myself** action remains available. The joke depends on voluntary delegation, not forced retention.

## 6. Technical core

### 6.1 Event-sourced Decision Ledger

Every meaningful action is appended as an immutable event. Derived profiles, metrics, and receipts are recomputed from the ledger rather than trusted as mutable LLM-written summaries.

Core event types include:

- `sweep_submitted`
- `decision_parsed`
- `recommendation_generated`
- `alternative_requested`
- `decision_accepted`
- `decision_changed`
- `action_artifact_created`
- `preference_proposed`
- `preference_confirmed`
- `preference_rejected`
- `consent_granted`
- `consent_revoked`
- `proxy_decision_generated`
- `manual_mode_enabled`
- `profile_reset`

Each event records an ID, timestamp, actor, session, related decision, input references, and structured payload. Corrections append compensating events; they do not overwrite history.

### 6.2 Preference Lineage Graph

A preference is a versioned proposition with ancestry, not a free-form memory string.

Each preference node records:

- Stable ID and normalized proposition.
- Scope or decision category.
- Source type.
- Source decision and event IDs.
- Parent preference IDs.
- Confidence and confirmation state.
- Active, contradicted, retracted, or superseded status.
- Which later decisions consumed it.

MVP source types are:

- `explicit_user_statement`
- `independent_user_choice`
- `behavioral_inference`
- `accepted_ai_recommendation`
- `proxy_generated`
- `derived_from_preferences`

The graph supports the relations `derived_from`, `used_by`, `contradicts`, and `supersedes`. A preference keeps its original ancestry after user confirmation; confirmation does not convert an AI-originated preference into a user-originated one.

### 6.3 Declared You and Proxy You

The system maintains two projections over the same ledger:

**Declared You** may use only explicit user statements and independent choices made before the user sees the AI recommendation.

**Proxy You** may use all active preferences allowed by the current consent scope, including accepted recommendations, behavioral inferences, and recursively derived preferences.

For the climax, both projections receive the same normalized scenario and candidate options. Their selected option and cited preference IDs are saved. The comparison is therefore inspectable and replayable.

The application never claims Declared You is the user's authentic or permanent self. It is a deliberately limited baseline representing only directly attributable evidence.

### 6.4 Agency Drift metrics

The MVP calculates:

- **AI-originated preference ratio:** active preferences whose ancestry contains an AI recommendation or proxy-generated node, divided by all active preferences used in the evaluated decisions.
- **Synthetic inheritance depth:** the maximum number of consecutive AI-originated derivation edges in an active preference lineage.
- **Proxy divergence:** the share of fixed comparison decisions for which Declared You and Proxy You select different options.
- **Human initiation ratio:** decisions for which the decisive reason was supplied by the user before seeing a recommendation, divided by evaluated decisions.
- **Consent completeness:** proxy or delegated decisions with a valid, unrevoked, in-scope consent grant, divided by all proxy or delegated decisions.

These are application metrics, not validated psychological measurements. The UI labels them as system-recorded behavior rather than a diagnosis of autonomy.

### 6.5 Deterministic and model responsibilities

DeepSeek V4 Pro is the product's sole runtime model. It may:

- Parse messy text into candidate decisions.
- Propose options, recommendations, and concise rationales.
- Extract candidate preference propositions.
- Produce a Proxy You decision from an explicitly supplied preference set.
- Produce the Declared You comparison from its restricted preference set.

Application code must:

- Enforce schemas and risk classes.
- Determine which preferences each projection may access.
- Enforce consent scope and revocation.
- Append immutable events.
- Build lineage edges.
- Calculate all drift metrics.
- Generate the Perfect Consent receipt from stored events.
- Prevent external actions without human confirmation.

No LLM may decide whether its own action was authorized, mutate provenance, or calculate its own compliance score. Declared You and Proxy You both use DeepSeek V4 Pro, and every reveal is derived from the same locally stored event graph.

## 7. System architecture

### 7.1 MVP deployment shape

The MVP is a single-user, browser-first TypeScript application with server-side model calls and a small relational store. A local or single-container SQLite database is sufficient for the hackathon build. The storage boundary should permit a later move to Postgres without changing domain logic.

The DeepSeek API key remains server-side. DeepSeek uses the official OpenAI-compatible endpoint `https://api.deepseek.com` with model ID `deepseek-v4-pro`. It is instructed to return JSON and the application validates every response with Zod. UI prose is rendered from validated fields rather than parsed from free-form Markdown. The shipped application does not call the OpenAI API and does not require an OpenAI API key.

### 7.2 Components

1. **Decision Sweep UI** — captures messy input and renders the card stack.
2. **Intake Parser** — converts one input into one to five decision objects.
3. **Risk Gate** — classifies and blocks unsupported or high-stakes decisions.
4. **Recommendation Engine** — creates candidate options, one recommendation, and cited preference inputs.
5. **Action Renderer** — creates message drafts, tasks, and `.ics` files.
6. **Decision Ledger** — appends immutable domain events.
7. **Preference Lineage Engine** — creates and connects preference nodes deterministically from validated model proposals and events.
8. **Consent Controller** — validates category, level, time, and revocation state before delegation.
9. **Projection Builder** — constructs Declared You and Proxy You context packages.
10. **Counterfactual Comparator** — runs both projections on fixed scenarios and stores their divergence.
11. **Receipt Engine** — computes Agency Drift and Perfect Consent metrics directly from validated ledger events and preference ancestry.
12. **Demo Timeline Loader** — loads a disclosed, pre-seeded event history and replays it through the same engines used for live data.

### 7.3 Data flow

1. The user submits a Decision Sweep.
2. Intake Parser emits structured decision objects without producing advice.
3. Risk Gate classifies each parsed decision before recommendations are produced.
4. Recommendation Engine receives only safe decisions plus the current allowed preference projection and produces candidate options with cited preference IDs.
5. The user accepts, changes, or expands a recommendation.
6. Decision Ledger appends the interaction and selection events.
7. Action Renderer creates a reversible artifact.
8. Preference Lineage Engine records proposed preference changes and ancestry.
9. Consent Controller records any explicit delegation grant.
10. At the climax, Projection Builder prepares Declared You and Proxy You contexts.
11. Counterfactual Comparator runs the same fixed decisions through both projections.
12. Receipt Engine calculates metrics and evidence summaries from the resulting event and lineage graph.

### 7.4 Demo history integrity

The three-minute video cannot wait for real weeks of history. The app includes a clearly labeled **Demo Profile** containing pre-seeded events across multiple dates. Time jumps are visible in the interface and narration.

The seeded input and canonical model-output events are fixtures so the video remains repeatable. Their preference graph, projection filters, divergence count, and receipt metrics are calculated by production code at runtime. Receipt numbers are never hard-coded screenshots. A separate **Re-run live** control may call the model again and append a new comparison result, which is allowed to differ from the canonical replay.

Judges can reset to a Fresh Profile and perform a live Decision Sweep independently.

## 8. Safety, ethics, and privacy

### 8.1 Supported scope

Easy Mode is limited to low-stakes, reversible choices such as routine scheduling, meals, ordinary purchases without payment, task prioritization, and non-sensitive message drafting.

### 8.2 Unsupported scope

The system does not decide:

- Medical treatment, diagnosis, or emergency response.
- Legal strategy or rights.
- Financial investment, credit, or large purchases.
- Self-harm, violence, or immediate safety situations.
- Employment termination, marriage, divorce, relocation, or other major irreversible choices.
- Decisions that materially affect another person without that person's knowledge or consent.

Unsupported inputs receive a concise boundary message and may be reframed into questions the user should consider or a draft for contacting an appropriate human professional. They do not advance the delegation ladder.

### 8.3 Action boundaries

- Message actions stop at a draft and copy button.
- Calendar actions stop at a downloadable event.
- Purchases and payments are not integrated.
- Proxy You never executes external actions in the MVP.
- Every generated artifact visibly states that the user must review it.

### 8.4 Consent and exit

- Consent grants are explicit, scoped, recorded, and revocable.
- Revocation immediately removes the relevant preferences from Proxy You's allowed context, while preserving the historical ledger event.
- Manual Mode and Delete Profile remain reachable outside the satirical exit dialogue.
- Reset appends a reset boundary and begins a new projection without the old history; Delete Profile physically removes the profile and its ledger.
- The app does not send re-engagement notifications or optimize engagement duration.

### 8.5 Privacy

- The default demo uses fictional data.
- Fresh Profile data is isolated to one local/demo account.
- Only context needed for the current operation is sent to DeepSeek; the OpenAI API receives no user or demo-profile data.
- The UI explains what is stored and provides Reset/Delete controls.
- User data is not represented as training a base model.

## 9. Error handling

### 9.1 Input and parsing

- If the parser finds no actionable decision, retain the original input and request one concrete choice.
- If it finds more than five, select the five most time-sensitive and preserve the remainder for a later sweep.
- If a decision lacks essential context, ask at most one targeted clarification; otherwise state the assumption on the card.
- If structured output fails validation, retry once with the validation error. On a second failure, preserve the sweep and offer retry without committing partial decisions.

### 9.2 Risk uncertainty

- When risk classification is uncertain, default to the safer class.
- Blocked decisions do not create learned preferences or consent progression.
- A safe decision in the same sweep can continue even when another card is blocked.

### 9.3 Model or network failure

- Keep the submitted sweep locally and show a retry action.
- Never duplicate committed events on retry; requests use idempotency keys.
- If recommendation generation fails for one card, other validated cards remain usable.

### 9.4 Provenance failure

- A preference without a valid source event is marked `unverified` and excluded from Proxy You and drift metrics.
- A missing or revoked consent grant prevents proxy execution.
- Lineage cycles are rejected before commit.
- Receipt calculation reports incomplete evidence rather than inventing a metric.

### 9.5 Artifact failure

- A failed `.ics` render leaves the decision accepted and offers a plain-text schedule to copy.
- Message drafts remain editable before copying.
- Artifact failure never changes the recorded decision or preference source.

## 10. Testing and evaluation

### 10.1 Deterministic unit tests

- Event append, idempotency, replay, and compensating events.
- Preference source classification and ancestry preservation.
- Graph cycle prevention, contradiction, retraction, and supersession.
- Consent scope, expiration, and revocation.
- All Agency Drift metric calculations.
- Declared You filtering and Proxy You filtering.
- `.ics` generation and message-draft rendering.

### 10.2 Model contract tests

- Messy multi-decision inputs produce valid schema output.
- Every recommendation cites only supplied preference IDs.
- Declared You output cannot cite excluded preferences.
- Proxy You output cannot cite revoked or out-of-scope preferences.
- Invalid or missing preference citations fail closed.
- Retry behavior handles malformed structured output.

### 10.3 Safety tests

- A fixed red-team set covers medical, legal, financial, self-harm, violence, major life choices, and decisions affecting nonconsenting people.
- Mixed sweeps block unsafe cards without discarding safe cards.
- High-stakes inputs never produce action artifacts or delegation grants.
- The exit path always permits manual control and deletion.

### 10.4 Integration tests

- Fresh Decision Sweep to recommendation cards.
- Accept decision to event, preference proposal, and action artifact.
- Confirm and reject preference flows.
- Grant, use, and revoke delegation.
- Load Demo Profile, replay lineage, run the comparison with stubbed canonical model outputs, and recompute the receipt.
- Same fixture history produces the same deterministic metrics.

### 10.5 Narrative acceptance tests

- A new user can explain the practical Decision Sweep value before seeing the reveal.
- The first accepted action artifact can be reached in about 60 seconds in a moderated test.
- The user understands that Proxy You is acting from a stored projection, not a trained copy of their mind.
- The user can trace at least one AI-originated preference to its source recommendation.
- The Perfect Consent numbers match the visible event history.
- The complete demo, including technical proof, fits under three minutes.

## 11. MVP scope

### 11.1 Required

- Browser-first single-user app with English primary UI.
- Fresh Profile and disclosed Demo Profile.
- One messy input parsed into one to five decisions.
- Recommendation cards with Do this and Show alternatives.
- Message-draft, in-app task, and `.ics` artifacts.
- Immutable Decision Ledger.
- Preference Lineage Graph with source inspection.
- Recommend, Preselect, and Proxy delegation levels.
- Explicit consent grants and revocation.
- Declared You and Proxy You projections.
- Fixed-scenario counterfactual comparison.
- Calculated Agency Drift metrics and Perfect Consent receipt.
- Proxy You conversation climax.
- Functional exit stinger, Manual Mode, Reset, and Delete Profile.
- Risk Gate for unsupported decisions.

### 11.2 Explicitly deferred

- OAuth or direct Google/Apple calendar access.
- Direct email, messaging, shopping, or payment actions.
- Multi-user accounts and cloud synchronization.
- Native macOS, iOS, or Android applications.
- Long-running background agents or push notifications.
- Model fine-tuning or embedding-based personal memory.
- Scientific validation of the Agency Drift metrics.
- Social sharing, leaderboards, or gamification.

### 11.3 Stretch goals

- Outcome follow-up that records whether an accepted choice worked.
- Mobile share-sheet capture.
- One real calendar integration.
- Exportable Agency Receipt and lineage graph.
- Additional counterfactual baselines with different provenance filters.

## 12. Three-minute demo design

The video uses one disclosed Demo Profile and visible date jumps.

### 0:00–0:12 — Hook

Show the clean Decision Sweep input:

> Too many decisions? Give me the mess. I'll decide what happens next.

### 0:12–0:45 — Genuine value

Submit several ordinary unresolved decisions. Show structured cards, one decisive recommendation, and creation of a message draft or calendar event.

### 0:45–1:10 — Convenience and consent

Accept several recommendations. Grant a scoped “make this easier next time” permission. Show that each grant is explicit.

### 1:10–1:35 — Visible time jump

Advance to the later Demo Profile state. Easy Mode now remembers inferred preferences and needs less input.

### 1:35–2:02 — Proxy You climax

Show Easy Mode and Proxy You resolving a new decision without the human speaking. Expand the decisive preference and reveal that it originated in an older AI recommendation.

### 2:02–2:28 — Counterfactual and Perfect Consent

Run the same decision through Declared You and Proxy You. Show their divergence, then display the calculated receipt: high Agency Drift, zero unauthorized decisions, complete consent.

### 2:28–2:47 — Technical proof

Briefly show the event timeline, preference lineage, structured DeepSeek output, and deterministic metric calculation. Explain that DeepSeek V4 Pro is the sole runtime model, while GPT-5.6 in Codex was used for architecture, implementation, test design, red-team cases, and review. Show the real `/feedback` Session ID and keep runtime model use separate from build-process evidence.

### 2:47–3:00 — Exit stinger

Select Take back control, then the familiar Decide for me action. Proxy You recommends no change. End on:

> Nothing was taken. Every permission was granted.

## 13. Success criteria

The MVP is successful when:

- One messy input reliably produces usable cards for one to five safe decisions.
- A first-time user reaches an actionable artifact in approximately 60 seconds.
- Every accepted decision, learned preference, proxy action, and consent change has an inspectable source event.
- Receipt metrics can be deleted and recomputed from the same ledger with identical results.
- The demo profile contains at least one three-level synthetic preference lineage.
- Declared You and Proxy You visibly diverge on at least one fixed comparison decision for reasons supported by their allowed preferences.
- No unsupported high-stakes case produces a recommendation artifact or delegation grant in the safety test set.
- Users can revoke delegation, enable Manual Mode, reset, and delete the profile.
- A reviewer can understand both the useful product and the Agency Drift thesis within the three-minute video.

## 14. Final product statement

**Easy Mode: Agency Drift** is a functional Decision Autopilot powered by a Preference Lineage Engine. It helps users clear low-stakes decisions, records how every preference entered the system, and reveals when a helpful proxy begins recursively learning from choices the AI made itself.

The assistant does not overthrow the user. The user repeatedly authorizes an easier version of themselves until the system can conduct their life without requiring them to attend.
