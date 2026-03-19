# AuraLace — Frontend

## Name

**AuraLace** = **Aural** (relating to the ear / sound) + **Lace** (to weave, to thread together).

The name reflects what the system does: it weaves multiple DSP transforms — pitch shifting, time stretching, EQ, reverb, loudness normalization — into a single sequential pipeline. "Lacing" the transforms together aurally.

Secondary reading: **Aural Ace** — precise and sharp with sound.

---

## What This Repo Is

This is the **client layer** of a full-stack DSP system. It handles:

- Accepting audio input from the user (file upload)
- Collecting transform parameters (six DSP controls)
- Serializing and dispatching the request to the FastAPI backend via `multipart/form-data`
- Receiving and rendering the processed output (waveform arrays + downloadable WAV)

It does **zero signal processing itself**. All DSP runs on the Python backend. This frontend is purely a transport and presentation layer.

---

## System Context

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
    ├── numpy.fft.rfft/irfft           — FFT-based EQ (bass + treble)
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
Browser renders waveforms, serves download link
```

---

## Folder Structure

```
auralace/
│
├── app/
│   ├── globals.css          # global resets, font imports
│   ├── layout.tsx           # root HTML shell, metadata, font injection
│   └── page.tsx             # single page — state orchestrator, layout, section composition
│
├── components/
│   ├── AudioUploader.tsx    # drag-drop + browse input → emits File to parent
│   ├── ParameterSliders.tsx # six range inputs → emits AudioParams on change
│   ├── ProcessButton.tsx    # submit trigger, reads ProcessState for label/disabled
│   ├── ResultPanel.tsx      # renders url, filename, duration, download link
│   └── WaveForm.tsx         # canvas waveform renderer — takes number[200] + metadata
│
├── utils/
│   └── api.ts               # all HTTP — processAudio(), getMediaUrl()
│
├── types/
│   └── index.ts             # AudioParams, ProcessResponse, ProcessState, ProcessingStatus
│
├── public/
│   └── logo.png
│
├── .env.local               # NEXT_PUBLIC_API_URL (not committed)
├── .gitignore
├── next.config.ts
├── next-env.d.ts
├── eslint.config.mjs
└── package.json
```

### Key design decisions

`page.tsx` owns all state. Components are fully controlled — they receive props and fire callbacks. No component has its own fetch call or holds domain state. The entire application state at any point is readable in one file.

`utils/api.ts` is the only file that knows the backend exists. If the endpoint, payload shape, or transport changes, only this file changes.

`types/index.ts` is the shared contract. `AudioParams` is what the backend expects. `ProcessResponse` is what it returns. These are the source of truth — if the backend schema changes, update here and TypeScript surfaces every breakage immediately.

---

## Types

```typescript
export interface AudioParams {
  pitch:    number;
  speed:    number;
  bass:     number;
  treble:   number;
  reverb:   number;
  loudness: number;
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

## DSP Pipeline — Confirmed Mechanisms

The backend applies transforms in strict order. Order matters — time stretch before pitch shift, EQ before reverb, loudness before normalize.

| Stage | Parameter | Range | Backend call | Mechanism |
|-------|-----------|-------|-------------|-----------|
| 1 | `speed` | 0.5× – 2.0× | `librosa.effects.time_stretch(y, rate=speed)` | Phase vocoder — STFT-based time-scale modification. Pitch unchanged. `rate > 1.0` = faster/shorter, `rate < 1.0` = slower/longer. Skipped if within 0.01 of 1.0. |
| 2 | `pitch` | -12 to +12 st | `librosa.effects.pitch_shift(y, sr=sr, n_steps=pitch)` | Phase vocoder internally calls `time_stretch` then resamples to restore duration. Skipped if `abs(pitch) < 0.01`. |
| 3 | `bass` | 0 – 20 dB | `_fft_eq(y, sr, gain_db, cutoff=250.0, boost_below=True)` | `rfft` → sigmoid gain mask applied to frequency bins below 250Hz → `irfft`. Gain in linear: `10^(dB/20)`. Sigmoid transition width 200Hz (soft shelf, not brick-wall). Skipped if `bass < 0.01`. |
| 4 | `treble` | 0 – 20 dB | `_fft_eq(y, sr, gain_db, cutoff=4000.0, boost_below=False)` | Same FFT mechanism. Mirrored sigmoid — boosts bins above 4000Hz. Transition width 200Hz. Skipped if `treble < 0.01`. |
| 5 | `reverb` | 0 – 100% | `scipy.signal.fftconvolve(y, ir, mode="full")` | Convolution with a **synthetic** room IR. IR = white noise shaped by exponential decay envelope. Room size and decay length both scale with wet percentage. Wet signal RMS-normalized before mix. Dry always preserved: `dry = 1.0 - (wet * 0.5)`. Skipped if `reverb < 0.01`. |
| 6 | `loudness` | -20 to +20 dB | `y * 10^(dB/20)` | Linear gain applied to entire signal. Skipped if `abs(loudness) < 0.01`. |
| 7 | normalize | — | `y / max(abs(y)) * 0.95` | Peak normalize — always applied unconditionally. Output peak is always 0.95. Because this runs after loudness, the loudness parameter affects relative dynamics within the signal, not the absolute output level. |

**Output:** always `float32` WAV, written via `soundfile.write`. Sample rate preserved from input (no resampling).

---

## Waveform Data

Both `original_waveform` and `processed_waveform` in the response are exactly **200 points**.

Each point is the **peak amplitude** (not RMS, not mean) of a chunk of `len(y) // 200` samples:

```python
chunk_size = max(1, len(y) // num_points)
peak = float(np.max(np.abs(chunk)))  # peak, rounded to 4dp
```

Padded with `0.0` if the signal is shorter than 200 chunks. Trimmed to 200 if longer.

The frontend `WaveForm.tsx` renders these 200 values directly onto a canvas element.

---

## Data Flow (Request Lifecycle)

```
1. User drops/selects audio file
        → AudioUploader calls onFileSelect(File)
        → page.tsx: setFile(file)

2. User moves sliders
        → ParameterSliders calls onChange(AudioParams)
        → page.tsx: setParams(params)

3. User clicks Process
        → page.tsx: handleProcess()
        → setState({ status: "uploading" })
        → setState({ status: "processing" })
        → api.processAudio(file, params)

              FormData {
                audio:    File,        // key is "audio", not "file"
                pitch:    "-3",
                speed:    "1.25",
                bass:     "6",
                treble:   "0",
                reverb:   "40",
                loudness: "2"
              }
              POST {NEXT_PUBLIC_API_URL}/api/process/

4. Backend responds 200
        → setResult(ProcessResponse)
        → setState({ status: "done" })
        → WaveformCanvas draws original_waveform[200] and processed_waveform[200]
        → ResultPanel renders download via getMediaUrl(result.url)

5. Backend responds 400 / 500
        → setState({ status: "error", error: detail })
        → ProcessButton shows error state
```

---

## Backend Validation (server-side only, no client-side equivalent)

The backend clamps all parameters before processing:

```python
pitch    = max(-12.0, min(12.0,  pitch))
speed    = max(0.5,   min(2.0,   speed))
bass     = max(0.0,   min(20.0,  bass))
treble   = max(0.0,   min(20.0,  treble))
reverb   = max(0.0,   min(100.0, reverb))
loudness = max(-20.0, min(20.0,  loudness))
```

File type validation returns **HTTP 400** (not 415) for unsupported formats. Accepted: `audio/wav`, `audio/wave`, `audio/mpeg`, `audio/mp3`, `audio/x-wav`, `.wav`, `.mp3` by extension.

The frontend currently sends whatever the slider values are with no pre-validation. Out-of-range values are silently clamped by the backend.

Input file is deleted after processing regardless of success or failure (`finally: cleanup_input(input_path)`).

---

## Current Limitations

**No client-side validation.** File size, MIME type, and parameter bounds are not checked before the request fires. A 200MB file or a `.pdf` goes all the way to the backend before being rejected with a 400.

**No in-browser audio playback.** There is no `<audio>` element. Users must download the WAV and open it externally to hear the result.

**Waveform requires a backend round-trip.** `original_waveform` comes from the backend response, not from client-side decoding. The browser cannot show the waveform until processing completes, even though it has the file locally.

**No request cancellation.** Once Process is clicked there is no abort. No `AbortController`, no cancel button.

**Non-deterministic reverb.** The IR in `apply_reverb` is generated with `np.random.randn` and no fixed seed. Two identical requests with identical parameters produce slightly different reverb tails. Output is not reproducible.

**No processing history.** Each session starts fresh. No way to compare two parameter configurations or re-download a previous result.

**No streaming or progress.** The backend processes synchronously. Long files block until all 7 stages complete with no intermediate feedback.

**Cold start latency.** Render's free tier spins down after inactivity. First request after idle can take 10–30 seconds. The frontend has no awareness — the button appears frozen with no explanation.

**Mobile layout unaddressed.** Two-column grid collapses poorly below 768px.

**Fonts load from Google Fonts CDN.** Render-blocking external request. Breaks in offline or restricted-network environments.

---

## Potential Improvements

### Immediate (low effort, high impact)

**Client-side pre-validation.**
Before sending, reject bad inputs immediately:
```typescript
if (file.size > 50 * 1024 * 1024) throw new Error("File exceeds 50MB limit");
if (!file.type.startsWith("audio/")) throw new Error("Only audio files accepted");
```
Avoids unnecessary backend calls and gives instant feedback.

**In-browser audio playback.**
After processing, render:
```tsx
<audio controls src={getMediaUrl(result.url)} />
```
Zero backend dependency. Works immediately with the `url` field already in `ProcessResponse`.

**Cold-start warning.**
On page mount, fire `GET /` to the backend (it returns `{"status":"running"}`). If response takes more than 2 seconds, show "Backend is warming up..." and disable the Process button until it responds. Eliminates the frozen-button confusion.

**Fix non-deterministic reverb.**
In `dsp/reverb.py`, add before the IR generation:
```python
np.random.seed(42)
noise = np.random.randn(length)
```
Same parameters will now always produce the same output. Required for any kind of reproducible testing.

### Medium (moderate effort)

**Client-side waveform on upload.**
Use `AudioContext.decodeAudioData()` to decode the uploaded file in the browser and draw `original_waveform` immediately — before any backend call:
```typescript
const arrayBuffer = await file.arrayBuffer();
const audioCtx = new AudioContext();
const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
const samples = audioBuffer.getChannelData(0); // Float32Array
```
Removes the dependency on `original_waveform` from the response entirely.

**Request cancellation.**
Wrap the axios call with an `AbortController`. Expose a Cancel button during processing. Essential when iterating on parameters for long files:
```typescript
const controller = new AbortController();
await axios.post(url, formData, { signal: controller.signal });
```

**Shareable parameter URLs.**
Encode `AudioParams` into the query string on every slider change:
```
/studio?pitch=-3&speed=1.2&bass=6&treble=0&reverb=40&loudness=2
```
On mount, parse and initialize state from query params. Users can share exact configurations. No backend required.

**Session history.**
After each successful process, append to `localStorage`:
```typescript
{ timestamp, filename, params, url, duration_processed, sample_rate }
```
Render a collapsible history panel. Users can restore params or re-download without reprocessing.

**Named presets.**
A preset is just a saved `AudioParams` object:
```typescript
const PRESETS: Record<string, AudioParams> = {
  "Vaporwave":       { pitch: -4, speed: 0.8, bass: 4,  treble: 0, reverb: 60, loudness: 0  },
  "Chipmunk":        { pitch: 7,  speed: 1.4, bass: 0,  treble: 3, reverb: 0,  loudness: 2  },
  "Podcast cleanup": { pitch: 0,  speed: 1.0, bass: 0,  treble: 5, reverb: 0,  loudness: 6  },
  "Lo-fi":           { pitch: -2, speed: 0.9, bass: 6,  treble: 0, reverb: 30, loudness: -2 },
};
```
Clicking a preset calls `setParams(PRESETS[name])`. One line of state update.

### Longer term

**WebSocket or SSE for per-stage progress.**
Replace the blocking POST with a WebSocket. Backend emits events as each stage completes:
```json
{ "stage": "time_stretch", "progress": 0.14 }
{ "stage": "pitch_shift",  "progress": 0.28 }
{ "stage": "bass_boost",   "progress": 0.42 }
...
```
Frontend renders a live progress bar per stage. Meaningful for files longer than ~30 seconds.

**Batch processing.**
Accept a queue of files, process sequentially with the same params. Per-file status (pending / processing / done / error). Useful for processing multiple takes with identical settings.

**Self-host fonts.**
Move Syne and DM Mono into `/public/fonts/`, use `next/font/local`. Eliminates the Google Fonts CDN request. Works offline. Faster LCP.

**Build-time env validation.**
In `next.config.ts`:
```typescript
if (!process.env.NEXT_PUBLIC_API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not set");
}
```
Fails the build explicitly instead of silently falling back to localhost and shipping broken to production.

**Retry with exponential backoff.**
Wrap `processAudio()` with automatic retry (max 3 attempts, 1s / 2s / 4s delays). Catches transient 503s from Render cold starts automatically without user intervention.

---

## Environment

```env
# .env.local
NEXT_PUBLIC_API_URL=https://auralace-backend.onrender.com
```

Falls back to `http://localhost:8000` if unset. Set in Vercel dashboard for production — never commit `.env.local`.

---

## License

MIT