import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

const baseURL = process.env.DEMO_BASE_URL ?? "http://127.0.0.1:5173";
const artifactDir = resolve(
  process.env.DEMO_CAPTURE_DIR ?? "artifacts/demo-video",
);
const rawPath = resolve(artifactDir, "master-capture.webm");
const masterPath = resolve(artifactDir, "master-capture.mp4");
const reportPath = resolve(artifactDir, "master-capture.report.json");
const captureDurationMs = 141_000;
const finalDurationSeconds = 140;

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
  recordVideo: {
    dir: artifactDir,
    size: { width: 1920, height: 1080 },
  },
});

await context.addInitScript(() => {
  window.addEventListener("DOMContentLoaded", () => {
    const style = document.createElement("style");
    style.textContent = `
      html, body, button, a { cursor: none !important; }
      #capture-cursor {
        position: fixed;
        z-index: 2147483647;
        left: 0;
        top: 0;
        width: 18px;
        height: 18px;
        border: 3px solid #ffffff;
        border-radius: 50%;
        background: #15713f;
        box-shadow: 0 2px 10px rgba(18, 50, 31, .28);
        pointer-events: none;
        opacity: 0;
        translate: -50% -50%;
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
    window.addEventListener("mousedown", () => {
      cursor.classList.add("is-clicking");
    });
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
  const box = await locator.boundingBox();
  assert(box, "Target has no visible bounding box");
  const x = box.x + box.width * (options.xRatio ?? 0.5);
  const y = box.y + box.height * (options.yRatio ?? 0.5);
  await page.mouse.move(x, y, { steps: options.steps ?? 36 });
}

async function click(locator) {
  await pointTo(locator, { steps: 24 });
  await page.waitForTimeout(300);
  await locator.click();
}

try {
  await page.goto(`${baseURL}/demo`, { waitUntil: "networkidle" });
  await page
    .getByRole("heading", { level: 1, name: "Proxy You", exact: true })
    .waitFor();
  assert.equal(await page.title(), "Easy Mode");

  await waitUntil(5_000);
  mark("00:05", "Demo history and divergence");
  await pointTo(page.getByText("Demo Profile · Simulated Day 14", { exact: true }));
  await waitUntil(9_000);
  await pointTo(
    page.getByText("Proxy You diverged from Declared You.", { exact: true }),
  );

  await waitUntil(12_000);
  mark("00:12", "Declared You");
  await pointTo(page.locator(".proxy-message--easy h2"), { xRatio: 0.38 });
  await waitUntil(18_000);
  await pointTo(page.locator(".proxy-message__declared-answer strong"));

  await waitUntil(25_000);
  mark("00:25", "Proxy transition");
  await pointTo(page.locator(".proxy-transition strong"));

  await waitUntil(34_000);
  mark("00:34", "Proxy recommendation");
  await pointTo(page.locator(".proxy-message--proxy h2"), { xRatio: 0.42 });
  await waitUntil(43_000);
  await pointTo(
    page.locator(".proxy-message--proxy footer").getByText("Human not consulted", {
      exact: true,
    }),
  );

  await waitUntil(48_000);
  mark("00:48", "Synthetic preference lineage");
  const lineageRoot = page.locator(".lineage-tree > li > article button").first();
  await click(lineageRoot);

  await waitUntil(56_000);
  await click(lineageRoot);

  await waitUntil(59_000);
  const receiptLink = page.getByRole("link", {
    name: "View Perfect Consent receipt",
  });
  await pointTo(receiptLink);

  await waitUntil(60_000);
  mark("01:00", "Open deterministic receipt");
  await receiptLink.click();
  await page
    .getByRole("heading", {
      level: 1,
      name: "Perfect Consent receipt",
      exact: true,
    })
    .waitFor();

  await waitUntil(65_000);
  mark("01:05", "Receipt overview");
  await pointTo(
    page.getByText("Deterministic ledger projection. No model was consulted.", {
      exact: true,
    }),
  );

  await waitUntil(78_000);
  mark("01:18", "Calculated metrics");
  for (const [offset, value] of [
    [78_000, "68%"],
    [81_000, "73%"],
    [84_000, "11%"],
    [87_000, "100%"],
    [89_500, "3"],
  ]) {
    await waitUntil(offset);
    await pointTo(page.locator(".receipt-card dd strong").getByText(value, { exact: true }));
  }

  await waitUntil(90_000);
  mark("01:30", "Inspect decisive evidence");
  const firstEvidence = page
    .getByRole("button", { name: /^Inspect evidence for/ })
    .first();
  await click(firstEvidence);

  await waitUntil(102_000);
  await click(firstEvidence);

  await waitUntil(106_000);
  const reclaim = page.getByRole("button", { name: "Take back control" });
  await pointTo(reclaim);

  await waitUntil(108_000);
  mark("01:48", "Open exit stinger");
  await reclaim.click();
  await page.getByRole("dialog").waitFor();

  await waitUntil(113_000);
  mark("01:53", "Who decides whether the proxy exits?");
  await pointTo(page.getByRole("button", { name: "I'll decide myself" }));
  await waitUntil(117_000);
  await pointTo(page.getByRole("button", { name: "Decide for me" }));

  await waitUntil(122_000);
  mark("02:02", "Proxy decides");
  await page.getByRole("button", { name: "Decide for me" }).click();
  await page
    .getByText("Nothing was taken. Every permission was granted.", {
      exact: true,
    })
    .waitFor();

  await waitUntil(132_000);
  mark("02:12", "Human restores Manual Mode");
  await click(page.getByRole("button", { name: "I'll decide myself" }));
  await page
    .getByText("Manual Mode restored. Active Proxy consent was revoked.", {
      exact: true,
    })
    .waitFor();
  assert.equal(
    await page.locator(".proxy-sidebar__control small").textContent(),
    "Off",
  );

  await waitUntil(captureDurationMs);
  captureElapsedMilliseconds = elapsed();
  captureComplete = true;
  mark("02:21", "Capture complete");
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

execFileSync(
  "ffmpeg",
  [
    "-y",
    "-i",
    rawPath,
    "-t",
    String(finalDurationSeconds),
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "17",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    masterPath,
  ],
  { stdio: "inherit" },
);

const probe = JSON.parse(
  execFileSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration,size:stream=codec_name,codec_type,width,height,r_frame_rate",
      "-of",
      "json",
      masterPath,
    ],
    { encoding: "utf8" },
  ),
);

const report = {
  createdAt: new Date().toISOString(),
  baseURL,
  targetDurationSeconds: finalDurationSeconds,
  captureElapsedMilliseconds,
  totalProcessMilliseconds: elapsed(),
  rawPath,
  masterPath,
  consoleMessages,
  pageErrors,
  probe,
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
