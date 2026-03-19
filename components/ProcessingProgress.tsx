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

const CARDS: { type: "quote" | "fact" | "tip"; text: string; sub?: string }[] = [
  {
    type: "fact",
    text: "When Spotify slows a song down without changing the pitch, it uses the exact same technique running right now.",
    sub: "It's called time-stretching. Your audio is being processed the same way.",
  },
  {
    type: "fact",
    text: "Pitch shifting is how TikTok and Instagram Reels make voices sound chipmunk-high or dramatically low.",
    sub: "The app is doing that to your audio right now — mathematically, not magically.",
  },
  {
    type: "fact",
    text: "The bass boost here works exactly like the equaliser in your car stereo or Spotify's audio settings.",
    sub: "It amplifies the low, rumbling frequencies — the ones you feel in your chest.",
  },
  {
    type: "fact",
    text: "Reverb makes a dry recording sound like it was captured in a room, a hall, or a cathedral.",
    sub: "Every song you've heard on radio has reverb on it. It makes sound feel alive.",
  },
  {
    type: "fact",
    text: "Longer audio files take more time to process — a 5-minute file takes roughly 5× longer than a 1-minute file.",
    sub: "The app is working through every single second of your audio. Worth the wait.",
  },
  {
    type: "fact",
    text: "Myntra and Flipkart use audio processing to clean up voice search recordings before understanding them.",
    sub: "The same principles — noise removal, clarity boost — are used in billions of apps every day.",
  },
  {
    type: "fact",
    text: "When you call someone and they sound clear despite being far away, audio processing is doing the heavy lifting.",
    sub: "Zoom, Google Meet, WhatsApp calls — all of them process your voice in real time.",
  },
  {
    type: "fact",
    text: "The treble boost sharpens high-frequency sounds — like the crispness of a guitar string or the clarity of a voice.",
    sub: "Too much treble and it gets harsh. A little goes a long way.",
  },
  {
    type: "quote",
    text: "\"An electronics engineer who chose words over wires — and ended up using both.\"",
    sub: "— Dhawal Shukla, Co-Founder & CEO, Cosmo India Prakashan",
  },
  {
    type: "quote",
    text: "\"From writing poetry published in Amar Ujala to building a digital publishing house — the pen never stopped moving.\"",
    sub: "— Dhawal Shukla, author of Sacred Dwelling",
  },
  {
    type: "quote",
    text: "\"Kanpur sharpened him. Engineering disciplined him. Literature gave him a voice.\"",
    sub: "— on Dhawal Shukla, debater, poet, and founder",
  },
  {
    type: "quote",
    text: "\"He built this app. So while it processes your audio, it's only fair you wait in good company.\"",
    sub: "— AuraLace, created by Dhawal Shukla",
  },
  {
    type: "quote",
    text: "\"A public speaker who understands circuits, and a poet who understands people — rare combination.\"",
    sub: "— Dhawal Shukla, steering Cosmo India Prakashan into the digital age",
  },
  {
    type: "tip",
    text: "For faster processing, use WAV files instead of MP3.",
    sub: "MP3 files need to be decoded first before any processing can begin. WAV is ready instantly.",
  },
  {
    type: "tip",
    text: "The output is always a high-quality WAV file — regardless of what format you uploaded.",
    sub: "Uncompressed. The best quality your audio can be in.",
  },
];

const COLD_START_THRESHOLD = 8000;
const CARD_INTERVAL = 7000;

export default function ProcessingProgress({ status }: Props) {
  const [progress,     setProgress]     = useState(0);
  const [stageIndex,   setStageIndex]   = useState(0);
  const [visible,      setVisible]      = useState(false);
  const [fadingOut,    setFadingOut]    = useState(false);
  const [showColdStart,setShowColdStart]= useState(false);
  const [cardIndex,    setCardIndex]    = useState(0);
  const [cardVisible,  setCardVisible]  = useState(true);

  const rafRef           = useRef<number | null>(null);
  const startTimeRef     = useRef<number | null>(null);
  const stageTimerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const coldStartTimerRef= useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardTimerRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  const cancelRaf           = () => { if (rafRef.current)            { cancelAnimationFrame(rafRef.current); rafRef.current = null; } };
  const cancelStageTimer    = () => { if (stageTimerRef.current)     { clearInterval(stageTimerRef.current); stageTimerRef.current = null; } };
  const cancelColdStartTimer= () => { if (coldStartTimerRef.current) { clearTimeout(coldStartTimerRef.current); coldStartTimerRef.current = null; } };
  const cancelCardTimer     = () => { if (cardTimerRef.current)      { clearInterval(cardTimerRef.current); cardTimerRef.current = null; } };

  useEffect(() => {
    if (status === "uploading") {
      setProgress(0); setStageIndex(0); setFadingOut(false);
      setVisible(true); setShowColdStart(false); setCardIndex(0); setCardVisible(true);
      startTimeRef.current = null;
      const animate = (ts: number) => {
        if (startTimeRef.current === null) startTimeRef.current = ts;
        const next = Math.min(15, ((ts - startTimeRef.current) / 600) * 15);
        setProgress(next);
        if (next < 15) rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);
      return () => { cancelRaf(); cancelStageTimer(); cancelColdStartTimer(); cancelCardTimer(); };
    }

    if (status === "processing") {
      cancelRaf();
      startTimeRef.current = null;
      const animate = (ts: number) => {
        if (startTimeRef.current === null) startTimeRef.current = ts;
        setProgress(93 - 78 * Math.exp(-(ts - startTimeRef.current) / 18000));
        rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);

      setStageIndex(1);
      stageTimerRef.current = setInterval(() => {
        setStageIndex((i) => (i < STAGES.length - 1 ? i + 1 : i));
      }, 1500);

      cardTimerRef.current = setInterval(() => {
        setCardVisible(false);
        setTimeout(() => { setCardIndex((i) => (i + 1) % CARDS.length); setCardVisible(true); }, 400);
      }, CARD_INTERVAL);

      coldStartTimerRef.current = setTimeout(() => setShowColdStart(true), COLD_START_THRESHOLD);
      return () => { cancelRaf(); cancelStageTimer(); cancelColdStartTimer(); cancelCardTimer(); };
    }

    if (status === "done") {
      cancelRaf(); cancelStageTimer(); cancelColdStartTimer(); cancelCardTimer();
      setShowColdStart(false); setStageIndex(STAGES.length - 1); setProgress(100);
      const t1 = setTimeout(() => setFadingOut(true), 700);
      const t2 = setTimeout(() => setVisible(false), 1300);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }

    if (status === "idle" || status === "error") {
      cancelRaf(); cancelStageTimer(); cancelColdStartTimer(); cancelCardTimer();
      setVisible(false); setProgress(0); setStageIndex(0); setShowColdStart(false);
    }
  }, [status]);

  if (!visible) return null;

  const T = {
    green:        "#1a4731",
    greenMid:     "#2d6a4f",
    greenLight:   "#52b788",
    greenTint:    "#f2faf6",
    borderGreen:  "#b7dfc8",
    muted:        "#9a9a9a",
    purple:       "#5b3fa0",
    purpleTint:   "#f4f0fc",
    purpleBorder: "#d4c9f0",
    amber:        "#92400e",
    amberBg:      "#fffbeb",
    amberBorder:  "#fde68a",
  };

  const card = CARDS[cardIndex];

  const cardStyles = {
    quote: { bg: T.purpleTint,  border: T.purpleBorder, labelColor: T.purple,  label: "ABOUT THE CREATOR", emoji: "✍️" },
    fact:  { bg: T.greenTint,   border: T.borderGreen,  labelColor: T.greenMid, label: "DID YOU KNOW",      emoji: "🎧" },
    tip:   { bg: T.amberBg,     border: T.amberBorder,  labelColor: T.amber,    label: "QUICK TIP",         emoji: "💡" },
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
          height: "100%", width: `${progress}%`,
          background: `linear-gradient(90deg, ${T.green}, ${T.greenLight})`,
          borderRadius: 99,
          transition: status === "done" ? "width 0.3s ease" : "width 0.08s linear",
        }} />
      </div>

      {/* Rotating info card */}
      {status === "processing" && (
        <div style={{
          marginTop: 14,
          padding: "16px 18px",        // generous padding — not dependent on Tailwind
          borderRadius: 10,
          background: cs.bg,
          border: `1px solid ${cs.border}`,
          opacity: cardVisible ? 1 : 0,
          transition: "opacity 0.4s ease",
          minHeight: 90,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 13 }}>{cs.emoji}</span>
            <span style={{
              fontFamily: "'DM Mono', monospace", fontSize: 9,
              fontWeight: 700, letterSpacing: "0.16em", color: cs.labelColor,
            }}>
              {cs.label}
            </span>
          </div>
          <p style={{
            fontFamily: "'DM Mono', monospace", fontSize: 11,
            color: "#1a1a1a", lineHeight: 1.7, margin: 0,
            marginBottom: card.sub ? 8 : 0,
          }}>
            {card.text}
          </p>
          {card.sub && (
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.muted, lineHeight: 1.6, margin: 0 }}>
              {card.sub}
            </p>
          )}
        </div>
      )}

      {/* Cold-start warning */}
      {showColdStart && (
        <div style={{
          marginTop: 10, padding: "10px 14px", borderRadius: 8,
          background: T.amberBg, border: `1px solid ${T.amberBorder}`,
          display: "flex", alignItems: "flex-start", gap: 8,
        }}>
          <span style={{ fontSize: 13, flexShrink: 0 }}>⏳</span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.amber, lineHeight: 1.65 }}>
            The server is starting up after a period of inactivity — this can take up to 30 seconds on the first request. Your audio is in the queue.
          </span>
        </div>
      )}

    </div>
  );
}