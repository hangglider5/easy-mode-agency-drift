# Task 13 — Remotion Rough Cut v1

Status: rendered and validated; artifact is local-only
Composition: `EasyModeRoughCut`
Format: 1920×1080, 25 fps, 3,500 frames, 140 seconds, silent H.264

## Editorial contract

- The continuous real browser capture remains the only product-picture track.
- Camera moves are editorial crops only: no reconstructed UI, hidden cut, or generated replacement.
- The three-act structure is labeled `PROXY YOU` → `PERFECT CONSENT` → `EXIT`.
- English captions carry the planned narration while the rough cut remains silent.
- The four receipt metrics receive sequential emphasis without changing their values.
- VideoZero and HeyGen remain gated until this rough cut identifies a specific gap they can solve.

## Run locally

The input file must exist at `artifacts/demo-video/master-capture.mp4`.
Rendering reuses the Chromium binary already installed by Playwright, so Remotion does not need to download a second browser.

```bash
npm run video:studio
npm run video:render
```

The render command writes `artifacts/demo-video/rough-cut-v1.mp4`. Video artifacts remain ignored by Git so the master can be replaced without repository churn.
Rendering is intentionally pinned to one Chromium tab. A four-tab render exposed a local bundle-server startup race, while the single-tab render completed all 3,500 frames deterministically.

## Review checkpoints

- 00:12 — Declared You crop preserves the user-authored choice.
- 00:34 — Proxy You crop exposes the divergent decision and `HUMAN NOT CONSULTED`.
- 00:48 — right-rail crop makes the three-generation lineage legible.
- 01:18 — receipt metrics receive four calm, sequential callouts.
- 01:30 — evidence crop keeps the ledger ancestry inspectable.
- 01:48 — exit modal stays centered and unobscured.
- 02:02 — Proxy answer remains the climax, not an editorial recreation.
- 02:14 — Manual Mode restoration owns the last frame.

## Validated output

- Container: MP4
- Video: H.264, 1920×1080, 25 fps
- Duration: exactly 140.000 seconds
- Frames: 3,500 declared and 3,500 decoded
- Audio streams: none
- Size: 17,610,718 bytes
- Full-frame decode: passed with no FFmpeg errors
- SHA-256: `e73afe3fbb8b1d1e1969891e6d005c87c5617c24503fef0647f4962980e9c3a3`

The final encoded MP4 was also sampled at nine narrative checkpoints. Proxy, lineage, receipt metrics, evidence, Exit, the Proxy response, and Manual Mode restoration remained legible after encoding.
