import axios from "axios";
import { AudioParams, ProcessResponse } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function processAudio(
  file: File,
  params: AudioParams
): Promise<ProcessResponse> {
  const form = new FormData();
  form.append("audio",    file);
  form.append("pitch",    String(params.pitch));
  form.append("speed",    String(params.speed));
  form.append("bass",     String(params.bass));
  form.append("treble",   String(params.treble));
  form.append("reverb",   String(params.reverb));
  form.append("loudness", String(params.loudness));

  const { data } = await axios.post(`${BASE_URL}/api/process/`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  // Convert base64 WAV → blob URL so the browser can play it directly.
  // The blob URL lives in memory for this session — no server disk involved.
  const byteChars  = atob(data.audio_b64);
  const byteArrays = [];
  for (let i = 0; i < byteChars.length; i += 512) {
    const slice  = byteChars.slice(i, i + 512);
    const bytes  = new Uint8Array(slice.length);
    for (let j = 0; j < slice.length; j++) bytes[j] = slice.charCodeAt(j);
    byteArrays.push(bytes);
  }
  const blob    = new Blob(byteArrays, { type: "audio/wav" });
  const blobUrl = URL.createObjectURL(blob);

  return {
    ...data,
    audio_b64: blobUrl,   // replace raw base64 with ready-to-use blob URL
  };
}