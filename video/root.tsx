import {Video} from "@remotion/media";
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

const FPS = 25;
const DURATION_IN_FRAMES = 140 * FPS;

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

const FullFrameMaster = ({src}: {src: string}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const inputRange = CAMERA_SECONDS.map((second) => second * fps);
  const scale = interpolate(frame, inputRange, CAMERA_SCALE, {
    easing: editorialEasing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const x = interpolate(frame, inputRange, CAMERA_X, {
    easing: editorialEasing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, inputRange, CAMERA_Y, {
    easing: editorialEasing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Video
      muted
      src={staticFile(src)}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
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

      {showCaptions ? <Captions /> : null}
    </AbsoluteFill>
  );
};

export const RemotionRoot = () => {
  const defaultProps: EasyModeRoughCutProps = {
    masterFile: "master-capture.mp4",
    showCaptions: true,
  };

  return (
    <Composition
      id="EasyModeRoughCut"
      component={EasyModeRoughCut}
      durationInFrames={DURATION_IN_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={defaultProps}
    />
  );
};
