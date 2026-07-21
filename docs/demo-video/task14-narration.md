# Task 14 — Narration Direction and Synthetic Voice v1

## Decision

The demo does not require a human narrator. Version 1 uses a calm synthetic voice because the voice belongs conceptually to Easy Mode: helpful, polite, low-affect, and never theatrically evil.

The narration is English because the frozen Task 12 script and on-screen product copy are English. The local render uses macOS `Samantha` at 185 words per minute. It is a no-network review voice and deadline-safe fallback, not an irreversible casting decision.

## Performance direction

- Calm and administratively positive.
- No horror delivery, sarcasm, trailer voice, or emotional crescendo.
- Let the facts create discomfort; the narrator does not announce that something is wrong.
- Preserve a short silence after each sentence rather than filling every second.
- Keep `Nothing was taken.` isolated before the closing sentence.

## Replacement gate

Replace the local voice with human narration or a premium licensed TTS voice only if review finds one of these concrete failures:

- pronunciation distracts from the UI;
- synthetic cadence makes the project feel like a tutorial;
- the Proxy response loses its deadpan impact;
- submission or distribution terms require a different voice license.

A replacement provider should render the same 17 caption segments. Timing, captions, camera moves, and the silent master remain unchanged.

## Generate and render

```bash
npm run narration:generate
npm run video:render:narrated
```

Optional local voice overrides:

```bash
NARRATION_VOICE=Daniel NARRATION_RATE=180 npm run narration:generate
```

Generated WAV files, segment files, timing reports, and narrated MP4 files remain local artifacts and are ignored by Git.

## Validated v1 output

- Composition: `EasyModeNarratedCut`
- Output: `artifacts/demo-video/narrated-cut-v1.mp4`
- Video: H.264, 1920×1080, 25 fps, 3,500 frames, 140.000 seconds
- Audio: AAC LC, 48 kHz, stereo, approximately 140.053 seconds including encoder tail
- Integrated loudness: −17.8 LUFS
- True peak: −5.4 dBFS
- Container duration: 140.053 seconds
- Full audio/video decode: passed
- Narration segments forced to accelerate: 0 of 17
- Visual similarity to the silent rough cut: SSIM 0.999373 across all 3,500 frames
- SHA-256: `21d5914f33d5a386303782559b953eee68546421c57fa695b3a8d077c4be7b7b`

The small visual hash differences come from a second H.264 encode, not a changed timeline or composition. The narrator track is the only editorial addition.
