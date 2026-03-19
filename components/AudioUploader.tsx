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
      className={`block cursor-pointer bg-white rounded-2xl border-2 border-dashed transition-all shadow-sm ${
        dragging ? "border-green-600 bg-green-50" : "border-purple-200 hover:border-purple-400 hover:bg-purple-50/30"
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input type="file" accept=".wav,.mp3,audio/wav,audio/mpeg" className="hidden" onChange={handleChange} />

      <div className="flex flex-col items-center justify-center gap-3 py-12 px-8 text-center">
        {selectedFile ? (
          <>
            <div className="flex items-end gap-0.5 h-10">
              {[4,7,10,14,10,7,12,8,5,9,13,7,4].map((h, i) => (
                <div key={i} className="w-1 bg-green-600 rounded-sm opacity-80"
                  style={{ height: `${h * 2.8}px` }} />
              ))}
            </div>
            <p className="text-sm font-semibold text-green-800" style={{ fontFamily: 'Syne, sans-serif' }}>
              {selectedFile.name}
            </p>
            <p className="text-xs text-gray-400 font-mono">{formatSize(selectedFile.size)}</p>
            <p className="text-[10px] text-gray-400">click or drop to replace</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-xl border border-purple-200 bg-linear-to-br from-purple-50 to-green-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800" style={{ fontFamily: 'Syne, sans-serif' }}>
                Drop your audio file here
              </p>
              <p className="text-xs text-gray-400 font-mono mt-1">WAV · MP3 · up to 50MB</p>
            </div>
            <span className="text-xs border border-purple-200 text-purple-400 px-4 py-1.5 rounded-full bg-white">
              or click to browse
            </span>
          </>
        )}
      </div>
    </label>
  );
}