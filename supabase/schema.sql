-- FrameOS Transcription Core Database Schema
-- Multi-tenancy with Row Level Security (RLS)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE (SHARED - tüm modüller için ortak)
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================================
-- VIDEOS TABLE (FramePilot module)
-- ============================================================================
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  storage_path_encrypted TEXT NOT NULL,
  original_filename_hash TEXT NOT NULL,
  original_filename_encrypted TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('uploaded', 'processing', 'ready', 'error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_filename_hash ON videos(original_filename_hash);

-- RLS Policies for videos
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own videos"
  ON videos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own videos"
  ON videos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own videos"
  ON videos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own videos"
  ON videos FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRANSCRIPTION_JOBS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS transcription_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'openai',
  status TEXT NOT NULL CHECK (status IN ('queued', 'processing', 'done', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_jobs_video_id ON transcription_jobs(video_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON transcription_jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON transcription_jobs(created_at DESC);

-- RLS Policies for transcription_jobs
ALTER TABLE transcription_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jobs"
  ON transcription_jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM videos
      WHERE videos.id = transcription_jobs.video_id
      AND videos.user_id = auth.uid()
    )
  );

-- ============================================================================
-- TRANSCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS transcriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES transcription_jobs(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  raw_text_encrypted TEXT NOT NULL,
  segments_encrypted TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transcriptions_video_id ON transcriptions(video_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_job_id ON transcriptions(job_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_language ON transcriptions(language);

-- RLS Policies for transcriptions
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transcriptions"
  ON transcriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM videos
      WHERE videos.id = transcriptions.video_id
      AND videos.user_id = auth.uid()
    )
  );

-- ============================================================================
-- STORAGE BUCKETS & POLICIES
-- ============================================================================

-- Create videos bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
-- Users can upload to their own folder
CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'videos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can view their own files
CREATE POLICY "Users can view own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'videos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own files
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'videos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for videos table
DROP TRIGGER IF EXISTS update_videos_updated_at ON videos;
CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON videos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for transcription_jobs table
DROP TRIGGER IF EXISTS update_jobs_updated_at ON transcription_jobs;
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON transcription_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE profiles IS 'User profiles - SHARED across all modules';
COMMENT ON TABLE videos IS 'Video metadata - FramePilot module';
COMMENT ON TABLE transcription_jobs IS 'Transcription job queue';
COMMENT ON TABLE transcriptions IS 'Transcription results (encrypted)';

COMMENT ON COLUMN videos.storage_path_encrypted IS 'AES-256-GCM encrypted storage path';
COMMENT ON COLUMN videos.original_filename_hash IS 'SHA-256 hash for search';
COMMENT ON COLUMN videos.original_filename_encrypted IS 'AES-256-GCM encrypted filename';
COMMENT ON COLUMN transcriptions.raw_text_encrypted IS 'AES-256-GCM encrypted transcription text';
COMMENT ON COLUMN transcriptions.segments_encrypted IS 'AES-256-GCM encrypted segments JSON';
