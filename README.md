# Aural Ace

**Aural** — of or relating to the ear. **Ace** — precise, sharp, dominant.

Aural Ace is an audio signal processing system. You give it audio. It transforms it — pitch, time, equalisation, reverb, loudness — and gives it back. The processing pipeline is deterministic, strictly ordered, and runs entirely on the backend. The client does one thing: put audio in, get processed audio out.

---

## What This Is

Aural Ace is the **client layer** of a full-stack audio signal processing system. It handles:

- Audio file ingestion via drag-drop or file browser
- Six audio processing parameters exposed as range controls
- Serialization and dispatch to the FastAPI backend via `multipart/form-data`
- Rendering of dual waveforms (original vs. processed) and a WAV download

All audio processing runs on the Python backend. No signal processing occurs in the browser. This client is a transport and presentation layer — nothing more, nothing less.
---

## System Architecture

```
Browser (this repo)
    │
    │  POST /api/process/
    │  multipart/form-data
    │  { audio: File, pitch, speed, bass, treble, reverb, loudness }
    │
    ▼
FastAPI Backend (auralace-backend)
    │
    ├── librosa.effects.time_stretch   — phase vocoder TSM
    ├── librosa.effects.pitch_shift    — phase vocoder + resample
    ├── numpy.fft.rfft/irfft           — frequency-domain equalisation (bass + treble)
    ├── scipy.signal.fftconvolve       — convolution reverb
    ├── linear gain                    — loudness
    └── peak normalize → 0.95          — clipping prevention
    │
    ▼
ProcessResponse {
    url:                string      // "/media/output_{uid}.wav"
    filename:           string      // "output_{uid}.wav"
    original_waveform:  number[]    // 200 peak-amplitude points
    processed_waveform: number[]    // 200 peak-amplitude points
    duration_original:  number      // seconds, rounded to 2dp
    duration_processed: number      // seconds, rounded to 2dp
    sample_rate:        number      // native SR of the uploaded file
}
    │
    ▼
Browser renders waveforms + download link
```

---

## Repository Structure

```
auralace/
│
├── app/
│   ├── globals.css          # Global resets, font imports
│   ├── layout.tsx           # Root HTML shell, metadata, font injection
│   └── page.tsx             # State orchestrator — the only file that owns state
│
├── components/
│   ├── AudioUploader.tsx    # Drag-drop + browse → emits File to parent
│   ├── ParameterSliders.tsx # Six range inputs → emits AudioParams on change
│   ├── ProcessButton.tsx    # Submit trigger, driven by ProcessState
│   ├── ResultPanel.tsx      # Renders url, filename, duration, download link
│   └── WaveForm.tsx         # Canvas waveform renderer — 200 peak-amplitude points
│
├── utils/
│   └── api.ts               # All HTTP — processAudio(), getMediaUrl()
│
├── types/
│   └── index.ts             # AudioParams, ProcessResponse, ProcessState, ProcessingStatus
│
├── public/
│   └── logo.png
│
├── .env.local               # NEXT_PUBLIC_API_URL — never committed
├── next.config.ts
└── package.json
```

### Architecture Principles

**`page.tsx` owns all state.** Components are fully controlled — they receive props and fire callbacks. No component holds its own domain state or makes its own network calls. The entire application state at any moment is readable in one file.

**`utils/api.ts` is the only file that knows the backend exists.** If the endpoint, payload shape, or transport changes, exactly one file changes. Nothing else breaks.

**`types/index.ts` is the contract.** `AudioParams` defines what the backend expects. `ProcessResponse` defines what it returns. If the backend schema changes, update here — TypeScript will surface every breakage immediately.

---

## Types

```typescript
export interface AudioParams {
  pitch:    number;   // -12 to +12 semitones
  speed:    number;   // 0.5× – 2.0×
  bass:     number;   // 0 – 20 dB
  treble:   number;   // 0 – 20 dB
  reverb:   number;   // 0 – 100%
  loudness: number;   // -20 to +20 dB
}

export type ProcessingStatus = "idle" | "uploading" | "processing" | "done" | "error";

export interface ProcessState {
  status: ProcessingStatus;
  error?: string;
}

export interface ProcessResponse {
  url:                string;
  filename:           string;
  original_waveform:  number[];
  processed_waveform: number[];
  duration_original:  number;
  duration_processed: number;
  sample_rate:        number;
}
```

---

## Audio Processing Pipeline

Transforms execute in strict sequence. Order is not configurable — it is enforced by the backend. Time stretch runs before pitch shift. Equalisation runs before reverb. Loudness runs before normalisation. This ordering is intentional and load-bearing.

| Stage | Parameter | Range | Mechanism |
|-------|-----------|-------|-----------|
| 1 | `speed` | 0.5× – 2.0× | `librosa.effects.time_stretch` — STFT-based phase vocoder. Pitch is preserved. `rate > 1.0` = faster. Skipped if within 0.01 of 1.0. |
| 2 | `pitch` | -12 to +12 st | `librosa.effects.pitch_shift` — internally calls `time_stretch` then resamples to restore duration. Skipped if `abs(pitch) < 0.01`. |
| 3 | `bass` | 0 – 20 dB | `rfft` → sigmoid gain mask on bins below 250 Hz → `irfft`. Transition width 200 Hz (soft shelf). Skipped if `bass < 0.01`. |
| 4 | `treble` | 0 – 20 dB | Same frequency-domain mechanism, mirrored — boosts bins above 4000 Hz. Transition width 200 Hz. Skipped if `treble < 0.01`. |
| 5 | `reverb` | 0 – 100% | `scipy.signal.fftconvolve` with a synthetic room IR. Exponential decay envelope. Wet signal RMS-normalized. Dry preserved: `dry = 1.0 - (wet * 0.5)`. Skipped if `reverb < 0.01`. |
| 6 | `loudness` | -20 to +20 dB | Linear gain: `y * 10^(dB/20)`. Affects relative dynamics, not absolute output level (normalize runs after). Skipped if `abs(loudness) < 0.01`. |
| 7 | normalise | — | `y / max(abs(y)) * 0.95` — always applied unconditionally. Output peak is always 0.95. |

**Output:** `float32` WAV via `soundfile.write`. Sample rate is preserved from input — no resampling occurs.

---

## Waveform Data

Both `original_waveform` and `processed_waveform` are exactly **200 points**. Each point is the **peak amplitude** of a `len(y) // 200` sample chunk:

```python
chunk_size = max(1, len(y) // num_points)
peak = float(np.max(np.abs(chunk)))  # peak, rounded to 4dp
```

Padded with `0.0` if the signal is under 200 chunks. Trimmed to 200 if over. `WaveForm.tsx` renders these values directly to a canvas element.

---

## Request Lifecycle

```
1. File selected
       → AudioUploader fires onFileSelect(File)
       → page.tsx: setFile(file)

2. Sliders adjusted
       → ParameterSliders fires onChange(AudioParams)
       → page.tsx: setParams(params)

3. Process clicked
       → page.tsx: handleProcess()
       → setState({ status: "uploading" })
       → setState({ status: "processing" })
       → api.processAudio(file, params)

             FormData {
               audio:    File,      // key is "audio", not "file"
               pitch:    "-3",
               speed:    "1.25",
               bass:     "6",
               treble:   "0",
               reverb:   "40",
               loudness: "2"
             }
             POST {NEXT_PUBLIC_API_URL}/api/process/

4. 200 response
       → setResult(ProcessResponse)
       → setState({ status: "done" })
       → WaveformCanvas draws original_waveform[200] and processed_waveform[200]
       → ResultPanel renders download via getMediaUrl(result.url)

5. 400 / 500 response
       → setState({ status: "error", error: detail })
       → ProcessButton surfaces error state
```

---

## Backend Validation

The backend clamps all parameters server-side. The client sends slider values as-is — out-of-range inputs are silently corrected:

```python
pitch    = max(-12.0, min(12.0,  pitch))
speed    = max(0.5,   min(2.0,   speed))
bass     = max(0.0,   min(20.0,  bass))
treble   = max(0.0,   min(20.0,  treble))
reverb   = max(0.0,   min(100.0, reverb))
loudness = max(-20.0, min(20.0,  loudness))
```

Unsupported file types return **HTTP 400**. Accepted: `audio/wav`, `audio/wave`, `audio/mpeg`, `audio/mp3`, `audio/x-wav`, `.wav`, `.mp3`.

Input files are deleted after processing regardless of success or failure (`finally: cleanup_input(input_path)`).

---

## Known Limitations

**No client-side validation.** File size, MIME type, and parameter bounds are unchecked before dispatch. A 200 MB file or a PDF goes all the way to the backend before being rejected.

**No in-browser playback.** There is no `<audio>` element. The user downloads the WAV and opens it externally.

**Waveform requires a backend round-trip.** `original_waveform` comes from the response — not from client-side decoding. The browser cannot show the source waveform until processing completes, even though it has the file locally.

**No request cancellation.** Once Process is clicked there is no abort. No `AbortController`. No cancel button.

**Non-deterministic reverb.** The IR is generated with `np.random.randn` and no fixed seed. Two identical requests with identical parameters produce slightly different reverb tails. Output is not reproducible.

**No processing history.** Each session is stateless. No way to compare configurations or re-download a previous result.

**No streaming or progress.** The backend processes synchronously. Long files block until all 7 stages complete with no intermediate feedback.

**Cold start latency.** Render's free tier spins down after inactivity. First request after idle can take 10–30 seconds. The frontend has no awareness of this — the button appears frozen.

**Mobile layout unaddressed.** The two-column grid collapses poorly below 768px.

**Google Fonts CDN dependency.** Render-blocking external request. Breaks in offline or restricted-network environments.

---

## Planned Improvements

### Immediate

**Client-side pre-validation** — reject bad inputs before any network call:
```typescript
if (file.size > 50 * 1024 * 1024) throw new Error("File exceeds 50MB limit");
if (!file.type.startsWith("audio/")) throw new Error("Only audio files accepted");
```

**In-browser audio playback** — the `url` field is already in `ProcessResponse`. This is one line:
```tsx
<audio controls src={getMediaUrl(result.url)} />
```

**Cold-start detection** — on mount, fire `GET /` to the backend. If response takes over 2 seconds, surface "Backend warming up…" and hold the Process button until it responds.

**Fix non-deterministic reverb** — seed the RNG before IR generation:
```python
np.random.seed(42)
noise = np.random.randn(length)
```

### Medium-term

**Client-side waveform on upload** — decode the file in the browser via `AudioContext.decodeAudioData()` and draw `original_waveform` immediately, before the backend call:
```typescript
const arrayBuffer = await file.arrayBuffer();
const audioCtx = new AudioContext();
const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
const samples = audioBuffer.getChannelData(0);
```

**Request cancellation** — `AbortController` + a visible cancel button during processing:
```typescript
const controller = new AbortController();
await axios.post(url, formData, { signal: controller.signal });
```

**Shareable parameter URLs** — encode `AudioParams` into the query string on every slider change. Parse on mount. No backend required:
```
/studio?pitch=-3&speed=1.2&bass=6&treble=0&reverb=40&loudness=2
```

**Session history** — append to `localStorage` after each successful process. Render a collapsible panel. Restore params or re-download without reprocessing.

**Named presets** — a preset is an `AudioParams` object. Clicking one calls `setParams()`. One line of state:
```typescript
const PRESETS: Record<string, AudioParams> = {
  "Vaporwave":       { pitch: -4, speed: 0.8, bass: 4,  treble: 0, reverb: 60, loudness: 0  },
  "Chipmunk":        { pitch: 7,  speed: 1.4, bass: 0,  treble: 3, reverb: 0,  loudness: 2  },
  "Podcast cleanup": { pitch: 0,  speed: 1.0, bass: 0,  treble: 5, reverb: 0,  loudness: 6  },
  "Lo-fi":           { pitch: -2, speed: 0.9, bass: 6,  treble: 0, reverb: 30, loudness: -2 },
};
```

### Longer-term

**WebSocket / SSE per-stage progress** — replace the blocking POST. Backend emits events as each stage completes. Frontend renders a live progress bar. Meaningful for files over ~30 seconds.

**Batch processing** — accept a file queue, process sequentially with identical params, expose per-file status.

**Self-host fonts** — move Syne and DM Mono into `/public/fonts/`, use `next/font/local`. Eliminates the CDN dependency. Works offline. Faster LCP.

**Build-time env validation** — fail the build explicitly if `NEXT_PUBLIC_API_URL` is unset:
```typescript
if (!process.env.NEXT_PUBLIC_API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not set");
}
```

**Retry with exponential backoff** — wrap `processAudio()` with automatic retry (3 attempts, 1s / 2s / 4s delays). Handles transient 503s from Render cold starts without user intervention.

---

## Environment

```env
# .env.local
NEXT_PUBLIC_API_URL=https://auralace-backend.onrender.com
```

Falls back to `http://localhost:8000` if unset. Set in the Vercel dashboard for production. Never commit `.env.local`.

---

## License

MIT