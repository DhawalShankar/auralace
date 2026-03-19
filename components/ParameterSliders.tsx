"use client";

import { AudioParams } from "@/types";

interface Props {
  params: AudioParams;
  onChange: (params: AudioParams) => void;
}

const allSliders = [
  {
    key: "pitch" as keyof AudioParams,
    label: "Pitch Shift", description: "semitones up or down",
    min: -12, max: 12, step: 0.5, unit: "st", color: "green",
    toPercent: (v: number) => ((v + 12) / 24) * 100,
    format: (v: number) => (v > 0 ? `+${v}` : `${v}`),
  },
  {
    key: "speed" as keyof AudioParams,
    label: "Speed", description: "time stretch",
    min: 0.5, max: 2.0, step: 0.05, unit: "×", color: "green",
    toPercent: (v: number) => ((v - 0.5) / 1.5) * 100,
    format: (v: number) => v.toFixed(2),
  },
  {
    key: "bass" as keyof AudioParams,
    label: "Bass Boost", description: "low freq EQ",
    min: 0, max: 20, step: 0.5, unit: "dB", color: "green",
    toPercent: (v: number) => (v / 20) * 100,
    format: (v: number) => `+${v}`,
  },
  {
    key: "treble" as keyof AudioParams,
    label: "Treble Boost", description: "high freq EQ",
    min: 0, max: 20, step: 0.5, unit: "dB", color: "purple",
    toPercent: (v: number) => (v / 20) * 100,
    format: (v: number) => `+${v}`,
  },
  {
    key: "reverb" as keyof AudioParams,
    label: "Reverb", description: "room effect",
    min: 0, max: 100, step: 1, unit: "%", color: "purple",
    toPercent: (v: number) => (v / 100) * 100,
    format: (v: number) => `${v}`,
  },
  {
    key: "loudness" as keyof AudioParams,
    label: "Loudness", description: "output gain",
    min: -20, max: 20, step: 0.5, unit: "dB", color: "purple",
    toPercent: (v: number) => ((v + 20) / 40) * 100,
    format: (v: number) => (v > 0 ? `+${v}` : `${v}`),
  },
];

const leftSliders = allSliders.slice(0, 3);
const rightSliders = allSliders.slice(3);

interface SliderConfig {
  key: keyof AudioParams;
  label: string; description: string;
  min: number; max: number; step: number;
  unit: string; color: string;
  toPercent: (v: number) => number;
  format: (v: number) => string;
}

function SliderItem({ s, val, onChange }: { s: SliderConfig; val: number; onChange: (v: number) => void }) {
  const pct = s.toPercent(val);
  const isGreen = s.color === "green";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>
            {s.label}
          </span>
          <span style={{ fontSize: 10, color: "#bbb", marginLeft: 6 }}>— {s.description}</span>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 6,
          border: `1px solid ${isGreen ? "#b7dfc8" : "#d8d0f0"}`,
          color: isGreen ? "#1a5c3a" : "#6b3fa0",
          background: isGreen ? "#f0faf4" : "#f7f4ff",
          whiteSpace: "nowrap",
        }}>
          {s.format(val)}{s.unit}
        </span>
      </div>
      <div style={{ position: "relative", height: 20, display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", width: "100%", height: 4, background: "#f0f0f0", borderRadius: 4 }} />
        <div style={{
          position: "absolute", height: 4, borderRadius: 4, width: `${pct}%`,
          background: isGreen ? "linear-gradient(90deg, #1a4731, #52b788)" : "linear-gradient(90deg, #7c5cbf, #a78bda)",
        }} />
        <input
          type="range" min={s.min} max={s.max} step={s.step} value={val}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{ position: "absolute", width: "100%", opacity: 0, cursor: "pointer", height: 20, zIndex: 10, margin: 0 }}
        />
        <div style={{
          position: "absolute", left: `calc(${pct}% - 8px)`,
          width: 16, height: 16, borderRadius: "50%", background: "#fff",
          border: `2px solid ${isGreen ? "#1a4731" : "#7c5cbf"}`,
          boxShadow: `0 1px 6px ${isGreen ? "#1a473133" : "#7c5cbf33"}`,
          pointerEvents: "none",
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 9, color: "#ccc" }}>{s.min}{s.unit}</span>
        <span style={{ fontSize: 9, color: "#ccc" }}>{s.max}{s.unit}</span>
      </div>
    </div>
  );
}

export default function ParameterSliders({ params, onChange }: Props) {
  const defaultParams: AudioParams = { pitch: 0, speed: 1.0, bass: 0, treble: 0, reverb: 0, loudness: 0 };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#bbb" }}>DSP Parameters</p>
        <button
          onClick={() => onChange(defaultParams)}
          style={{ fontSize: 10, color: "#bbb", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.05em" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#7c5cbf")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#bbb")}
        >reset all</button>
      </div>

      {/* Desktop: 2 col with headers. Mobile: single col via CSS class */}
      <style>{`
        .sliders-cols-header {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          margin-bottom: 8px;
        }
        .sliders-cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px 40px;
        }
        .sliders-right {
          border-left: 1px solid #f0ecfb;
          padding-left: 32px;
          display: flex; flex-direction: column; gap: 28px;
        }
        .sliders-left {
          display: flex; flex-direction: column; gap: 28px;
        }
        @media (max-width: 767px) {
          .sliders-cols-header { grid-template-columns: 1fr 1fr; gap: 16px; }
          .sliders-cols { grid-template-columns: 1fr; gap: 0; }
          .sliders-left { gap: 24px; margin-bottom: 0; }
          .sliders-right {
            border-left: none; padding-left: 0;
            border-top: 1px solid #f0ecfb;
            padding-top: 24px; margin-top: 24px;
            gap: 24px;
          }
        }
      `}</style>

      <div className="sliders-cols-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1a4731" }} />
          <span style={{ fontSize: 10, color: "#1a4731", letterSpacing: "0.1em", textTransform: "uppercase" }}>Temporal & Freq</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#7c5cbf" }} />
          <span style={{ fontSize: 10, color: "#7c5cbf", letterSpacing: "0.1em", textTransform: "uppercase" }}>Spatial & Dynamics</span>
        </div>
      </div>

      <div style={{ height: 1, background: "linear-gradient(90deg, #e8f5ee, #ede9f8, #e8f5ee)", marginBottom: 24 }} />

      <div className="sliders-cols">
        <div className="sliders-left">
          {leftSliders.map((s) => (
            <SliderItem key={s.key} s={s} val={Number(params[s.key])} onChange={(v) => onChange({ ...params, [s.key]: v })} />
          ))}
        </div>
        <div className="sliders-right">
          {rightSliders.map((s) => (
            <SliderItem key={s.key} s={s} val={Number(params[s.key])} onChange={(v) => onChange({ ...params, [s.key]: v })} />
          ))}
        </div>
      </div>
    </div>
  );
}