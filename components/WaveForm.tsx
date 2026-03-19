"use client";

import { useEffect, useRef } from "react";

interface WaveformProps {
  data: number[];
  label: string;
  color: string;
  duration?: number;
}

export default function Waveform({ data, label, color, duration }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const barWidth = width / data.length;
    const centerY = height / 2;

    // Draw background grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw waveform bars
    data.forEach((amplitude, i) => {
      const barHeight = Math.max(2, amplitude * (height * 0.85));
      const x = i * barWidth;

      // Gradient per bar
      const gradient = ctx.createLinearGradient(0, centerY - barHeight, 0, centerY + barHeight);
      gradient.addColorStop(0, `${color}aa`);
      gradient.addColorStop(0.5, color);
      gradient.addColorStop(1, `${color}aa`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x + 0.5, centerY - barHeight, Math.max(barWidth - 1, 1), barHeight * 2, 1);
      ctx.fill();
    });

    // Glow effect overlay
    const glowGradient = ctx.createLinearGradient(0, 0, width, 0);
    glowGradient.addColorStop(0, "rgba(0,0,0,0.4)");
    glowGradient.addColorStop(0.5, "rgba(0,0,0,0)");
    glowGradient.addColorStop(1, "rgba(0,0,0,0.4)");
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, width, height);
  }, [data, color]);

  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "16px",
        flex: 1,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: color,
              boxShadow: `0 0 8px ${color}`,
            }}
          />
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            {label}
          </span>
        </div>
        {duration !== undefined && (
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "11px",
              color: "var(--text-muted)",
            }}
          >
            {duration.toFixed(2)}s
          </span>
        )}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "80px",
          display: "block",
        }}
      />
    </div>
  );
}