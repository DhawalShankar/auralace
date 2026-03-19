"use client";
import { useCallback, useState } from "react";

interface Props {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
}

export default function AudioUploader({ onFileSelect, selectedFile }: Props) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type.includes("audio") || file.name.match(/\.(wav|mp3)$/i))) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <label
      style={{
        display: "block",
        cursor: "pointer",
        background: dragging ? "#f0fdf4" : "#ffffff",
        borderRadius: 16,
        border: `2px dashed ${dragging ? "#16a34a" : "#e9d5ff"}`,
        transition: "all 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input type="file" accept=".wav,.mp3,audio/wav,audio/mpeg" style={{ display: "none" }} onChange={handleChange} />

      {/* Inline padding — not dependent on Tailwind */}
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 12,
        padding: "48px 32px",   // py-12 px-8 equivalent
        textAlign: "center",
      }}>
        {selectedFile ? (
          <>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 40 }}>
              {[4,7,10,14,10,7,12,8,5,9,13,7,4].map((h, i) => (
                <div key={i} style={{
                  width: 4, borderRadius: 2,
                  background: "#16a34a", opacity: 0.8,
                  height: `${h * 2.8}px`,
                }} />
              ))}
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#14532d", fontFamily: "Syne, sans-serif" }}>
              {selectedFile.name}
            </p>
            <p style={{ fontSize: 12, color: "#9ca3af", fontFamily: "monospace" }}>
              {formatSize(selectedFile.size)}
            </p>
            <p style={{ fontSize: 10, color: "#9ca3af" }}>click or drop to replace</p>
          </>
        ) : (
          <>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              border: "1px solid #e9d5ff",
              background: "linear-gradient(135deg, #faf5ff, #f0fdf4)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="20" height="20" fill="none" stroke="#15803d" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#1f2937", fontFamily: "Syne, sans-serif" }}>
                Drop your audio file here
              </p>
              <p style={{ fontSize: 12, color: "#9ca3af", fontFamily: "monospace", marginTop: 4 }}>
                WAV · MP3 · up to 15MB · max 5 min
              </p>
            </div>
            <span style={{
              fontSize: 12,
              border: "1px solid #e9d5ff",
              color: "#a78bfa",
              padding: "6px 16px",
              borderRadius: 99,
              background: "#ffffff",
            }}>
              or click to browse
            </span>
          </>
        )}
      </div>
    </label>
  );
}