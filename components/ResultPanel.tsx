"use client";

import { useEffect, useRef, useState } from "react";
import { ProcessResponse } from "@/types";
import { getMediaUrl } from "@/utils/api";

interface Props {
  result: ProcessResponse;
}

export default function ResultPanel({ result }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const audioUrl = getMediaUrl(result.url);

  useEffect(() => {
    setPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  }, [result]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
    setProgress((audio.currentTime / audio.duration) * 100);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * audio.duration;
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="card p-6 opacity-0 animate-fade-up delay-500 border-(--cyan) shadow-[0_0_30px_var(--cyan-glow)]">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
        }}
      />

      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-sm font-semibold tracking-[0.2em] uppercase text-(--cyan)">
          Processed Output
        </h2>
        <div className="flex items-center gap-2 text-xs text-(--text-muted) font-mono">
          <span>{result.sample_rate / 1000}kHz</span>
          <span>·</span>
          <span>{result.duration_processed.toFixed(2)}s</span>
        </div>
      </div>

      {/* Player */}
      <div className="flex items-center gap-4 mb-4">
        {/* Play button */}
        <button
          onClick={togglePlay}
          className="w-12 h-12 rounded-full border border-(--cyan) flex items-center justify-center text-(--cyan) hover:bg-(--cyan-glow) transition-all shrink-0 animate-pulse-glow"
        >
          {playing ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Progress bar */}
        <div className="flex-1">
          <div
            className="h-1.5 bg-(--border) rounded-full cursor-pointer relative overflow-hidden"
            onClick={handleSeek}
          >
            <div
              className="absolute inset-y-0 left-0 bg-(--cyan) rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="font-mono text-[10px] text-(--text-muted)">
              {formatTime(currentTime)}
            </span>
            <span className="font-mono text-[10px] text-(--text-muted)">
              {formatTime(result.duration_processed)}
            </span>
          </div>
        </div>
      </div>

      {/* Download */}
      <a
        href={audioUrl}
        download={result.filename}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-lg border border-(--border) text-(--text-secondary) hover:border-(--cyan) hover:text-(--cyan) hover:bg-(--cyan-glow) transition-all text-sm font-display font-semibold tracking-wider uppercase"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        Download WAV
      </a>
    </div>
  );
}