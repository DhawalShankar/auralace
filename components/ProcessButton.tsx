"use client";

import { ProcessState, ProcessingStatus } from "@/types";

export interface ProcessButtonProps {
  state: ProcessState;
  disabled: boolean;
  onClick: () => void;
}

const statusConfig: Record<ProcessingStatus, { label: string; icon: string | null }> = {
  idle:       { label: "Process Audio",     icon: "▶" },
  uploading:  { label: "Uploading...",      icon: null },
  processing: { label: "Processing DSP...", icon: null },
  done:       { label: "Process Again",     icon: "▶" },
  error:      { label: "Retry",             icon: "↺" },
};

export default function ProcessButton({ state, disabled, onClick }: ProcessButtonProps) {
  const isLoading = state.status === "uploading" || state.status === "processing";
  const config = statusConfig[state.status];

  return (
    <div>
      <button
        onClick={onClick}
        disabled={disabled || isLoading}
        className="w-full py-4 rounded-xl font-bold tracking-widest uppercase text-sm text-white bg-green-800 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-[0.99]"
        style={{ fontFamily: 'Syne, sans-serif' }}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="flex items-end gap-0.5 h-4">
              {[3,5,4,6,3].map((h, i) => (
                <span key={i} className="w-0.5 bg-white/70 rounded-sm animate-bounce"
                  style={{ height: `${h * 2}px`, animationDelay: `${i * 0.1}s` }} />
              ))}
            </span>
            {config.label}
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            {config.icon && <span>{config.icon}</span>}
            {config.label}
          </span>
        )}
      </button>

      {state.status === "error" && state.error && (
        <p className="mt-2 text-xs text-red-500 text-center font-mono">⚠ {state.error}</p>
      )}
    </div>
  );
}