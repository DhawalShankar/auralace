"use client";

import { useState } from "react";
import AudioUploader from "@/components/AudioUploader";
import ParameterSliders from "@/components/ParameterSliders";
import ProcessButton from "@/components/ProcessButton";
import WaveformCanvas from "@/components/WaveForm";
import ResultPanel from "@/components/ResultPanel";
import { AudioParams, ProcessResponse, ProcessState } from "@/types";
import { processAudio } from "@/utils/api";

const defaultParams: AudioParams = {
  pitch: 0, speed: 1.0, bass: 0,
  treble: 0, reverb: 0, loudness: 0,
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [params, setParams] = useState<AudioParams>(defaultParams);
  const [state, setState] = useState<ProcessState>({ status: "idle" });
  const [result, setResult] = useState<ProcessResponse | null>(null);

  const handleProcess = async () => {
    if (!file) return;
    setState({ status: "uploading" });
    try {
      setState({ status: "processing" });
      const data = await processAudio(file, params);
      setResult(data);
      setState({ status: "done" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setState({ status: "error", error: message });
    }
  };

  const [activeNav, setActiveNav] = useState("studio");

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setActiveNav(id);
  };

  const T = {
    primary:    "#0a0a0a",
    secondary:  "#3a3a3a",
    tertiary:   "#6b6b6b",
    muted:      "#9a9a9a",
    green:      "#1a4731",
    greenMid:   "#2d6a4f",
    greenLight: "#52b788",
    purple:     "#5b3fa0",
    purpleMid:  "#7c5cbf",
    purpleLight:"#a78bda",
    white:      "#ffffff",
    offWhite:   "#f8f7fc",
    greenTint:  "#f2faf6",
    purpleTint: "#f4f0fc",
    border:     "#e2ddf5",
    borderGreen:"#b7dfc8",
  };

  const sectionLeft: React.CSSProperties = {
    padding: "72px 56px 72px 72px",
    borderRight: `1px solid ${T.border}`,
    display: "flex", flexDirection: "column", justifyContent: "center",
  };
  const sectionRight: React.CSSProperties = {
    padding: "72px 72px 72px 56px",
    background: `linear-gradient(150deg, ${T.purpleTint} 0%, ${T.greenTint} 100%)`,
    display: "flex", flexDirection: "column", justifyContent: "center",
  };
  const eyebrow: React.CSSProperties = {
    fontSize: 10, letterSpacing: "0.35em",
    textTransform: "uppercase", color: T.purpleMid,
    fontWeight: 600, marginBottom: 12,
  };
  const sectionTitle: React.CSSProperties = {
    fontFamily: "'Syne', sans-serif",
    fontSize: 32, fontWeight: 800,
    color: T.primary, marginBottom: 36,
    letterSpacing: "-0.02em",
  };

  return (
    <div style={{ fontFamily: "'DM Mono', monospace", background: T.white, minHeight: "100vh", color: T.primary }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: `1px solid ${T.border}`,
        padding: "0 64px", height: 68,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src="/logo.png" alt="AuraLace" style={{ width: 38, height: 38, borderRadius: 10, objectFit: "contain" }} />
          <div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 19, letterSpacing: "0.04em", color: T.primary }}>
              AURA<span style={{ color: T.green }}>LACE</span>
            </span>
            <p style={{ fontSize: 9, color: T.muted, letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 1 }}>
              Premium Signal Studio
            </p>
          </div>
        </div>

        {/* Center nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
          {["Studio", "Parameters", "Output"].map((item) => {
            const id = item.toLowerCase();
            const isActive = activeNav === id;
            return (
              <span
                key={item}
                onClick={() => scrollTo(id)}
                onMouseEnter={(e) => (e.currentTarget.style.color = T.green)}
                onMouseLeave={(e) => (e.currentTarget.style.color = isActive ? T.green : T.tertiary)}
                style={{
                  fontSize: 12,
                  color: isActive ? T.green : T.tertiary,
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: "0.04em",
                  cursor: "pointer",
                  borderBottom: isActive ? `1.5px solid ${T.green}` : "1.5px solid transparent",
                  paddingBottom: 2,
                  transition: "color 0.2s",
                }}
              >
                {item}
              </span>
            );
          })}
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e88" }} />
            <span style={{ fontSize: 11, color: T.tertiary }}>FastAPI · Librosa · NumPy</span>
          </div>
          <div style={{ width: 1, height: 20, background: T.border }} />
          <span style={{
            fontSize: 11, color: T.purple, fontWeight: 700,
            border: `1px solid ${T.border}`,
            padding: "4px 14px", borderRadius: 20,
            background: T.purpleTint, letterSpacing: "0.06em",
          }}>v1.0</span>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section id="studio" style={{
        minHeight: "100vh",
        display: "grid", gridTemplateColumns: "1fr 1fr",
        paddingTop: 68,
      }}>
        {/* LEFT */}
        <div style={{ ...sectionLeft, justifyContent: "center" }}>
          <p style={eyebrow}>Lace Your Audio · Premium Signal Experience</p>

          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(44px, 5vw, 70px)",
            fontWeight: 800, lineHeight: 1.05,
            color: T.primary, letterSpacing: "-0.02em",
            marginBottom: 6,
          }}>
            Shape your
          </h1>
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(44px, 5vw, 70px)",
            fontWeight: 800, lineHeight: 1.05,
            color: T.green, letterSpacing: "-0.02em",
            marginBottom: 36,
            position: "relative", display: "inline-block",
          }}>
            audio.
            <span style={{
              position: "absolute", bottom: -8, left: 0, width: "75%",
              height: 4, borderRadius: 2,
              background: `linear-gradient(90deg, ${T.green}, ${T.purpleMid}, transparent)`,
            }} />
          </h1>

          <p style={{ fontSize: 14, color: T.secondary, lineHeight: 2, maxWidth: 420, marginBottom: 40 }}>
            Real-time pitch shifting, time stretching & bass boost —
            powered by FFT, phase vocoder & frequency-domain filtering.
          </p>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 52 }}>
            {[
              { label: "FFT",            green: true  },
              { label: "Phase Vocoder",  green: true  },
              { label: "Time-Stretch",   green: false },
              { label: "Freq-Domain EQ", green: false },
              { label: "Librosa",        green: true  },
              { label: "NumPy · SciPy",  green: false },
            ].map(({ label, green }) => (
              <span key={label} style={{
                fontSize: 11, padding: "5px 14px", borderRadius: 99,
                border: `1px solid ${green ? T.borderGreen : T.border}`,
                color: green ? T.green : T.purple,
                background: green ? T.greenTint : T.purpleTint,
                fontWeight: 500,
              }}>{label}</span>
            ))}
          </div>

          <div style={{ display: "flex", gap: 48 }}>
            {[
              { num: "6",    label: "Signal transforms" },
              { num: "50MB", label: "Max file size"     },
              { num: "WAV",  label: "Output format"     },
            ].map(({ num, label }) => (
              <div key={label}>
                <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: T.green, marginBottom: 4 }}>{num}</p>
                <p style={{ fontSize: 11, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ ...sectionRight }}>
          <p style={{ ...eyebrow, color: T.tertiary, marginBottom: 20 }}>Step 1 — Upload Your File</p>
          <div style={{
            background: T.white, borderRadius: 24,
            border: `1px solid ${T.border}`,
            boxShadow: "0 8px 48px rgba(91,63,160,0.10), 0 2px 8px rgba(0,0,0,0.04)",
            overflow: "hidden",
          }}>
            <AudioUploader onFileSelect={setFile} selectedFile={file} />
          </div>

          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${T.border})` }} />
              <span style={{ fontSize: 10, color: T.muted, letterSpacing: "0.2em", fontWeight: 600 }}>SCROLL TO CONFIGURE</span>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.border}, transparent)` }} />
            </div>
            <span
              onClick={() => scrollTo("parameters")}
              style={{ fontSize: 20, color: T.purpleMid, cursor: "pointer" }}
            >↓</span>
          </div>
        </div>
      </section>

      {/* ══ SECTION 2 — Sliders + Waveform ══ */}
      <section id="parameters" style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        borderTop: `1px solid ${T.border}`,
        minHeight: "85vh",
      }}>
        <div style={{ ...sectionLeft, justifyContent: "flex-start" }}>
          <p style={eyebrow}>Step 2 — Configure</p>
          <h2 style={sectionTitle}>DSP Parameters</h2>
          <ParameterSliders params={params} onChange={setParams} />
        </div>

        <div style={{ ...sectionRight, justifyContent: "flex-start" }}>
          <p style={{ ...eyebrow, color: T.tertiary }}>Visualization</p>
          <h2 style={sectionTitle}>Waveform</h2>

          {result ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <WaveformCanvas data={result.original_waveform} label="Original" color="green" duration={result.duration_original} />
              <WaveformCanvas data={result.processed_waveform} label="Processed" color="purple" duration={result.duration_processed} />
            </div>
          ) : (
            <div style={{
              borderRadius: 20, background: T.white,
              border: `1px solid ${T.border}`,
              padding: "32px 24px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 3, width: "100%", justifyContent: "center" }}>
                {Array.from({ length: 80 }).map((_, i) => (
                  <div key={i} style={{
                    width: 3, borderRadius: 3,
                    height: `${Math.abs(Math.sin(i * 0.38) * Math.cos(i * 0.12)) * 80 + 8}px`,
                    background: i % 3 === 0
                      ? "rgba(91,63,160,0.25)"
                      : i % 3 === 1
                      ? "rgba(26,71,49,0.22)"
                      : "rgba(82,183,136,0.2)",
                  }} />
                ))}
              </div>
              <p style={{ fontSize: 13, color: T.tertiary, fontWeight: 600, marginTop: 16 }}>Waveform will appear here</p>
              <p style={{ fontSize: 12, color: T.muted }}>Process your audio to compare waveforms</p>
            </div>
          )}
        </div>
      </section>

      {/* ══ SECTION 3 — Summary + Result ══ */}
      <section id="output" style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        borderTop: `1px solid ${T.border}`,
        minHeight: "55vh",
      }}>
        <div style={{ ...sectionLeft, justifyContent: "flex-start", gap: 0 }}>
          <p style={eyebrow}>Step 3 — Process</p>
          <h2 style={sectionTitle}>Applied Transforms</h2>

          <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${T.border}`, marginBottom: 24 }}>
            {[
              { label: "Pitch shift",  value: `${params.pitch > 0 ? "+" : ""}${params.pitch} st`,           green: true  },
              { label: "Time stretch", value: `${params.speed.toFixed(2)}×`,                                  green: true  },
              { label: "Bass boost",   value: `+${params.bass} dB`,                                           green: false },
              { label: "Treble boost", value: `+${params.treble} dB`,                                         green: true  },
              { label: "Reverb",       value: `${params.reverb}%`,                                            green: false },
              { label: "Loudness",     value: `${params.loudness > 0 ? "+" : ""}${params.loudness} dB`,       green: true  },
            ].map((row, i, arr) => (
              <div key={row.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "14px 22px",
                background: i % 2 === 0 ? T.white : "#faf9fe",
                borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none",
              }}>
                <span style={{ fontSize: 13, color: T.secondary }}>{row.label}</span>
                <span style={{
                  fontSize: 14, fontWeight: 700,
                  fontFamily: "'Syne', sans-serif",
                  color: row.green ? T.green : T.purple,
                }}>{row.value}</span>
              </div>
            ))}
          </div>

          <ProcessButton state={state} disabled={!file} onClick={handleProcess} />
        </div>

        <div style={{ ...sectionRight, justifyContent: "flex-start" }}>
          <p style={{ ...eyebrow, color: T.tertiary }}>Output</p>
          <h2 style={sectionTitle}>Processed Audio</h2>

          {result ? (
            <div style={{
              background: T.white, borderRadius: 20,
              border: `1px solid ${T.borderGreen}`,
              boxShadow: "0 8px 40px rgba(26,71,49,0.10)",
              overflow: "hidden",
            }}>
              <ResultPanel result={result} />
            </div>
          ) : (
            <div style={{
              borderRadius: 20, background: T.white,
              border: `1px dashed ${T.border}`,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 14, minHeight: 220,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: `linear-gradient(135deg, ${T.greenTint}, ${T.purpleTint})`,
                border: `1px solid ${T.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="24" height="24" fill="none" stroke={T.green} strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 14, color: T.tertiary, fontWeight: 600, marginBottom: 6 }}>No output yet</p>
                <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.7 }}>
                  Upload a file, configure parameters<br />and hit Process Audio
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${T.border}`, background: T.white, padding: "0 72px" }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "40px 0 32px",
          borderBottom: `1px solid ${T.border}`,
        }}>
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <img src="/logo.png" alt="AuraLace" style={{ width: 36, height: 36, borderRadius: 9, objectFit: "contain" }} />
            <div>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: T.green, letterSpacing: "0.08em" }}>
                AURALACE
              </span>
              <p style={{ fontSize: 10, color: T.muted, letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 2 }}>
                Premium Signal Studio
              </p>
            </div>
          </div>

          {/* Tech stack */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {["FastAPI", "Next.js", "Librosa", "NumPy", "SciPy"].map((tech) => (
              <span key={tech} style={{
                fontSize: 10, padding: "4px 12px",
                borderRadius: 99, border: `1px solid ${T.border}`,
                color: T.tertiary, background: T.offWhite,
                letterSpacing: "0.03em",
              }}>{tech}</span>
            ))}
          </div>

          {/* DSP tags */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
            <span style={{ fontSize: 10, color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Signal Processing
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              {["FFT", "Phase Vocoder", "Convolution"].map((tag) => (
                <span key={tag} style={{
                  fontSize: 9, padding: "3px 10px", borderRadius: 99,
                  border: `1px solid ${T.borderGreen}`,
                  color: T.green, background: T.greenTint,
                }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 0",
        }}>
          <span style={{ fontSize: 11, color: T.muted }}>© 2026 AuraLace. Open-source under MIT License.</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 5px #22c55e88" }} />
            <span style={{ fontSize: 11, color: T.muted }}>All systems operational</span>
          </div>
        </div>
      </footer>

    </div>
  );
}