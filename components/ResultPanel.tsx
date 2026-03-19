"use client";

import { useEffect, useRef, useState } from "react";
import { ProcessResponse } from "@/types";

interface Props {
  result: ProcessResponse;
}

export default function ResultPanel({ result }: Props) {
  const audioRef   = useRef<HTMLAudioElement>(null);
  const [playing,     setPlaying]     = useState(false);
  const [progress,    setProgress]    = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioReady,  setAudioReady]  = useState(false);

  // audio_b64 is now a blob URL created in api.ts — works forever in this session
  const audioUrl = result.audio_b64;

  const T = {
    green:       "#1a4731",
    greenMid:    "#2d6a4f",
    greenLight:  "#52b788",
    greenTint:   "#f2faf6",
    borderGreen: "#b7dfc8",
    muted:       "#9a9a9a",
    secondary:   "#3a3a3a",
  };

  // Reset only when the audio URL actually changes (new result)
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setAudioReady(false);
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio || !isFinite(audio.duration) || audio.duration === 0) return;
    setCurrentTime(audio.currentTime);
    setProgress((audio.currentTime / audio.duration) * 100);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !isFinite(audio.duration) || audio.duration === 0) return;
    const rect  = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * audio.duration;
  };

  const formatTime = (s: number) => {
    if (!isFinite(s) || s < 0) return "0:00";
    const m   = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div style={{ padding: 24 }}>
      <audio
        ref={audioRef}
        src={audioUrl}
        onLoadedMetadata={() => setAudioReady(true)}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
          setCurrentTime(0);
        }}
      />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <span style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 11, fontWeight: 700,
          letterSpacing: "0.2em", textTransform: "uppercase",
          color: T.green,
        }}>
          Processed Output
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.muted }}>
          <span>{(result.sample_rate / 1000).toFixed(1)}kHz</span>
          <span>·</span>
          <span>{result.duration_processed.toFixed(2)}s</span>
        </div>
      </div>

      {/* Player */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
        <button
          onClick={togglePlay}
          style={{
            width: 48, height: 48, borderRadius: "50%",
            border: `1.5px solid ${T.greenLight}`,
            background: playing ? T.greenTint : "white",
            color: T.green,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0,
            transition: "background 0.2s",
          }}
        >
          {playing ? (
            <svg width="18" height="18" fill={T.green} viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg width="18" height="18" fill={T.green} viewBox="0 0 24 24" style={{ marginLeft: 2 }}>
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div style={{ flex: 1 }}>
          <div
            onClick={handleSeek}
            style={{
              height: 6, borderRadius: 99,
              background: "#f0ecfb",
              cursor: audioReady ? "pointer" : "default",
              position: "relative", overflow: "hidden",
            }}
          >
            <div style={{
              position: "absolute", inset: 0, right: "auto",
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${T.green}, ${T.greenLight})`,
              borderRadius: 99,
              transition: "width 0.1s linear",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.muted }}>
              {formatTime(currentTime)}
            </span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.muted }}>
              {formatTime(result.duration_processed)}
            </span>
          </div>
        </div>
      </div>

      {/* Metadata row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Sample rate", value: `${(result.sample_rate / 1000).toFixed(1)} kHz` },
          { label: "Duration",    value: `${result.duration_processed.toFixed(2)}s`       },
          { label: "Format",      value: "WAV · float32"                                  },
        ].map(({ label, value }) => (
          <div key={label} style={{
            flex: 1, background: T.greenTint,
            border: `1px solid ${T.borderGreen}`,
            borderRadius: 8, padding: "8px 12px",
          }}>
            <div style={{ fontSize: 9, color: T.greenMid, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3 }}>
              {label}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 600, color: T.green }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Download — uses the blob URL directly, triggers browser save */}
      <a
        href={audioUrl}
        download={result.filename}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          width: "100%", padding: "12px 0",
          borderRadius: 10,
          border: `1.5px solid ${T.borderGreen}`,
          background: T.green,
          color: "white",
          fontFamily: "'Syne', sans-serif",
          fontSize: 12, fontWeight: 700,
          letterSpacing: "0.12em", textTransform: "uppercase",
          textDecoration: "none",
          cursor: "pointer",
          transition: "background 0.2s",
          boxSizing: "border-box",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = T.greenMid)}
        onMouseLeave={(e) => (e.currentTarget.style.background = T.green)}
      >
        <svg width="16" height="16" fill="none" stroke="white" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Download WAV
      </a>
    </div>
  );
}