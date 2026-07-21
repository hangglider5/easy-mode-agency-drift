# Task 15 — Demo Video v2 QA

## Deliverables

- Final cut: `artifacts/demo-video/task15-cut-v2.mp4`
- Master capture: `artifacts/demo-video/master-capture-v2.mp4`
- Narration: `artifacts/demo-video/narration-v2.wav`
- Script and captions: `task15-video-v2-script.md` and `task15-video-v2-captions.json`

The binary media files remain local and are ignored by Git.

## Media verification

- 1920×1080, H.264, 25 fps
- AAC stereo, 48 kHz
- 3,750 video frames / 150.00 seconds of picture
- MP4 container duration: 150.058667 seconds, including AAC tail padding
- Integrated narration loudness: -18.0 LUFS
- True peak: -4.8 dBFS
- Full FFmpeg decode completed without errors
- 33 contiguous captions cover 00:00–02:30; each contains 6–10 words

## Product verification

- `npm test`: 281 passed, 1 skipped
- `npm run typecheck`: passed
- `npm run build`: passed
- The master capture completed with zero page errors and zero console warnings.
- The recording uses a deterministic, schema-valid Decision Sweep fixture through the real client workflow. The production OpenRouter path remains separate and unchanged.
- Demo Profile, Agency Drift Replay, Proxy You, Perfect Consent, and Exit Decision Receipt are ledger-driven and model-free.

## Visual fidelity ledger

Compared against `assets/concepts/agency-drift-replay-desktop.png` and final 1920×1080 capture frames:

1. The four-stage horizontal rail and exact `ASKED → CONFIRMED → NOTIFIED → NOT CONSULTED` progression are preserved.
2. Preference lineage grows from zero to three visible generations and remains readable beside the decision evidence.
3. White, graphite, and restrained green remain the only semantic palette; drift surfaces contain no gradients or alarm colors.
4. The two-column hierarchy, event ledger control, slogan, and Proxy CTA match the concept.
5. Intentional deviations: the implementation uses the existing Easy Mode shell and real deterministic July 2026 ledger timestamps instead of the concept's invented dates.

## Editorial verification

- Decision Sweep appears before the satirical turn.
- Agency Drift Replay shows the transformation, not only its result.
- Only `73%`, `100%`, and `0` receive metric callouts.
- Codex + GPT-5.6 build usage and OpenRouter → DeepSeek V4 Pro runtime are explicitly separated in voice and graphics.
- The final cut never clicks `I'll decide myself`; the real manual exit remains visibly available.
- The final spoken and displayed line is: `ChatGPT helps you think. Easy Mode lets you stop.`
