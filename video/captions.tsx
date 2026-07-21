import type {Caption} from "@remotion/captions";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const CaptionCard = ({
  caption,
  topAfterMs,
}: {
  caption: Caption;
  topAfterMs: number;
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const durationInFrames = Math.round(
    ((caption.endMs - caption.startMs) / 1000) * fps,
  );
  const fadeFrames = Math.min(5, Math.floor(durationInFrames / 4));
  const opacity = interpolate(
    frame,
    [0, fadeFrames, durationInFrames - fadeFrames, durationInFrames],
    [0, 1, 1, 0],
    {
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const translateY = interpolate(frame, [0, fadeFrames], [12, 0], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const placeAtTop = caption.startMs >= topAfterMs;
  const preserveRightRail =
    caption.startMs >= 48000 && caption.startMs < 65000;
  const fontSize =
    caption.text.length > 150 ? 38 : caption.text.length > 110 ? 40 : 44;

  return (
    <AbsoluteFill
      style={{
        alignItems: preserveRightRail ? "flex-start" : "center",
        justifyContent: placeAtTop ? "flex-start" : "flex-end",
        padding: placeAtTop ? "146px 80px 0" : "0 80px 60px",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          maxWidth: preserveRightRail ? 880 : 1460,
          padding: "20px 30px 22px",
          border: "1px solid rgba(135, 255, 182, 0.4)",
          borderLeft: "8px solid #4ADE80",
          borderRadius: 12,
          background: "rgba(8, 29, 18, 0.92)",
          boxShadow: "0 18px 50px rgba(0, 0, 0, 0.22)",
          color: "#F5FFF8",
          fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
          fontSize,
          fontWeight: 650,
          letterSpacing: "-0.02em",
          lineHeight: 1.2,
          opacity,
          textAlign: preserveRightRail ? "left" : "center",
          translate: `0 ${translateY}px`,
        }}
      >
        {caption.text}
      </div>
    </AbsoluteFill>
  );
};

export const Captions = ({
  captions,
  topAfterMs = 108000,
  hideAfterMs,
}: {
  captions: Caption[];
  topAfterMs?: number;
  hideAfterMs?: number;
}) => {
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill>
      {captions
        .filter((caption) => hideAfterMs === undefined || caption.startMs < hideAfterMs)
        .map((caption) => {
        const from = Math.round((caption.startMs / 1000) * fps);
        const durationInFrames = Math.round(
          ((caption.endMs - caption.startMs) / 1000) * fps,
        );

        return (
          <Sequence
            key={caption.startMs}
            from={from}
            durationInFrames={durationInFrames}
            premountFor={fps}
          >
            <CaptionCard caption={caption} topAfterMs={topAfterMs} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
