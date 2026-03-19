import axios from "axios";
import { AudioParams, ProcessResponse } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function processAudio(file: File, params: AudioParams): Promise<ProcessResponse> {
  const formData = new FormData();
  formData.append("audio", file);
  formData.append("pitch",    String(params.pitch));
  formData.append("speed",    String(params.speed));
  formData.append("bass",     String(params.bass));
  formData.append("treble",   String(params.treble));
  formData.append("reverb",   String(params.reverb));
  formData.append("loudness", String(params.loudness));

  const response = await axios.post<ProcessResponse>(
    `${BASE_URL}/api/process/`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
}

export function getMediaUrl(path: string): string {
  return `${BASE_URL}${path}`;
}