"use client";

import { useState, useEffect } from "react";
import AudioUploader from "@/components/AudioUploader";
import ParameterSliders from "@/components/ParameterSliders";
import ProcessButton from "@/components/ProcessButton";
import ProcessingProgress from "@/components/ProcessingProgress";
import WaveformCanvas from "@/components/WaveForm";
import ResultPanel from "@/components/ResultPanel";
import { AudioParams, ProcessResponse, ProcessState } from "@/types";
import { processAudio } from "@/utils/api";

const defaultParams: AudioParams = {
  pitch: 0, speed: 1.0, bass: 0,
  treble: 0, reverb: 0, loudness: 0,
};

// Keep in sync with backend MAX_FILE_BYTES and MAX_DURATION_SECS
const MAX_FILE_BYTES    = 15 * 1024 * 1024; // 15 MB
const MAX_DURATION_SECS = 300;              // 5 minutes

const T = {
  primary:     "#0a0a0a",
  secondary:   "#3a3a3a",
  tertiary:    "#6b6b6b",
  muted:       "#9a9a9a",
  green:       "#1a4731",
  greenMid:    "#2d6a4f",
  greenLight:  "#52b788",
  purple:      "#5b3fa0",
  purpleMid:   "#7c5cbf",
  white:       "#ffffff",
  offWhite:    "#f8f7fc",
  greenTint:   "#f2faf6",
  purpleTint:  "#f4f0fc",
  border:      "#e2ddf5",
  borderGreen: "#b7dfc8",
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [params, setParams] = useState<AudioParams>(defaultParams);
  const [state, setState] = useState<ProcessState>({ status: "idle" });
  const [result, setResult] = useState<ProcessResponse | null>(null);
  const [activeNav, setActiveNav] = useState("studio");
  const [apiLive, setApiLive] = useState(false);
  const [apiChecking, setApiChecking] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${BASE_URL}/`)
      .then((r) => { if (r.ok) setApiLive(true); })
      .catch(() => setApiLive(false))
      .finally(() => setApiChecking(false));
  }, []);

  const handleProcess = async () => {
    if (!file) return;

    // ── Client-side validation — catch obvious errors before hitting the backend ──
    if (file.size > MAX_FILE_BYTES) {
      setState({ status: "error", error: `File too large. Maximum size is 15MB.` });
      return;
    }
    if (!file.type.startsWith("audio/") && !file.name.endsWith(".wav") && !file.name.endsWith(".mp3")) {
      setState({ status: "error", error: "Only WAV and MP3 files are supported." });
      return;
    }

    setState({ status: "uploading" });
    try {
      await new Promise((res) => setTimeout(res, 400));
      setState({ status: "processing" });
      const data = await processAudio(file, params);
      setResult(data);
      setState({ status: "done" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setState({ status: "error", error: message });
    }
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setActiveNav(id);
    setMenuOpen(false);
  };

  const apiDot = (
    <div style={{
      width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
      background: apiChecking ? "#d1d5db" : apiLive ? "#22c55e" : "#ef4444",
      boxShadow: apiLive && !apiChecking ? "0 0 6px #22c55e88" : "none",
    }} />
  );

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }

        .nav-desktop-links { display: flex; align-items: center; gap: 36px; }
        .nav-desktop-status { display: flex; align-items: center; gap: 16px; }
        .nav-mobile-right { display: none; }
        .mobile-menu { display: none; }

        .section-grid { display: grid; grid-template-columns: 1fr 1fr; }
        .col-left {
          padding: 72px 56px 72px 72px;
          border-right: 1px solid ${T.border};
          display: flex; flex-direction: column; justify-content: center;
        }
        .col-right {
          padding: 72px 72px 72px 56px;
          background: linear-gradient(150deg, ${T.purpleTint} 0%, ${T.greenTint} 100%);
          display: flex; flex-direction: column; justify-content: center;
        }
        .col-start { justify-content: flex-start; }

        .hero-h1 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(44px, 5vw, 70px);
          font-weight: 800; line-height: 1.05; letter-spacing: -0.02em;
        }
        .section-h2 {
          font-family: 'Syne', sans-serif;
          font-size: 32px; font-weight: 800;
          color: ${T.primary}; margin-bottom: 36px; letter-spacing: -0.02em;
        }

        .footer-outer { padding: 0 72px; }
        .footer-top {
          display: flex; align-items: center; justify-content: space-between;
          padding: 40px 0 32px; border-bottom: 1px solid ${T.border};
          gap: 24px;
        }
        .footer-bottom {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 0;
        }

        @media (max-width: 767px) {
          .nav-desktop-links { display: none !important; }
          .nav-desktop-status { display: none !important; }
          .nav-mobile-right { display: flex; align-items: center; gap: 10px; }
          .mobile-menu.open { display: flex; flex-direction: column; }

          .section-grid { grid-template-columns: 1fr; }
          .col-left {
            padding: 40px 20px;
            border-right: none;
            border-bottom: 1px solid ${T.border};
          }
          .col-right { padding: 40px 20px; }

          .hero-h1 { font-size: clamp(32px, 9vw, 48px); }
          .section-h2 { font-size: 24px; margin-bottom: 20px; }

          .footer-outer { padding: 0 20px; }
          .footer-top { flex-direction: column; align-items: flex-start; padding: 28px 0; }
          .footer-bottom { flex-direction: column; align-items: flex-start; gap: 8px; }
        }
      `}</style>

      <div style={{ fontFamily: "'DM Mono', monospace", background: T.white, minHeight: "100vh", color: T.primary }}>

        {/* ── NAVBAR ── */}
        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          borderBottom: `1px solid ${T.border}`,
          padding: "0 32px", height: 60,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/logo.png" alt="AuraLace" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "contain" }} />
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, letterSpacing: "0.04em", color: T.primary }}>
              AURA<span style={{ color: T.green }}>LACE</span>
            </span>
          </div>

          <div className="nav-desktop-links">
            {["Studio", "Parameters", "Output"].map((item) => {
              const id = item.toLowerCase();
              const isActive = activeNav === id;
              return (
                <span key={item} onClick={() => scrollTo(id)}
                  onMouseEnter={(e) => (e.currentTarget.style.color = T.green)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = isActive ? T.green : T.tertiary)}
                  style={{
                    fontSize: 12, color: isActive ? T.green : T.tertiary,
                    fontWeight: isActive ? 600 : 400, letterSpacing: "0.04em",
                    cursor: "pointer",
                    borderBottom: isActive ? `1.5px solid ${T.green}` : "1.5px solid transparent",
                    paddingBottom: 2, transition: "color 0.2s",
                  }}>{item}</span>
              );
            })}
          </div>

          <div className="nav-desktop-status">
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              {apiDot}
              <span style={{ fontSize: 11, color: T.tertiary }}>
                {apiChecking ? "Checking..." : apiLive ? "FastAPI · Librosa · NumPy" : "Backend offline"}
              </span>
            </div>
            <div style={{ width: 1, height: 20, background: T.border }} />
            <span style={{
              fontSize: 11, color: T.purple, fontWeight: 700,
              border: `1px solid ${T.border}`, padding: "4px 14px",
              borderRadius: 20, background: T.purpleTint, letterSpacing: "0.06em",
            }}>v1.0</span>
          </div>

          <div className="nav-mobile-right">
            {apiDot}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", flexDirection: "column", gap: 5 }}
            >
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 22, height: 2, borderRadius: 2, background: T.primary,
                  transition: "all 0.2s",
                  transform: menuOpen
                    ? i === 0 ? "rotate(45deg) translate(5px, 5px)"
                    : i === 1 ? "scaleX(0)"
                    : "rotate(-45deg) translate(5px, -5px)"
                    : "none",
                }} />
              ))}
            </button>
          </div>
        </nav>

        {/* Mobile dropdown */}
        <div className={`mobile-menu ${menuOpen ? "open" : ""}`} style={{
          position: "fixed", top: 60, left: 0, right: 0, zIndex: 99,
          background: T.white, borderBottom: `1px solid ${T.border}`,
          padding: "8px 24px 16px",
        }}>
          {["Studio", "Parameters", "Output"].map((item) => (
            <div key={item} onClick={() => scrollTo(item.toLowerCase())} style={{
              padding: "13px 0", borderBottom: `1px solid ${T.border}`,
              fontSize: 14, color: activeNav === item.toLowerCase() ? T.green : T.secondary,
              fontWeight: activeNav === item.toLowerCase() ? 600 : 400,
              cursor: "pointer", letterSpacing: "0.04em",
            }}>{item}</div>
          ))}
          <div style={{ paddingTop: 12, fontSize: 11, color: T.muted }}>
            {apiChecking ? "Checking..." : apiLive ? "✓ Backend online" : "✗ Backend offline"}
          </div>
        </div>

        {/* ══ HERO ══ */}
        <section id="studio" style={{ paddingTop: 60 }}>
          <div className="section-grid">
            <div className="col-left">
              <p style={{ fontSize: 10, letterSpacing: "0.35em", textTransform: "uppercase", color: T.purpleMid, fontWeight: 600, marginBottom: 12 }}>
                Lace Your Audio · Premium Signal Experience
              </p>
              <h1 className="hero-h1" style={{ color: T.primary, marginBottom: 6 }}>Shape your</h1>
              <h1 className="hero-h1" style={{ color: T.green, marginBottom: 28, position: "relative", display: "inline-block" }}>
                audio.
                <span style={{
                  position: "absolute", bottom: -8, left: 0, width: "75%",
                  height: 4, borderRadius: 2,
                  background: `linear-gradient(90deg, ${T.green}, ${T.purpleMid}, transparent)`,
                }} />
              </h1>
              <p style={{ fontSize: 13, color: T.secondary, lineHeight: 1.9, maxWidth: 420, marginBottom: 28, marginTop: 8 }}>
                Change the pitch, speed, bass, and feel of any audio file.
                Upload a song, a voice recording, or a podcast clip — and hear the difference instantly.
              </p>

              {/* Feature pills — plain English */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 32 }}>
                {[
                  { label: "Pitch control",   green: true  },
                  { label: "Speed control",   green: true  },
                  { label: "Bass boost",       green: false },
                  { label: "Treble boost",     green: false },
                  { label: "Reverb",           green: true  },
                  { label: "Loudness adjust",  green: false },
                ].map(({ label, green }) => (
                  <span key={label} style={{
                    fontSize: 10, padding: "4px 11px", borderRadius: 99,
                    border: `1px solid ${green ? T.borderGreen : T.border}`,
                    color: green ? T.green : T.purple,
                    background: green ? T.greenTint : T.purpleTint, fontWeight: 500,
                  }}>{label}</span>
                ))}
              </div>

              {/* Stats — corrected limits */}
              <div style={{ display: "flex", gap: 32 }}>
                {[
                  { num: "6",    label: "Audio controls"  },
                  { num: "15MB", label: "Max file size"    },
                  { num: "5min", label: "Max audio length" },
                  { num: "WAV",  label: "Output format"   },
                ].map(({ num, label }) => (
                  <div key={label}>
                    <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: T.green, marginBottom: 4 }}>{num}</p>
                    <p style={{ fontSize: 10, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-right">
              <p style={{ fontSize: 10, letterSpacing: "0.35em", textTransform: "uppercase", color: T.tertiary, fontWeight: 600, marginBottom: 20 }}>
                Step 1 — Upload Your File
              </p>
              <div style={{ background: T.white, borderRadius: 20, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                <AudioUploader onFileSelect={setFile} selectedFile={file} />
              </div>

              {/* Limit hints under uploader */}
              <div style={{ marginTop: 10, display: "flex", gap: 16, justifyContent: "center" }}>
                {[
                  { icon: "📁", text: "WAV or MP3 only" },
                  { icon: "⚖️", text: "Max 15 MB"       },
                  { icon: "⏱️", text: "Max 5 minutes"   },
                ].map(({ icon, text }) => (
                  <span key={text} style={{ fontSize: 10, color: T.muted, display: "flex", alignItems: "center", gap: 4 }}>
                    <span>{icon}</span>{text}
                  </span>
                ))}
              </div>

              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
                  <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${T.border})` }} />
                  <span style={{ fontSize: 10, color: T.muted, letterSpacing: "0.2em", fontWeight: 600 }}>SCROLL TO CONFIGURE</span>
                  <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.border}, transparent)` }} />
                </div>
                <span onClick={() => scrollTo("parameters")} style={{ fontSize: 20, color: T.purpleMid, cursor: "pointer" }}>↓</span>
              </div>
            </div>
          </div>
        </section>

        {/* ══ SECTION 2 — Sliders + Waveform ══ */}
        <section id="parameters" style={{ borderTop: `1px solid ${T.border}` }}>
          <div className="section-grid">
            <div className="col-left col-start">
              <p style={{ fontSize: 10, letterSpacing: "0.35em", textTransform: "uppercase", color: T.purpleMid, fontWeight: 600, marginBottom: 12 }}>
                Step 2 — Configure
              </p>
              <h2 className="section-h2">Audio Controls</h2>
              <ParameterSliders params={params} onChange={setParams} />
            </div>
            <div className="col-right col-start">
              <p style={{ fontSize: 10, letterSpacing: "0.35em", textTransform: "uppercase", color: T.tertiary, fontWeight: 600, marginBottom: 12 }}>
                Visualization
              </p>
              <h2 className="section-h2">Waveform</h2>
              {result ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <WaveformCanvas data={result.original_waveform} label="Original" color="#52b788" duration={result.duration_original} />
                  <WaveformCanvas data={result.processed_waveform} label="Processed" color="#a78bda" duration={result.duration_processed} />
                </div>
              ) : (
                <div style={{ borderRadius: 16, background: T.white, border: `1px solid ${T.border}`, padding: "24px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 2, width: "100%", justifyContent: "center", overflow: "hidden" }}>
                    {Array.from({ length: 60 }).map((_, i) => (
                      <div key={i} style={{
                        width: 3, borderRadius: 3, flexShrink: 0,
                        height: `${Math.abs(Math.sin(i * 0.38) * Math.cos(i * 0.12)) * 55 + 8}px`,
                        background: i % 3 === 0 ? "rgba(91,63,160,0.25)" : i % 3 === 1 ? "rgba(26,71,49,0.22)" : "rgba(82,183,136,0.2)",
                      }} />
                    ))}
                  </div>
                  <p style={{ fontSize: 12, color: T.tertiary, fontWeight: 600, marginTop: 10 }}>Waveform will appear here</p>
                  <p style={{ fontSize: 11, color: T.muted }}>Process your audio to compare before and after</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ══ SECTION 3 — Summary + Result ══ */}
        <section id="output" style={{ borderTop: `1px solid ${T.border}` }}>
          <div className="section-grid">
            <div className="col-left col-start">
              <p style={{ fontSize: 10, letterSpacing: "0.35em", textTransform: "uppercase", color: T.purpleMid, fontWeight: 600, marginBottom: 12 }}>
                Step 3 — Process
              </p>
              <h2 className="section-h2">Your Settings</h2>
              <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${T.border}`, marginBottom: 20 }}>
                {[
                  { label: "Pitch shift",    value: `${params.pitch > 0 ? "+" : ""}${params.pitch} semitones`, green: true  },
                  { label: "Speed",          value: `${params.speed.toFixed(2)}×`,                             green: true  },
                  { label: "Bass boost",     value: `+${params.bass} dB`,                                      green: false },
                  { label: "Treble boost",   value: `+${params.treble} dB`,                                    green: true  },
                  { label: "Reverb",         value: `${params.reverb}%`,                                       green: false },
                  { label: "Loudness",       value: `${params.loudness > 0 ? "+" : ""}${params.loudness} dB`,  green: true  },
                ].map((row, i, arr) => (
                  <div key={row.label} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 16px",
                    background: i % 2 === 0 ? T.white : "#faf9fe",
                    borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none",
                  }}>
                    <span style={{ fontSize: 12, color: T.secondary }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: row.green ? T.green : T.purple }}>{row.value}</span>
                  </div>
                ))}
              </div>

              <ProcessButton state={state} disabled={!file} onClick={handleProcess} />
              <ProcessingProgress status={state.status} />
            </div>

            <div className="col-right col-start">
              <p style={{ fontSize: 10, letterSpacing: "0.35em", textTransform: "uppercase", color: T.tertiary, fontWeight: 600, marginBottom: 12 }}>
                Output
              </p>
              <h2 className="section-h2">Processed Audio</h2>
              {result ? (
                <div style={{ background: T.white, borderRadius: 16, border: `1px solid ${T.borderGreen}`, overflow: "hidden" }}>
                  <ResultPanel result={result} />
                </div>
              ) : (
                <div style={{ borderRadius: 16, background: T.white, border: `1px dashed ${T.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, minHeight: 200, padding: 24 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg, ${T.greenTint}, ${T.purpleTint})`, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="22" height="22" fill="none" stroke={T.green} strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 13, color: T.tertiary, fontWeight: 600, marginBottom: 6 }}>No output yet</p>
                    <p style={{ fontSize: 11, color: T.muted, lineHeight: 1.7 }}>Upload a file, adjust the controls,<br />and hit Process Audio</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop: `1px solid ${T.border}`, background: T.white }} className="footer-outer">
          <div className="footer-top">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img src="/logo.png" alt="AuraLace" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "contain" }} />
              <div>
                <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 800, color: T.green, letterSpacing: "0.08em" }}>AURALACE</span>
                <p style={{ fontSize: 10, color: T.muted, letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 2 }}>Premium Signal Studio</p>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["FastAPI", "Next.js", "Librosa", "NumPy", "SciPy"].map((tech) => (
                <span key={tech} style={{ fontSize: 10, padding: "4px 10px", borderRadius: 99, border: `1px solid ${T.border}`, color: T.tertiary, background: T.offWhite }}>{tech}</span>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {/* Limits reminder in footer */}
              <span style={{ fontSize: 10, color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>File Limits</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["WAV · MP3", "Max 15 MB", "Max 5 min"].map((tag) => (
                  <span key={tag} style={{ fontSize: 9, padding: "3px 10px", borderRadius: 99, border: `1px solid ${T.borderGreen}`, color: T.green, background: T.greenTint }}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span style={{ fontSize: 11, color: T.muted }}>© 2026 AuraLace. Open-source under MIT License.</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: apiChecking ? "#d1d5db" : apiLive ? "#22c55e" : "#ef4444", boxShadow: apiLive && !apiChecking ? "0 0 5px #22c55e88" : "none" }} />
              <span style={{ fontSize: 11, color: T.muted }}>{apiChecking ? "Checking..." : apiLive ? "All systems operational" : "Backend offline"}</span>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}