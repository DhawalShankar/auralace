"use client";

import { useEffect, useRef, useState } from "react";
import { ProcessingStatus } from "@/types";

interface Props {
  status: ProcessingStatus;
}

const STAGES = [
  "Uploading audio",
  "Time stretching",
  "Pitch shifting",
  "EQ — bass & treble",
  "Applying reverb",
  "Loudness & normalize",
  "Encoding WAV",
];

// Rotating cards shown below the progress bar while processing
const CARDS: { type: "quote" | "fact" | "tip"; text: string; sub?: string }[] = [
  {
    type: "quote",
    text: "\"Wrote poetry in Amar Ujala and now writes code that makes audio sing.\"",
    sub: "— Dhawal Shukla, ECE engineer & a born poet",
  },
  {
    type: "fact",
    text: "Longer audio = more work for the phase vocoder.",
    sub: "A 3-min file takes ~3× longer than a 1-min file. Patience is a Signals virtue.",
  },
  {
    type: "quote",
    text: "\"Studied Kirchhoff's laws. Now writes laws of his own — in verse.\"",
    sub: "— Life is a Musical!",
  },
  {
    type: "fact",
    text: "The FFT is slicing your audio into thousands of frequency bins right now.",
    sub: "Basically a prism, but for sound. Very dramatic.",
  },
  {
    type: "quote",
    text: "\"Writer by day. Engineer by night.\"",
    sub: "— Sacred Dwelling (available on Kindle)",
  },
  {
    type: "tip",
    text: "Pro tip: the reverb stage alone can take a few extra seconds.",
    sub: "It's convolving your audio with a synthetic room. Science is slow.",
  },
  {
    type: "quote",
    text: "\"Debater. Speaker. Poet. CEO. The only thing he can't do is being fake.\"",
    sub: "— probably from a village",
  },
  {
    type: "fact",
    text: "Pitch shifting works by time-stretching first, then resampling to restore duration.",
    sub: "Two steps disguised as one. Librosa is sneaky like that.",
  },
  {
    type: "quote",
    text: "\"He launched a publishing house to make sure his own poems get published.\"",
    sub: "— Cosmo India Prakashan. Genius move, honestly.",
  },
  {
    type: "tip",
    text: "MP3 files take slightly longer than WAV — they need decoding before processing.",
    sub: "Next time upload a WAV. Or don't. Dhawal will wait.",
  },
  {
    type: "quote",
    text: "\"Kanpur gave him restlessness. Electronics gave him logic. Poetry gave him Life.\"",
    sub: "— Dhawal Shukla, standing at the crossroads of complexities",
  },
  {
    type: "fact",
    text: "Bass boost uses a sigmoid-shaped frequency mask below 250Hz.",
    sub: "Smooth, not a brick wall. Dhawal appreciates nuance.",
  },
];

const COLD_START_THRESHOLD = 8000;

export default function ProcessingProgress({ status }: Props) {
  const [progress, setProgress] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [showColdStart, setShowColdStart] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [cardVisible, setCardVisible] = useState(true);

  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const stageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const coldStartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cancelRaf = () => {
    if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  };
  const cancelStageTimer = () => {
    if (stageTimerRef.current !== null) { clearInterval(stageTimerRef.current); stageTimerRef.current = null; }
  };
  const cancelColdStartTimer = () => {
    if (coldStartTimerRef.current !== null) { clearTimeout(coldStartTimerRef.current); coldStartTimerRef.current = null; }
  };
  const cancelCardTimer = () => {
    if (cardTimerRef.current !== null) { clearInterval(cardTimerRef.current); cardTimerRef.current = null; }
  };

  useEffect(() => {
    if (status === "uploading") {
      setProgress(0);
      setStageIndex(0);
      setFadingOut(false);
      setVisible(true);
      setShowColdStart(false);
      setCardIndex(0);
      setCardVisible(true);
      startTimeRef.current = null;

      const animate = (ts: number) => {
        if (startTimeRef.current === null) startTimeRef.current = ts;
        const elapsed = ts - startTimeRef.current;
        const next = Math.min(15, (elapsed / 600) * 15);
        setProgress(next);
        if (next < 15) rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);

      return () => { cancelRaf(); cancelStageTimer(); cancelColdStartTimer(); cancelCardTimer(); };
    }

    if (status === "processing") {
      cancelRaf();
      startTimeRef.current = null;

      // 15 → asymptotic ~93%, τ=18000ms — visibly crawling for 60+ seconds
      const animate = (ts: number) => {
        if (startTimeRef.current === null) startTimeRef.current = ts;
        const elapsed = ts - startTimeRef.current;
        const next = 93 - 78 * Math.exp(-elapsed / 18000);
        setProgress(next);
        rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);

      // Cycle stage labels
      setStageIndex(1);
      stageTimerRef.current = setInterval(() => {
        setStageIndex((i) => (i < STAGES.length - 1 ? i + 1 : i));
      }, 1500);

      // Cycle info cards with fade transition every 4s
      cardTimerRef.current = setInterval(() => {
        setCardVisible(false);
        setTimeout(() => {
          setCardIndex((i) => (i + 1) % CARDS.length);
          setCardVisible(true);
        }, 350);
      }, 4000);

      // Cold-start warning after threshold
      coldStartTimerRef.current = setTimeout(() => setShowColdStart(true), COLD_START_THRESHOLD);

      return () => { cancelRaf(); cancelStageTimer(); cancelColdStartTimer(); cancelCardTimer(); };
    }

    if (status === "done") {
      cancelRaf();
      cancelStageTimer();
      cancelColdStartTimer();
      cancelCardTimer();
      setShowColdStart(false);
      setStageIndex(STAGES.length - 1);
      setProgress(100);
      const t1 = setTimeout(() => setFadingOut(true), 700);
      const t2 = setTimeout(() => setVisible(false), 1300);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }

    if (status === "idle" || status === "error") {
      cancelRaf();
      cancelStageTimer();
      cancelColdStartTimer();
      cancelCardTimer();
      setVisible(false);
      setProgress(0);
      setStageIndex(0);
      setShowColdStart(false);
    }
  }, [status]);

  if (!visible) return null;

  const T = {
    green:       "#1a4731",
    greenMid:    "#2d6a4f",
    greenLight:  "#52b788",
    greenTint:   "#f2faf6",
    borderGreen: "#b7dfc8",
    muted:       "#9a9a9a",
    purple:      "#5b3fa0",
    purpleTint:  "#f4f0fc",
    purpleBorder:"#d4c9f0",
    amber:       "#92400e",
    amberBg:     "#fffbeb",
    amberBorder: "#fde68a",
    border:      "#e2ddf5",
  };

  const card = CARDS[cardIndex];

  const cardStyles: Record<string, { bg: string; border: string; labelColor: string; label: string; emoji: string }> = {
    quote: { bg: T.purpleTint,  border: T.purpleBorder, labelColor: T.purple, label: "DHAWAL SAYS",  emoji: "✍️" },
    fact:  { bg: T.greenTint,   border: T.borderGreen,  labelColor: T.green,  label: "DSP FACT",     emoji: "⚡" },
    tip:   { bg: T.amberBg,     border: T.amberBorder,  labelColor: T.amber,  label: "HEADS UP",     emoji: "💡" },
  };

  const cs = cardStyles[card.type];

  return (
    <div style={{ opacity: fadingOut ? 0 : 1, transition: "opacity 0.5s ease", marginTop: 12 }}>

      {/* Stage label + percentage */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.greenMid, letterSpacing: "0.04em" }}>
          {STAGES[stageIndex]}
        </span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.muted }}>
          {Math.round(progress)}%
        </span>
      </div>

      {/* Progress track */}
      <div style={{ height: 5, borderRadius: 99, background: T.borderGreen, overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${T.green}, ${T.greenLight})`,
          borderRadius: 99,
          transition: status === "done" ? "width 0.3s ease" : "width 0.08s linear",
        }} />
      </div>

      {/* Rotating card — only during processing */}
      {status === "processing" && (
        <div style={{
          marginTop: 14,
          padding: "12px 14px",
          borderRadius: 10,
          background: cs.bg,
          border: `1px solid ${cs.border}`,
          opacity: cardVisible ? 1 : 0,
          transition: "opacity 0.35s ease",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 12 }}>{cs.emoji}</span>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.15em",
              color: cs.labelColor,
            }}>{cs.label}</span>
          </div>
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            color: "#1a1a1a",
            lineHeight: 1.65,
            margin: 0,
            marginBottom: card.sub ? 6 : 0,
          }}>
            {card.text}
          </p>
          {card.sub && (
            <p style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: T.muted,
              lineHeight: 1.5,
              margin: 0,
            }}>
              {card.sub}
            </p>
          )}
        </div>
      )}

      {/* Cold-start warning */}
      {showColdStart && (
        <div style={{
          marginTop: 10,
          padding: "8px 12px",
          borderRadius: 8,
          background: T.amberBg,
          border: `1px solid ${T.amberBorder}`,
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
        }}>
          <span style={{ fontSize: 13, flexShrink: 0 }}>⏳</span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.amber, lineHeight: 1.6 }}>
            Backend waking up on Render's free tier — first request can take up to 30s. Even Dhawal had to wait before his book got published.
          </span>
        </div>
      )}

    </div>
  );
}