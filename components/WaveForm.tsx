"use client";

import { useEffect, useRef } from "react";

interface WaveformProps {
  data: number[];
  label: string;
  color: string;   // hex e.g. "#52b788"
  duration?: number;
}

// Convert "#rrggbb" hex to {r, g, b} — safe for canvas rgba()
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

export default function Waveform({ data, label, color, duration }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { r, g, b } = hexToRgb(color);

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const barWidth = width / data.length;
    const centerY = height / 2;

    // Background grid lines
    ctx.strokeStyle = "rgba(0,0,0,0.04)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Waveform bars
    data.forEach((amplitude, i) => {
      const barHeight = Math.max(2, amplitude * (height * 0.85));
      const x = i * barWidth;

      const gradient = ctx.createLinearGradient(0, centerY - barHeight, 0, centerY + barHeight);
      gradient.addColorStop(0,   `rgba(${r},${g},${b},0.5)`);
      gradient.addColorStop(0.5, `rgba(${r},${g},${b},1.0)`);
      gradient.addColorStop(1,   `rgba(${r},${g},${b},0.5)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x + 0.5, centerY - barHeight, Math.max(barWidth - 1, 1), barHeight * 2, 1);
      ctx.fill();
    });

    // Edge fade
    const fadeGradient = ctx.createLinearGradient(0, 0, width, 0);
    fadeGradient.addColorStop(0,   "rgba(255,255,255,0.3)");
    fadeGradient.addColorStop(0.1, "rgba(255,255,255,0)");
    fadeGradient.addColorStop(0.9, "rgba(255,255,255,0)");
    fadeGradient.addColorStop(1,   "rgba(255,255,255,0.3)");
    ctx.fillStyle = fadeGradient;
    ctx.fillRect(0, 0, width, height);

  }, [data, color]);

  return (
    <div style={{
      background: "rgba(255,255,255,0.7)",
      border: "1px solid #e2ddf5",
      borderRadius: 12,
      padding: 16,
      flex: 1,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
          <span style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 11, fontWeight: 600,
            color: "#6b6b6b",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}>
            {label}
          </span>
        </div>
        {duration !== undefined && (
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#9a9a9a" }}>
            {duration.toFixed(2)}s
          </span>
        )}
      </div>

      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "80px", display: "block", borderRadius: 6 }}
      />
    </div>
  );
}