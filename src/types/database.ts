/**
 * Database types for FrameOS Transcription Core
 */

export type VideoStatus = 'uploaded' | 'processing' | 'ready' | 'error';
export type JobStatus = 'queued' | 'processing' | 'done' | 'error';

export interface Profile {
  id: string;
  email: string;
  created_at: string;
}

export interface Video {
  id: string;
  user_id: string;
  storage_path_encrypted: string;
  original_filename_hash: string;
  original_filename_encrypted: string;
  status: VideoStatus;
  created_at: string;
  updated_at: string;
}

export interface TranscriptionJob {
  id: string;
  video_id: string;
  provider: string;
  status: JobStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface TranscriptionSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

export interface Transcription {
  id: string;
  video_id: string;
  job_id: string;
  language: string;
  raw_text_encrypted: string;
  segments_encrypted: string; // JSON string of TranscriptionSegment[]
  created_at: string;
}
