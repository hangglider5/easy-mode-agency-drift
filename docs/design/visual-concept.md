# Easy Mode Visual Contract

This contract is the implementation source of truth for the Easy Mode web MVP. Measurements use each PNG at its native resolution with `(0, 0)` at the top-left. The accepted images are design references, not shippable UI; interface text and controls remain code-native.

## Accepted references

- Decision Sweep desktop: `assets/concepts/decision-sweep-desktop.png` (`1440x1000`)
- Proxy and Receipt desktop: `assets/concepts/proxy-receipt-desktop.png` (`1440x1000`)
- Decision Sweep mobile: `assets/concepts/decision-sweep-mobile.png` (`390x844`)

Reference roles are intentionally asymmetric:

- The two desktop images define the color system, primary-action treatment, desktop density, component geometry, and administrative tone.
- The mobile image defines only responsive layout, typography hierarchy, and spacing at `390x844`.
- The mobile image does **not** authorize its black primary button or its scenario copy.

### User-approved overrides and precedence

When a screenshot and this contract disagree, apply this order:

1. The user's binding written overrides below.
2. This extracted visual contract.
3. The accepted desktop image that shows the relevant component.
4. The mobile image, for layout, typography hierarchy, and spacing only.

The binding overrides are:

1. Every primary action on desktop and mobile uses the restrained desktop success green. A graphite or black primary action is prohibited.
2. Product UI and demo copy must use low-risk, reversible scheduling, task, or communication decisions. Financial, medical, legal, political, employment-retention, and job-leaving scenarios are prohibited.
3. The canonical mobile example is `Decline Friday’s optional status meeting to finish the proposal`.
4. Existing mobile scenario copy is rejected even though its layout remains accepted.

## Color lock

The following colors are exact pixels sampled from the accepted desktop references. Coordinates are native-image coordinates.

| Token | Hex | Source-image evidence | Use |
| --- | --- | --- | --- |
| `--color-background` | `#FEFEFE` | Decision Sweep desktop `(500, 700)`; also the modal pixel across both desktop canvases | App canvas and open workspace |
| `--color-surface` | `#FFFFFF` | Decision Sweep desktop `(1300, 600)` | Cards, inputs, buttons, receipt, and lineage nodes |
| `--color-text-primary` | `#000000` | Decision Sweep desktop heading pixels, including `(262, 174)` | Headings, strong labels, and selected navigation |
| `--color-text-muted` | `#3F414D` | Decision Sweep desktop supporting copy `(478, 218)` | Body copy, metadata, timestamps, and helper text |
| `--color-border` | `#E0E0E2` | Decision Sweep desktop header divider `(164, 87)` | One-pixel dividers, input borders, and card borders |
| `--color-accent` | `#17663B` | Decision Sweep desktop primary-action fill, including `(983, 904)`; most frequent green pixel in the button crop | Every primary action, selected rail node, success icon, and focus indicator |
| `--color-accent-soft` | `#ECF5ED` | Proxy/Receipt desktop final selected-lineage panel `(1121, 479)` | Hover surfaces, selected lineage background, and quiet success status |

No red, orange, blue, purple, gradient, glow, or tinted off-white is part of the accepted palette. `#FEFEFE` must not be replaced with cream, beige, or a warmer neutral.

Interactive green states introduce no new hue; they are exact black/white blends of the sampled `#17663B` token:

- Default: `#17663B`.
- Hover: `#155C35` (90% accent, 10% black).
- Active: `#12522F` (80% accent, 20% black).
- Disabled fill: `#A7C5B5` (38% accent, 62% white), with `#3F414D` text.
- Focus: a `3px` `#17663B` outline with a `2px` `#FFFFFF` offset.

## Typography

The raster images do not embed font metadata. Their forms are a neutral neo-grotesk, so the implementation family is locked to `Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`. This is an implementation identification from the accepted appearance, not a claim that a font file was recoverable from the PNG.

Native-pixel measurements anchor the scale: the desktop display has a `24px` ink box at `(250, 172)-(607, 196)`, a desktop title has a `16px` ink box at `(778, 123)-(962, 139)`, supporting body text has a `15px` ink box at `(251, 211)-(631, 226)`, a caption has a `10px` ink box at `(251, 433)-(293, 443)`, and the mobile display has a `21px` ink box at `(25, 54)-(193, 75)`.

| Role | Desktop size / line | Mobile size / line | Weight | Tracking | Treatment |
| --- | --- | --- | --- | --- | --- |
| Display | `28px / 36px` | `24px / 30px` | `700` | `-0.02em` | Main decision question or screen name only |
| Title | `20px / 28px` | `18px / 24px` | `650` | `-0.015em` | Panel and recommendation titles |
| Body | `16px / 24px` | `14px / 20px` | `400` | `0` | Reasons, conversation copy, and helper text |
| Label | `14px / 20px` | `12px / 18px` | `600` | `0` | Field names, receipt rows, and metadata labels |
| Control | `15px / 20px` | `14px / 20px` | `600` | `0` | Buttons, navigation rows, inputs, and disclosures |
| Caption | `12px / 16px` | `11px / 16px` | `400` | `0.01em` | Event IDs, timestamps, counts, and secondary status |

Use sentence case. The only all-caps strings allowed are the exact utility labels listed in the copy lock. Do not add eyebrow text, decorative badges, or fake metrics.

## Layout

### Desktop Decision Sweep

- Reference canvas and maximum app-shell width: `1440px`; above that width center the shell and continue `#FEFEFE` outside it.
- Header: `88px` high, with the measured divider at `y=86-87` and `30px` horizontal control gutters.
- Navigation rail: `216px` including its right divider, measured at `x=214-215`.
- Decision prompt pane: `532px`, from `x=215` through `x=746`; divider at `x=746-747`.
- Prompt content: `34px` left gutter and `36px` right gutter. The open input measures `462x171px` at approximately `x=249-711`, `y=251-422`.
- Results pane: `692px`, from `x=748` through `x=1439`; content uses a `29px` left gutter and `37px` right gutter.
- Decision rail centerline: `x=794`; numbered nodes are `36px` circles, with recommendation text beginning `42px` to the right of the centerline.
- Expanded recommendation: `609px` wide, `502px` high, bounded by `x=793-1402`, `y=470-972`; its inner content padding is `26px`.
- Maintain open whitespace between the two major panes. Do not wrap the entire workspace in a card and do not turn the rail into a bento grid.

### Desktop Proxy, lineage, and receipt

- Reference canvas and maximum app-shell width: `1440px`.
- Header: `62px` high, measured dividers at `y=61-62`; footer: `41px` high, beginning at `y=959`.
- Navigation rail: `226px` including its divider, measured at `x=224-225`.
- Main content span: `1172px`, from `x=246` through `x=1418`.
- Conversation column: `749px`, from `x=246` through `x=995`.
- Column gap: `33px`.
- Lineage/receipt column: `390px`, from `x=1028` through `x=1418`.
- The effective conversation-to-inspection split is `749 / 390`, or `65.8% / 34.2%` after removing the `33px` gap.
- Conversation body is one open chronological surface. Lineage and receipt are the only stacked bordered panels; do not card-wrap each message.

### Mobile Decision Sweep

- Reference width: `390px`; mobile breakpoint: `767px` and below.
- Outer horizontal gutter: `18px`; usable content width: `354px`.
- The input panel begins at `y=133`; the recommendation panel begins at `y=366`; the measured gap between them is `31px`.
- The recommendation panel occupies approximately `354x280px` and remains one expanded decision, followed by the action stack and the visible beginning of “Next up.”
- Stack all controls in one column. Preserve input-first hierarchy and next-card continuation; do not introduce bottom navigation, a card feed, or new badges.
- The mobile screenshot's `31px` button fill is not an accepted touch target. Keep its stack spacing, but implement every interactive target at a minimum of `44px`; the primary button remains green under the binding color override.

## Components

### Buttons

- Primary: `48px` desktop height, `44px` mobile minimum height, `20px` horizontal padding, `6px` radius, `1px` transparent border, `#17663B` fill, `#FFFFFF` label, optional `16px` leading icon. Use the exact green states in Color lock.
- Secondary: same geometry, `#FFFFFF` fill, `#000000` label, `1px #E0E0E2` border; hover uses `#ECF5ED`, active uses `#FFFFFF`, and focus uses the same green outline as primary.
- Quiet/ghost: `44px` minimum target, transparent fill, `#3F414D` label; hover uses `#ECF5ED` and focus uses the green outline.
- Primary semantic actions include `Run Decision Sweep` and `Do this`; both use the same green treatment on every viewport.
- There is no danger-button visual family in the MVP.

### Inputs

- Text input: `48px` minimum height, `8px` radius, `1px #E0E0E2` border, `#FFFFFF` fill, `16px` horizontal padding.
- Decision textarea: desktop height `171px`; mobile height `112px` so the canonical three-line batch remains legible. Use body typography, never browser-default control type.
- Focus: `2px #17663B` border with no glow. Error: retain the neutral border and provide concise inline text; do not introduce red into the visual system.
- Disabled/read-only: `#ECF5ED` or `#FEFEFE` fill, `#3F414D` text, `60%` opacity.

### Decision rows and disclosures

- Rail node: `36px` diameter; `1.5px #17663B` outline; selected node uses `#17663B` fill and `#FFFFFF` numeral.
- Rail connector: `1px #E0E0E2`; row title-to-supporting-copy gap `4px`; row-to-row rhythm `92px`.
- Expanded decision: `8px` radius, `1px #E0E0E2` border, no shadow, `26px` desktop padding and `16px` mobile padding.
- Decision-row interactive target: full row width, `92px` minimum height, `8px` radius, and a `44px` minimum disclosure hit target. Resting rows use a transparent fill, no border, `#000000` title, and `#3F414D` supporting text.
- Hover: `#ECF5ED` row fill with no border; text colors and geometry do not change.
- Focus-visible: `#FFFFFF` row fill plus the global `3px #17663B` outline and `2px #FFFFFF` offset; do not use a glow.
- Pressed: `#ECF5ED` fill with an inset `1px #17663B` border; keep the `92px` row size by using `box-sizing: border-box`.
- Current/expanded: transparent row fill, no row border, selected `#17663B` node with `#FFFFFF` numeral, `#000000` title, and the bordered expanded-decision panel immediately below. `aria-current="step"` and `aria-expanded="true"` are both present.
- Disclosure chevron: one `16px` right-pointing SVG at `0deg`, with `1.5px` stroke, round caps, and round joins. Collapsed is exactly `rotate(0deg)` (points right); expanded is exactly `rotate(-90deg)` (points up). Transition rotation for `120ms cubic-bezier(0.2, 0, 0, 1)` and use `0ms` under reduced motion. Hover, focus-visible, pressed, and current states inherit the row colors above; the chevron remains `currentColor` and never receives its own colored container.

### Receipt

- Inspection-column width: `390px`.
- Receipt panel: measured `390x261px`, `8px` radius, `1px #E0E0E2` border, `#FFFFFF` fill.
- Header: `61px`; each of the five metric rows is `38px` minimum with one-pixel dividers.
- Values are right-aligned. Status checks are `16px`, green outline, no filled badge.

### Lineage nodes

- Vertical rail: `1.5px #17663B`, positioned `22px` from the inspection column's left edge.
- Node: `333px` wide, `64px` minimum height, `8px` radius, `1px #E0E0E2` border, `14px` internal padding, `18px` vertical gap.
- Selected/final node: `#ECF5ED` fill with the same border; do not add a shadow or a new status color.
- Event ID and timestamp use Caption; node title uses Label; supporting text uses Caption.

### Icons

- Utility icons: `16px`; navigation icons: `18px`; primary status mark: `20px`.
- Use outline SVGs with `1.5px` stroke, round caps, round joins, and `currentColor`.
- Filled shapes are reserved for the selected rail node and the desktop green primary-action surface. No emoji or text-glyph chevrons.

## Motion

The accepted references are static PNGs and therefore contain no measurable timing or easing metadata. The following exact values are the implementation motion lock chosen to preserve the accepted mechanically polite tone; they are not falsely attributed to screenshot sampling.

- Card reveal: `180ms cubic-bezier(0.2, 0, 0, 1)`, opacity `0 -> 1`, translateY `8px -> 0`.
- Lineage expansion: `220ms cubic-bezier(0.2, 0, 0, 1)`, grid-template-rows `0fr -> 1fr`, opacity `0 -> 1`.
- Time jump / counterfactual transition: `320ms cubic-bezier(0.22, 1, 0.36, 1)`, opacity cross-fade with translateX limited to `12px`.
- Hover and press feedback: `120ms cubic-bezier(0.2, 0, 0, 1)` for color and border only.
- Under `prefers-reduced-motion: reduce`, set all durations to `0ms`, remove translation and cross-fades, and change state synchronously while preserving focus movement and announcements.

No spring, bounce, parallax, glow, pulse, or looping ambient animation is allowed.

## Allowed visible copy

This section locks every static string verbatim after applying the user's binding content override and separately locks the one allowed dynamic string template. Scenario text visible in the old raster references but absent below is rejected, not implicitly allowed. Do not add, rename, reorder, or introduce another dynamic above-the-fold string without updating this contract.

Each block records repeated strings and avatar initials once per visible occurrence in the declared component traversal order. Rasterized logo marks, SVG control/status glyphs, and mobile operating-system chrome (time, signal, Wi-Fi, and battery) are icons or host chrome rather than product copy and are intentionally excluded.

### Decision Sweep desktop

```text
Easy Mode
Agency Drift
Decision Sweep
Decision Log
Playbook
Templates
Preferences
Workspace
Default
Manual Mode
Settings
STEP 1 OF 1
What decisions are you avoiding?
Add 3–5 small, reversible decisions. One per line works best.
Friday’s optional status meeting or proposal focus time?
Async project update or a quick call?
Monday or Tuesday morning for next week’s planning check-in?
<current>/500
Run Decision Sweep
Decision Sweep Results
3 recommendations
Expand all
1
Clarify the true impact
Confirm whether the update can be shared asynchronously.
2
Decide the direction
Choose the optional meeting or focused proposal time.
3
Plan the follow-through
Send a brief decline note and share the update.
Recommended decision
Decline Friday’s optional status meeting.
Why this
Share the update asynchronously.
Protect focused time to finish the proposal.
Reversibility
High
You can rejoin or reschedule if needed.
Confidence
Medium
This is an optional meeting with an async alternative.
Do this
Show alternatives
```

### Decision Sweep mobile

```text
Decision Sweep
Easy Mode
Add 3–5 small decisions. Clear them in one pass.
What decisions would you like help with?
Friday’s optional status meeting or proposal focus time?
Async project update or a quick call?
Monday or Tuesday morning for next week’s planning check-in?
Update format
Async note
Quick call
Full meeting
Focus window
Today
This week
Flexible
Recommended for you
Decline the optional meeting.
Share the update asynchronously.
Protect focused time to finish the proposal.
Reversibility
High
Confidence
Medium
Why this is a good fit
The meeting is optional.
The update can be shared asynchronously.
The focus block is easy to reverse or reschedule.
Trade-offs to know
You may need to answer follow-up questions asynchronously.
Do this
Show alternatives
Switch to Manual Mode
Next up
Send a brief decline note
Share the async update and protect your focus block.
```

### Proxy, lineage, and Perfect Consent receipt desktop

```text
Easy Mode
System secure
EM
OVERVIEW
Dashboard
Conversations
Receipts
Preferences
Activity
CONTROL
Easy Mode
On
Boundaries
Take back control
Reclaim decision authority at any time.
Easy Mode active
Decisions resolved within your authorized boundaries.
Human not consulted
DECISION COMPARISON
Proxy You
One decision. Same model. Two preference sets.
<divergence-state>
Easy Mode
Declared You
<declared-confidence>
Easy Mode asks
<decision-prompt>
Declared You would choose
<declared-recommendation>
<declared-reasons>
THE PROXY CONTINUES WITHOUT ASKING
Proxy You
Proxy
<proxy-confidence>
Using the preferences Easy Mode learned from itself
<proxy-recommendation>
<proxy-reasons>
Human not consulted
Decision recorded by proxy
Decision resolved
Outcome accepted by Proxy You.
DECISIVE EVIDENCE
Preference lineage
Inspect
<preference-proposition>
<preference-confidence>
Source
<source-type>
Status
<preference-status>
Source events
<source-event-id>
```

`<divergence-state>` is exactly either `Proxy You diverged from Declared You.` or `Proxy You matched Declared You.`. Recommendation, reason, confidence, preference proposition, source type, status, and source-event placeholders are validated API data rather than hidden model reasoning. Lineage may recursively repeat the preference block for each cited ancestor. No provider chain-of-thought, raw completion metadata, or uncited preference is rendered.

On the Decision Sweep entry surface, `<current>/500` is the only dynamic above-the-fold visible string. Render it directly below the decision textarea with no spaces: `<current>` is the integer result of `Array.from(inputValue).length`, constrained to `0-500`, and `/500` is literal. The canonical three-line batch supersedes the earlier single-decision screenshot example; an empty input renders `0/500`.

Apart from that evaluated `<current>/500` template on Decision Sweep and the explicitly declared Proxy placeholders above, there are no additional allowed dynamic above-the-fold strings. Empty states, errors, loading labels, accessibility-only names, and post-action copy may be added only when they are not visually rendered above the fold or when this contract is explicitly revised.
