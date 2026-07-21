import {spawnSync} from "node:child_process";
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const artifactDirectory = resolve(projectRoot, "artifacts/demo-video");
const captionsPath = resolve(
  projectRoot,
  process.env.NARRATION_CAPTIONS ?? "video/narration-captions.json",
);
const segmentDirectory = resolve(
  projectRoot,
  process.env.NARRATION_SEGMENT_DIRECTORY ??
    "artifacts/demo-video/narration-segments",
);
const outputPath = resolve(
  projectRoot,
  process.env.NARRATION_OUTPUT ?? "artifacts/demo-video/narration-v1.wav",
);
const reportPath = resolve(
  projectRoot,
  process.env.NARRATION_REPORT ??
    "artifacts/demo-video/narration-v1.report.json",
);

const voice = process.env.NARRATION_VOICE || "Samantha";
const wordsPerMinute = Number(process.env.NARRATION_RATE || "185");
const tailPadMilliseconds = 250;
const trackDurationSeconds = Number(process.env.NARRATION_DURATION ?? "140");

const run = (command, args, {capture = false} = {}) => {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
  });

  if (result.status !== 0) {
    const detail = [result.stdout, result.stderr].filter(Boolean).join("\n");
    throw new Error(`${command} failed with exit ${result.status}. ${detail}`);
  }

  return result.stdout?.trim() || "";
};

const durationSeconds = (path) => {
  const value = run(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      path,
    ],
    {capture: true},
  );
  const duration = Number(value);

  if (!Number.isFinite(duration)) {
    throw new Error(`Could not read audio duration for ${path}.`);
  }

  return duration;
};

const captions = JSON.parse(readFileSync(captionsPath, "utf8"));

mkdirSync(segmentDirectory, {recursive: true});

const segmentReports = captions.map((caption, index) => {
  const stem = `${String(index + 1).padStart(2, "0")}-${String(
    caption.startMs,
  ).padStart(6, "0")}`;
  const rawPath = resolve(segmentDirectory, `${stem}.aiff`);
  const processedPath = resolve(segmentDirectory, `${stem}.wav`);
  const slotSeconds = (caption.endMs - caption.startMs) / 1000;
  const maximumSpeechSeconds = slotSeconds - tailPadMilliseconds / 1000;

  run("say", [
    "-v",
    voice,
    "-r",
    String(wordsPerMinute),
    "-o",
    rawPath,
    caption.text,
  ]);

  const rawDurationSeconds = durationSeconds(rawPath);
  const tempo = Math.max(1, rawDurationSeconds / maximumSpeechSeconds);
  const filters = [
    "highpass=f=70",
    "lowpass=f=12000",
    ...(tempo > 1.001 ? [`atempo=${tempo.toFixed(6)}`] : []),
    `atrim=duration=${maximumSpeechSeconds.toFixed(3)}`,
    "asetpts=PTS-STARTPTS",
    "loudnorm=I=-18:TP=-2:LRA=6",
    "afade=t=in:st=0:d=0.035",
  ];

  run("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-i",
    rawPath,
    "-af",
    filters.join(","),
    "-ar",
    "48000",
    "-ac",
    "2",
    "-c:a",
    "pcm_s16le",
    processedPath,
  ]);

  return {
    index: index + 1,
    text: caption.text,
    startMs: caption.startMs,
    endMs: caption.endMs,
    slotSeconds,
    rawDurationSeconds,
    processedDurationSeconds: durationSeconds(processedPath),
    tempo: Number(tempo.toFixed(6)),
    compressedToFit: tempo > 1.001,
    path: processedPath,
  };
});

const inputArguments = segmentReports.flatMap((segment) => [
  "-i",
  segment.path,
]);
const delayedInputs = segmentReports.map(
  (segment, index) =>
    `[${index}:a]adelay=${segment.startMs}|${segment.startMs}[a${index}]`,
);
const inputLabels = segmentReports.map((_, index) => `[a${index}]`).join("");
const mixFilter = [
  ...delayedInputs,
  `${inputLabels}amix=inputs=${segmentReports.length}:duration=longest:normalize=0,` +
    `apad=whole_dur=${trackDurationSeconds},` +
    `atrim=duration=${trackDurationSeconds},` +
    "alimiter=limit=0.95[out]",
].join(";");

run("ffmpeg", [
  "-hide_banner",
  "-loglevel",
  "error",
  "-y",
  ...inputArguments,
  "-filter_complex",
  mixFilter,
  "-map",
  "[out]",
  "-ar",
  "48000",
  "-ac",
  "2",
  "-c:a",
  "pcm_s16le",
  outputPath,
]);

const report = {
  createdAt: new Date().toISOString(),
  provider: "macOS say",
  networkUsed: false,
  voice,
  wordsPerMinute,
  tailPadMilliseconds,
  trackDurationSeconds: durationSeconds(outputPath),
  outputPath,
  segments: segmentReports.map(({path: _path, ...segment}) => segment),
};

writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(`Generated ${outputPath}`);
console.log(`Voice: ${voice} at ${wordsPerMinute} wpm`);
console.log(
  `Compressed segments: ${segmentReports.filter((item) => item.compressedToFit).length}/${segmentReports.length}`,
);
console.log(`Report: ${reportPath}`);
