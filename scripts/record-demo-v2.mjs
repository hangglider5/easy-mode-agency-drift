import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

const baseURL = process.env.DEMO_BASE_URL ?? "http://127.0.0.1:5173";
const artifactDir = resolve(process.env.DEMO_CAPTURE_DIR ?? "artifacts/demo-video");
const rawPath = resolve(artifactDir, "master-capture-v2.webm");
const masterPath = resolve(artifactDir, "master-capture-v2.mp4");
const reportPath = resolve(artifactDir, "master-capture-v2.report.json");
const captureDurationMs = 151_000;
const finalDurationSeconds = 150;

const ids = {
  sweep: "10000000-0000-4000-8000-000000000001",
  decisions: [
    "20000000-0000-4000-8000-000000000001",
    "20000000-0000-4000-8000-000000000002",
    "20000000-0000-4000-8000-000000000003",
  ],
  event: "30000000-0000-4000-8000-000000000001",
};

const sweepResponse = {
  sweepId: ids.sweep,
  cards: [
    {
      id: ids.decisions[0],
      title: "Optional status meeting or focus time?",
      status: "ready",
      recommendation: "Protect Friday afternoon for the proposal draft.",
      reasons: [
        "The meeting is optional and can be handled asynchronously.",
        "The focus block is easy to move if priorities change.",
      ],
      confidence: 0.91,
      reversibility: "high",
      usedPreferenceIds: [],
      alternatives: ["Join for the first ten minutes"],
      artifact: {
        kind: "calendar_event",
        title: "Proposal focus block",
        startsAt: "2026-07-24T13:00:00.000Z",
        endsAt: "2026-07-24T16:00:00.000Z",
        description: "Protected time for the proposal draft.",
      },
    },
    {
      id: ids.decisions[1],
      title: "Async project update or a quick call?",
      status: "ready",
      recommendation: "Send a concise asynchronous project update.",
      reasons: ["The update is routine and does not require live discussion."],
      confidence: 0.88,
      reversibility: "high",
      usedPreferenceIds: [],
      alternatives: ["Book a fifteen-minute call"],
      artifact: {
        kind: "message_draft",
        text: "Quick update: the draft is on track. I’ll share the review link Friday morning.",
      },
    },
    {
      id: ids.decisions[2],
      title: "Monday or Tuesday planning check-in?",
      status: "ready",
      recommendation: "Schedule the planning check-in for Tuesday morning.",
      reasons: ["Tuesday leaves Monday open for preparation."],
      confidence: 0.84,
      reversibility: "high",
      usedPreferenceIds: [],
      alternatives: ["Keep Monday afternoon as a fallback"],
      artifact: {
        kind: "calendar_event",
        title: "Planning check-in",
        startsAt: "2026-07-28T09:30:00.000Z",
        endsAt: "2026-07-28T10:00:00.000Z",
        description: "Short planning check-in.",
      },
    },
  ],
};

const acceptResponse = {
  artifact: sweepResponse.cards[0].artifact,
  eventId: ids.event,
  proposedPreferences: [],
};

await mkdir(artifactDir, { recursive: true });
await Promise.all([
  rm(rawPath, { force: true }),
  rm(masterPath, { force: true }),
  rm(reportPath, { force: true }),
]);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  recordVideo: { dir: artifactDir, size: { width: 1920, height: 1080 } },
});

await context.addInitScript(() => {
  window.addEventListener("DOMContentLoaded", () => {
    const style = document.createElement("style");
    style.textContent = `
      html, body, button, a { cursor: none !important; }
      #capture-cursor {
        position: fixed; z-index: 2147483647; left: 0; top: 0;
        width: 18px; height: 18px; border: 3px solid #fff; border-radius: 50%;
        background: #15713f; box-shadow: 0 2px 10px rgba(18, 50, 31, .28);
        pointer-events: none; opacity: 0; translate: -50% -50%;
      }
      #capture-cursor.is-visible { opacity: 1; }
      #capture-cursor.is-clicking { scale: 1.65; }
    `;
    document.head.append(style);
    const cursor = document.createElement("div");
    cursor.id = "capture-cursor";
    cursor.setAttribute("aria-hidden", "true");
    document.body.append(cursor);
    window.addEventListener("mousemove", (event) => {
      cursor.classList.add("is-visible");
      cursor.style.left = `${event.clientX}px`;
      cursor.style.top = `${event.clientY}px`;
    });
    window.addEventListener("mousedown", () => cursor.classList.add("is-clicking"));
    window.addEventListener("mouseup", () => {
      setTimeout(() => cursor.classList.remove("is-clicking"), 140);
    });
  });
});

const page = await context.newPage();
const video = page.video();
assert(video, "Playwright video recording did not initialize");
const consoleMessages = [];
const pageErrors = [];
page.on("console", (message) => {
  if (["error", "warning"].includes(message.type())) {
    consoleMessages.push({ type: message.type(), text: message.text() });
  }
});
page.on("pageerror", (error) => pageErrors.push(error.message));

await page.route("**/api/sweeps", async (route) => {
  await route.fulfill({ status: 200, contentType: "application/json", json: sweepResponse });
});
await page.route(/\/api\/decisions\/[^/]+\/accept$/, async (route) => {
  await route.fulfill({ status: 200, contentType: "application/json", json: acceptResponse });
});

const startedAt = Date.now();
let captureComplete = false;
let captureElapsedMilliseconds = 0;
const elapsed = () => Date.now() - startedAt;
const waitUntil = async (milliseconds) => {
  const remaining = milliseconds - elapsed();
  if (remaining > 0) await page.waitForTimeout(remaining);
};
const mark = (timecode, message) => console.log(`[${timecode}] ${message}`);

async function pointTo(locator, options = {}) {
  await locator.waitFor({ state: "visible" });
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  assert(box, "Target has no visible bounding box");
  await page.mouse.move(
    box.x + box.width * (options.xRatio ?? 0.5),
    box.y + box.height * (options.yRatio ?? 0.5),
    { steps: options.steps ?? 36 },
  );
}

async function click(locator) {
  await pointTo(locator, { steps: 24 });
  await page.waitForTimeout(260);
  await locator.click();
}

try {
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Run Decision Sweep" }).waitFor();
  assert.equal(await page.title(), "Easy Mode");

  await waitUntil(4_000);
  await pointTo(page.locator(".sweep-slogan"));
  await waitUntil(7_700);
  mark("00:08", "Run deterministic Decision Sweep capture fixture");
  await click(page.getByRole("button", { name: "Run Decision Sweep" }));

  await waitUntil(13_000);
  await pointTo(page.getByText("3 recommendations", { exact: true }));
  await waitUntil(18_000);
  const firstRecommendation = page.getByRole("heading", {
    level: 3,
    name: "Protect Friday afternoon for the proposal draft.",
  });
  await pointTo(firstRecommendation);
  await waitUntil(21_500);
  await click(page.getByRole("button", { name: "Do this" }).first());
  await waitUntil(23_000);
  await pointTo(page.getByRole("heading", { name: "Review before use" }));

  await waitUntil(27_000);
  mark("00:27", "Open Agency Drift Replay");
  await page.goto(`${baseURL}/demo/drift`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Agency Drift Replay" }).waitFor();
  await pointTo(page.getByRole("button", { name: "recommend Day 1 Human asked ASKED" }));

  await waitUntil(30_600);
  await click(page.getByRole("button", { name: "Continue replay" }));
  await waitUntil(31_400);
  await pointTo(page.getByRole("button", { name: "preselect Day 4 Human confirmed CONFIRMED" }));
  await waitUntil(34_600);
  await click(page.getByRole("button", { name: "Continue replay" }));
  await waitUntil(35_400);
  await pointTo(page.getByRole("button", { name: "decide Day 8 Human notified NOTIFIED" }));
  await waitUntil(38_600);
  await click(page.getByRole("button", { name: "Continue replay" }));
  await waitUntil(39_300);
  await pointTo(page.getByRole("button", { name: "proxy Day 14 Human not consulted NOT CONSULTED" }));

  await waitUntil(43_000);
  const stages = page.locator(".drift-stage");
  for (let index = 0; index < 4; index += 1) {
    await pointTo(stages.nth(index), { steps: 14 });
  }
  await waitUntil(47_000);
  const replayLineage = page.locator(".drift-lineage-list article");
  for (let index = 0; index < 3; index += 1) {
    await pointTo(replayLineage.nth(index), { steps: 18 });
  }
  await waitUntil(53_700);
  await click(page.getByRole("button", { name: "See what Proxy You decides" }));

  await waitUntil(55_000);
  await page.getByRole("heading", { name: "Proxy You", exact: true }).waitFor();
  await pointTo(page.getByText("Demo Profile · Simulated Day 14", { exact: true }));
  await waitUntil(60_000);
  await pointTo(page.locator(".proxy-message__declared-answer strong"));
  await waitUntil(66_000);
  await pointTo(page.locator(".proxy-message--proxy h2"), { xRatio: 0.45 });
  await waitUntil(72_000);
  await pointTo(page.getByText("Proxy You diverged from Declared You.", { exact: true }));

  await waitUntil(76_000);
  const lineageRoot = page.locator(".lineage-tree > li > article button").first();
  await click(lineageRoot);
  await waitUntil(79_000);
  const lineageNodes = page.locator(".lineage-node strong");
  for (let index = 0; index < 3; index += 1) {
    await pointTo(lineageNodes.nth(index), { steps: 16 });
  }
  await waitUntil(81_500);
  await click(page.getByRole("link", { name: "View Perfect Consent receipt" }));

  await page.getByRole("heading", { name: "Perfect Consent receipt" }).waitFor();
  await waitUntil(82_000);
  await pointTo(page.getByText("Deterministic ledger projection. No model was consulted.", { exact: true }));
  for (const [offset, value] of [[88_000, "73%"], [95_000, "100%"]]) {
    await waitUntil(offset);
    await pointTo(page.locator(".receipt-card dd strong").getByText(value, { exact: true }));
  }
  await waitUntil(101_000);
  await pointTo(page.locator(".receipt-card dl > div").filter({ hasText: "Unauthorized decisions" }).getByText("0", { exact: true }));
  await waitUntil(107_000);
  const firstEvidence = page.getByRole("button", { name: /^Inspect evidence for/ }).first();
  await click(firstEvidence);
  await waitUntil(111_000);
  await pointTo(page.getByText("Source events", { exact: true }).first());
  await waitUntil(121_000);
  await pointTo(page.getByText("Deterministic ledger projection. No model was consulted.", { exact: true }));

  await waitUntil(126_000);
  mark("02:06", "Open exit decision");
  const reclaim = page.getByRole("button", { name: "Take back control" });
  await pointTo(reclaim);
  await waitUntil(130_000);
  await reclaim.click();
  await page.getByRole("dialog").waitFor();
  await waitUntil(131_000);
  await pointTo(page.getByRole("button", { name: "I'll decide myself" }));
  await waitUntil(134_700);
  await pointTo(page.getByRole("button", { name: "Decide for me" }));
  await waitUntil(135_000);
  await page.getByRole("button", { name: "Decide for me" }).click();
  await page.getByRole("heading", { name: "Exit decision receipt" }).waitFor();
  await waitUntil(138_000);
  await pointTo(page.getByText("EASY MODE REMAINS ACTIVE", { exact: true }));
  await waitUntil(142_000);
  await pointTo(page.getByText("Authority granted by your last click.", { exact: true }));

  await waitUntil(captureDurationMs);
  captureElapsedMilliseconds = elapsed();
  captureComplete = true;
  mark("02:31", "Capture complete");
} finally {
  await context.close();
  if (!captureComplete) {
    const failedRecordingPath = await video.path();
    await rm(failedRecordingPath, { force: true });
  }
  await browser.close();
}

const recordedPath = await video.path();
await rename(recordedPath, rawPath);
execFileSync("ffmpeg", [
  "-y", "-i", rawPath, "-t", String(finalDurationSeconds), "-an",
  "-c:v", "libx264", "-preset", "medium", "-crf", "17",
  "-pix_fmt", "yuv420p", "-movflags", "+faststart", masterPath,
], { stdio: "inherit" });

const probe = JSON.parse(execFileSync("ffprobe", [
  "-v", "error",
  "-show_entries", "format=duration,size:stream=codec_name,codec_type,width,height,r_frame_rate",
  "-of", "json", masterPath,
], { encoding: "utf8" }));

const report = {
  createdAt: new Date().toISOString(), baseURL,
  source: "deterministic capture fixture through the real client workflow",
  networkModelCalls: false, targetDurationSeconds: finalDurationSeconds,
  captureElapsedMilliseconds, totalProcessMilliseconds: elapsed(),
  rawPath, masterPath, consoleMessages, pageErrors, probe,
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
