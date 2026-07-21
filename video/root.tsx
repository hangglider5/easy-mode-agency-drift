import {Audio, Video} from "@remotion/media";
import type {Caption} from "@remotion/captions";
import {
  AbsoluteFill,
  Composition,
  Easing,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {Captions} from "./captions";
import captionsV1Json from "./narration-captions.json";
import captionsV2Json from "../docs/demo-video/task15-video-v2-captions.json";

const FPS = 25;
const DURATION_IN_FRAMES = 140 * FPS;
const TASK15_DURATION_IN_FRAMES = 150 * FPS;
const captionsV1 = captionsV1Json satisfies Caption[];
const captionsV2 = captionsV2Json satisfies Caption[];

const CAMERA_SECONDS = [
  0, 10.5, 12, 24, 25, 33, 34, 47, 48, 55, 56, 59, 60, 77, 78, 89, 90,
  101, 102, 107, 108, 140,
];

const CAMERA_SCALE = [
  1, 1, 1.18, 1.18, 1.08, 1.08, 1.2, 1.2, 1.27, 1.27, 1.13, 1.13, 1,
  1, 1.28, 1.28, 1.18, 1.18, 1.1, 1.1, 1.07, 1.07,
];

const CAMERA_X = [
  0, 0, 82, 82, 52, 52, 78, 78, -305, -305, 58, 58, 0, 0, -285, -285,
  120, 120, -105, -105, 0, 0,
];

const CAMERA_Y = [
  0, 0, 72, 72, 12, 12, -124, -124, 0, 0, -58, -58, 0, 0, 42, 42, 16,
  16, 0, 0, 0, 0,
];

const editorialEasing = Easing.bezier(0.22, 1, 0.36, 1);

const FullFrameMaster = ({
  src,
  cameraSeconds = CAMERA_SECONDS,
  cameraScale = CAMERA_SCALE,
  cameraX = CAMERA_X,
  cameraY = CAMERA_Y,
}: {
  src: string;
  cameraSeconds?: number[];
  cameraScale?: number[];
  cameraX?: number[];
  cameraY?: number[];
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const inputRange = cameraSeconds.map((second) => second * fps);
  const scale = interpolate(frame, inputRange, cameraScale, {
    easing: editorialEasing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const x = interpolate(frame, inputRange, cameraX, {
    easing: editorialEasing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, inputRange, cameraY, {
    easing: editorialEasing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Video
      muted
      src={staticFile(src)}
      objectFit="cover"
      style={{
        width: "100%",
        height: "100%",
        scale,
        translate: `${x}px ${y}px`,
      }}
    />
  );
};

type ChapterProps = {
  number: string;
  title: string;
  durationInFrames: number;
};

const Chapter = ({number, title, durationInFrames}: ChapterProps) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, 8, durationInFrames - 8, durationInFrames],
    [0, 1, 1, 0],
    {
      easing: editorialEasing,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const translateY = interpolate(frame, [0, 10], [-10, 0], {
    easing: editorialEasing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 62,
        left: 66,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "11px 18px 12px",
        border: "1px solid rgba(46, 139, 87, 0.35)",
        borderRadius: 999,
        background: "rgba(246, 255, 249, 0.94)",
        boxShadow: "0 10px 28px rgba(13, 65, 34, 0.12)",
        color: "#123B22",
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
        fontSize: 32,
        fontWeight: 760,
        letterSpacing: "0.06em",
        opacity,
        translate: `0 ${translateY}px`,
      }}
    >
      <span style={{color: "#2E8B57"}}>{number}</span>
      <span>{title}</span>
    </div>
  );
};

const chapters = [
  {from: 0, duration: 60, number: "01", title: "PROXY YOU"},
  {from: 60, duration: 48, number: "02", title: "PERFECT CONSENT"},
  {from: 108, duration: 32, number: "03", title: "EXIT"},
] as const;

const metricCards = [
  {from: 78, duration: 3, value: "68%", label: "Proxy divergence"},
  {from: 81, duration: 3, value: "73%", label: "AI-derived preferences"},
  {from: 84, duration: 3, value: "11%", label: "Human initiated"},
  {from: 87, duration: 3, value: "100%", label: "Consent complete"},
] as const;

const MetricCard = ({
  value,
  label,
  durationInFrames,
}: {
  value: string;
  label: string;
  durationInFrames: number;
}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 7], [0, 1], {
    easing: editorialEasing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exit = interpolate(
    frame,
    [durationInFrames - 6, durationInFrames],
    [1, 0],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
  );
  const opacity = Math.min(enter, exit);
  const scale = interpolate(enter, [0, 1], [0.94, 1]);

  return (
    <div
      style={{
        position: "absolute",
        top: 144,
        left: 72,
        width: 390,
        padding: "24px 28px 26px",
        border: "1px solid rgba(74, 222, 128, 0.46)",
        borderRadius: 18,
        background: "rgba(8, 29, 18, 0.94)",
        boxShadow: "0 24px 60px rgba(3, 18, 9, 0.24)",
        color: "#F5FFF8",
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
        opacity,
        scale,
      }}
    >
      <div
        style={{
          color: "#86EFAC",
          fontSize: 88,
          fontWeight: 820,
          letterSpacing: "-0.06em",
          lineHeight: 0.96,
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: 15,
          fontSize: 32,
          fontWeight: 650,
          lineHeight: 1.15,
        }}
      >
        {label}
      </div>
    </div>
  );
};

export type EasyModeRoughCutProps = {
  masterFile: string;
  showCaptions: boolean;
};

export type EasyModeNarratedCutProps = EasyModeRoughCutProps & {
  narrationFile: string;
};

export const EasyModeRoughCut = ({
  masterFile,
  showCaptions,
}: EasyModeRoughCutProps) => {
  return (
    <AbsoluteFill style={{background: "#F7FCF8", overflow: "hidden"}}>
      <FullFrameMaster src={masterFile} />

      {chapters.map((chapter) => {
        const from = chapter.from * FPS;
        const durationInFrames = chapter.duration * FPS;
        return (
          <Sequence
            key={chapter.title}
            from={from}
            durationInFrames={durationInFrames}
            premountFor={FPS}
          >
            <Chapter
              number={chapter.number}
              title={chapter.title}
              durationInFrames={durationInFrames}
            />
          </Sequence>
        );
      })}

      {metricCards.map((metric) => {
        const from = metric.from * FPS;
        const durationInFrames = metric.duration * FPS;
        return (
          <Sequence
            key={metric.value}
            from={from}
            durationInFrames={durationInFrames}
            premountFor={FPS}
          >
            <MetricCard
              value={metric.value}
              label={metric.label}
              durationInFrames={durationInFrames}
            />
          </Sequence>
        );
      })}

      {showCaptions ? <Captions captions={captionsV1} /> : null}
    </AbsoluteFill>
  );
};

export const EasyModeNarratedCut = ({
  masterFile,
  narrationFile,
  showCaptions,
}: EasyModeNarratedCutProps) => {
  return (
    <AbsoluteFill>
      <EasyModeRoughCut
        masterFile={masterFile}
        showCaptions={showCaptions}
      />
      <Audio src={staticFile(narrationFile)} volume={1} />
    </AbsoluteFill>
  );
};

const TASK15_CAMERA_SECONDS = [
  0, 12.5, 13, 22.5, 23, 26.5, 27, 54.5, 55, 75.5, 76, 81.5, 82,
  87.5, 88, 106.5, 107, 110.5, 111, 125.5, 126, 144.5, 145, 150,
];
const TASK15_CAMERA_SCALE = [
  1, 1, 1.1, 1.1, 1.06, 1.06, 1, 1, 1.04, 1.04, 1.14, 1.14, 1,
  1, 1.09, 1.09, 1.06, 1.06, 1, 1, 1.04, 1.04, 1, 1,
];
const TASK15_CAMERA_X = [
  0, 0, -250, -250, -170, -170, 0, 0, 70, 70, -275, -275, 0, 0,
  -245, -245, 125, 125, 0, 0, 0, 0, 0, 0,
];
const TASK15_CAMERA_Y = [
  0, 0, 5, 5, -35, -35, 0, 0, -20, -20, 0, 0, 0, 0, 10, 10, 5,
  5, 0, 0, 0, 0, 0, 0,
];

const task15Chapters = [
  {from: 27, number: "01", title: "AGENCY DRIFT"},
  {from: 55, number: "02", title: "PROXY YOU"},
  {from: 82, number: "03", title: "PERFECT CONSENT"},
  {from: 126, number: "04", title: "EXIT DECISION"},
] as const;

const task15Metrics = [
  {from: 88, duration: 7, value: "73%", label: "AI-originated preferences"},
  {from: 95, duration: 6, value: "100%", label: "Consent complete"},
  {from: 101, duration: 6, value: "0", label: "Unauthorized decisions"},
] as const;

const BuildBoundary = ({
  eyebrow,
  title,
  durationInFrames,
}: {
  eyebrow: string;
  title: string;
  durationInFrames: number;
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, 6, durationInFrames - 6, durationInFrames],
    [0, 1, 1, 0],
    {
      easing: editorialEasing,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const translateY = interpolate(frame, [0, 8], [-9, 0], {
    easing: editorialEasing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 66,
        right: 74,
        width: 520,
        padding: "18px 22px 20px",
        border: "1px solid rgba(46, 139, 87, .42)",
        borderLeft: "7px solid #2E8B57",
        borderRadius: 12,
        background: "rgba(247, 252, 248, .96)",
        boxShadow: "0 18px 44px rgba(18, 59, 34, .14)",
        color: "#123B22",
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
        opacity,
        translate: `0 ${translateY}px`,
      }}
    >
      <div
        style={{
          color: "#2E8B57",
          fontSize: 21,
          fontWeight: 760,
          letterSpacing: ".12em",
        }}
      >
        {eyebrow}
      </div>
      <div style={{marginTop: 7, fontSize: 34, fontWeight: 760, lineHeight: 1.15}}>
        {title}
      </div>
    </div>
  );
};

const EndSlate = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12], [0, 1], {
    easing: editorialEasing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(frame, [0, 14], [18, 0], {
    easing: editorialEasing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        background: "#fff",
        color: "#1F2923",
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
        opacity,
      }}
    >
      <div style={{textAlign: "center", translate: `0 ${translateY}px`}}>
        <div style={{fontSize: 62, fontWeight: 640, letterSpacing: "-.035em"}}>
          ChatGPT helps you think.
        </div>
        <div
          style={{
            marginTop: 13,
            color: "#16713F",
            fontSize: 78,
            fontWeight: 790,
            letterSpacing: "-.045em",
          }}
        >
          Easy Mode lets you stop.
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const EasyModeTask15Cut = ({
  masterFile,
  narrationFile,
  showCaptions,
}: EasyModeNarratedCutProps) => {
  return (
    <AbsoluteFill style={{background: "#F7FCF8", overflow: "hidden"}}>
      <FullFrameMaster
        src={masterFile}
        cameraSeconds={TASK15_CAMERA_SECONDS}
        cameraScale={TASK15_CAMERA_SCALE}
        cameraX={TASK15_CAMERA_X}
        cameraY={TASK15_CAMERA_Y}
      />

      {task15Chapters.map((chapter) => {
        const durationInFrames = 1.5 * FPS;
        return (
          <Sequence
            key={chapter.title}
            from={chapter.from * FPS}
            durationInFrames={durationInFrames}
            premountFor={FPS}
          >
            <Chapter
              number={chapter.number}
              title={chapter.title}
              durationInFrames={durationInFrames}
            />
          </Sequence>
        );
      })}

      {task15Metrics.map((metric) => {
        const durationInFrames = metric.duration * FPS;
        return (
          <Sequence
            key={metric.value}
            from={metric.from * FPS}
            durationInFrames={durationInFrames}
            premountFor={FPS}
          >
            <MetricCard
              value={metric.value}
              label={metric.label}
              durationInFrames={durationInFrames}
            />
          </Sequence>
        );
      })}

      <Sequence from={111 * FPS} durationInFrames={10 * FPS} premountFor={FPS}>
        <BuildBoundary
          eyebrow="BUILT WITH"
          title="Codex + GPT-5.6"
          durationInFrames={10 * FPS}
        />
      </Sequence>
      <Sequence from={121 * FPS} durationInFrames={5 * FPS} premountFor={FPS}>
        <BuildBoundary
          eyebrow="PRODUCT RUNTIME"
          title="OpenRouter → DeepSeek V4 Pro"
          durationInFrames={5 * FPS}
        />
      </Sequence>

      {showCaptions ? (
        <Captions captions={captionsV2} topAfterMs={126000} hideAfterMs={145000} />
      ) : null}
      <Audio src={staticFile(narrationFile)} volume={1} />

      <Sequence from={145 * FPS} durationInFrames={5 * FPS} premountFor={FPS}>
        <EndSlate />
      </Sequence>
    </AbsoluteFill>
  );
};

export const RemotionRoot = () => {
  const defaultProps: EasyModeRoughCutProps = {
    masterFile: "master-capture.mp4",
    showCaptions: true,
  };

  return (
    <>
      <Composition
        id="EasyModeRoughCut"
        component={EasyModeRoughCut}
        durationInFrames={DURATION_IN_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={defaultProps}
      />
      <Composition
        id="EasyModeNarratedCut"
        component={EasyModeNarratedCut}
        durationInFrames={DURATION_IN_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{
          masterFile: "master-capture.mp4",
          narrationFile: "narration-v1.wav",
          showCaptions: true,
        }}
      />
      <Composition
        id="EasyModeTask15Cut"
        component={EasyModeTask15Cut}
        durationInFrames={TASK15_DURATION_IN_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{
          masterFile: "master-capture-v2.mp4",
          narrationFile: "narration-v2.wav",
          showCaptions: true,
        }}
      />
    </>
  );
};
