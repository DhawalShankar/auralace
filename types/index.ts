export interface AudioParams {
  pitch: number;
  speed: number;
  bass: number;
  treble: number;
  reverb: number;
  loudness: number;
}

export type ProcessingStatus = "idle" | "uploading" | "processing" | "done" | "error";

export interface ProcessState {
  status: ProcessingStatus;
  error?: string;
}

export interface ProcessResponse {
  url: string;
  filename: string;
  original_waveform: number[];
  processed_waveform: number[];
  duration_original: number;
  duration_processed: number;
  sample_rate: number;
}