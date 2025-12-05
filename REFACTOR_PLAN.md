# 🔧 FrameOS - Refactor & Architecture Action Plan

**Tarih:** 5 Aralık 2025  
**Durum:** CTO-Level Architecture Review  
**Hedef:** Production-Ready, Scalable, Maintainable

---

## 📋 Executive Summary

**Mevcut Durum:**
- ✅ MVP çalışıyor, AI pipeline sağlam
- ❌ Dokümantasyon ile kod arasında GAP var
- ❌ Modüler mimari kağıt üstünde, kod dağınık
- ❌ "God service" pattern'i (openai.ts, directorAI.ts)
- ❌ Observability sıfır
- ❌ Multi-tenant hazırlığı yok

**Kritik Bulgular:**
1. **Architecture Gap** - Guide diyor "modules/framepilot", kod diyor "lib/*.ts"
2. **God Services** - openai.ts + directorAI.ts çok şey yapıyor
3. **Zero Observability** - Logging, metrics, cost tracking yok
4. **Sync Pipeline** - Long-running HTTP, job queue yok
5. **Technical Debt** - Unused files, test endpoints production'da

---

## 🎯 3-Phase Refactor Plan

### Phase 1: Cleanup & Security (1-2 Days)
### Phase 2: Modularization (1 Week)  
### Phase 3: Job-Based Architecture (1 Week)

---

## 🔴 Phase 1: Cleanup & Security (1-2 Days)

### 1.1 Remove Technical Debt

**Unused/Test Files:**
```bash
# Delete these
rm -rf src/app/test-preprocessing/
rm -rf src/app/api/test-preprocessing/
rm -rf src/app/api/test-env/
rm -rf src/app/api/transcribe/  # Redundant, not used
```

**Status:** 
- ✅ test-preprocessing/ - Empty folder
- ⚠️ test-env/ - **SECURITY RISK** - Exposes env keys
- ❌ transcribe/ - Redundant endpoint

**Action:**
```bash
git rm -rf src/app/test-preprocessing
git rm -rf src/app/api/test-preprocessing
git rm -rf src/app/api/test-env
git rm -rf src/app/api/transcribe
git commit -m "chore: Remove unused test endpoints and folders"
```

---

### 1.2 Fix Environment & Upload Limits

**Current Inconsistency:**
- `.env.local.example`: MAX_UPLOAD_MB=200
- `next.config.mjs`: bodySizeLimit='100mb'
- `upload/page.tsx`: MAX_SIZE_MB=100

**Solution:**
```typescript
// .env.local
MAX_UPLOAD_MB=100

// next.config.mjs
const maxUploadMB = process.env.MAX_UPLOAD_MB || '100';
experimental: {
  serverActions: {
    bodySizeLimit: `${maxUploadMB}mb`,
  },
}

// upload/page.tsx
const MAX_SIZE_MB = parseInt(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB || '100');
```

---

### 1.3 Add Logging Infrastructure

**Create:** `src/lib/logger.ts`

```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogContext = Record<string, any>;

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
}

class Logger {
  private context: LogContext = {};

  constructor(defaultContext?: LogContext) {
    this.context = defaultContext || {};
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...context },
      ...(error && { error: { message: error.message, stack: error.stack } }),
    };

    // Console output
    console[level === 'debug' ? 'log' : level](JSON.stringify(entry));

    // TODO: Send to Supabase logs table or APM
    // if (process.env.NODE_ENV === 'production') {
    //   await supabase.from('logs').insert(entry);
    // }
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.log('error', message, context, error);
  }

  child(context: LogContext): Logger {
    return new Logger({ ...this.context, ...context });
  }
}

export const logger = new Logger();
export { Logger };
```

---

### 1.4 Fix CinematicDirector Observability

**Current Issues:**
- No JSON parse error handling
- No retry logic
- No cost tracking
- No performance metrics

**Fix:** `src/lib/directors/cinematicDirector.ts`

```typescript
import { logger } from '@/lib/logger';

export async function analyzeCinematic(
  framePaths: string[],
  transcription?: any
): Promise<CinematicAnalysis> {
  const startTime = performance.now();
  const log = logger.child({ 
    function: 'analyzeCinematic',
    frameCount: framePaths.length 
  });

  log.info('Starting cinematic analysis');

  try {
    // ... existing code ...

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [...],
      max_tokens: 2000,
    });

    const duration = performance.now() - startTime;
    const tokens = response.usage?.total_tokens || 0;
    const cost = calculateCost('gpt-4o', tokens);

    log.info('Cinematic analysis completed', {
      duration: `${duration.toFixed(2)}ms`,
      tokens,
      cost: `$${cost.toFixed(4)}`,
      model: response.model,
    });

    // Parse with error handling
    const rawContent = response.choices[0]?.message?.content || '{}';
    let result: CinematicAnalysis;

    try {
      const cleaned = rawContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      result = JSON.parse(cleaned);
    } catch (parseError) {
      log.error('JSON parse failed', parseError as Error, {
        rawContent: rawContent.substring(0, 500),
      });
      throw new Error('Failed to parse cinematic analysis response');
    }

    return result;
  } catch (error: any) {
    const duration = performance.now() - startTime;
    log.error('Cinematic analysis failed', error, {
      duration: `${duration.toFixed(2)}ms`,
      errorType: error?.constructor?.name,
      errorCode: error?.code,
      errorStatus: error?.status,
    });
    throw error;
  }
}

function calculateCost(model: string, tokens: number): number {
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 0.005 / 1000, output: 0.015 / 1000 },
    'gpt-4-turbo': { input: 0.01 / 1000, output: 0.03 / 1000 },
  };
  
  const price = pricing[model] || pricing['gpt-4o'];
  return tokens * ((price.input + price.output) / 2); // Rough estimate
}
```

---

## 🟡 Phase 2: Modularization (1 Week)

### 2.1 Create FramePilot Module Structure

**Target Structure:**
```
src/modules/framepilot/
├── index.ts              # Public API
├── service.ts            # Orchestration layer
├── parser.ts             # Data normalization
├── db.ts                 # Supabase CRUD
├── types.ts              # Module types
├── ai/
│   ├── transcription.ts  # Whisper wrapper
│   ├── cinematic.ts      # GPT-4 Vision wrapper
│   └── director.ts       # Director AI wrapper
└── prompts/
    ├── scene-director.ts
    ├── script-rewrite.ts
    └── full-rewrite.ts
```

**Implementation:**

**Step 1:** Create module structure
```bash
mkdir -p src/modules/framepilot/ai
mkdir -p src/modules/framepilot/prompts
```

**Step 2:** `src/modules/framepilot/types.ts`
```typescript
export interface VideoAnalysisRequest {
  videoFile: File;
  userId: string;
}

export interface VideoAnalysisResult {
  videoId: string;
  transcription: TranscriptionResult;
  cinematic: CinematicAnalysis;
}

export interface DirectorRequest {
  videoId: string;
  transcription: TranscriptionResult;
  cinematic?: CinematicAnalysis;
  mode: DirectorMode;
}

export type DirectorMode = 'scene_director' | 'script_rewrite' | 'full_rewrite';

// ... other types
```

**Step 3:** `src/modules/framepilot/service.ts`
```typescript
import { logger } from '@/lib/logger';
import { transcribeVideo } from './ai/transcription';
import { analyzeCinematic } from './ai/cinematic';
import { analyzeWithDirector } from './ai/director';
import * as db from './db';

export class FramePilotService {
  private log = logger.child({ module: 'framepilot' });

  async analyzeVideo(request: VideoAnalysisRequest): Promise<VideoAnalysisResult> {
    this.log.info('Starting video analysis', { userId: request.userId });

    // 1. Save video metadata
    const video = await db.createVideo({
      userId: request.userId,
      filename: request.videoFile.name,
      size: request.videoFile.size,
    });

    try {
      // 2. Transcription
      const transcription = await transcribeVideo(request.videoFile);
      await db.saveTranscription(video.id, transcription);

      // 3. Cinematic analysis
      const cinematic = await analyzeCinematic(/* frames */, transcription);
      await db.saveCinematic(video.id, cinematic);

      // 4. Update video status
      await db.updateVideoStatus(video.id, 'ready');

      return {
        videoId: video.id,
        transcription,
        cinematic,
      };
    } catch (error) {
      await db.updateVideoStatus(video.id, 'error');
      throw error;
    }
  }

  async generateDirectorNotes(request: DirectorRequest): Promise<DirectorAnalysis> {
    return analyzeWithDirector(
      request.transcription,
      request.mode,
      request.cinematic
    );
  }
}

export const framePilot = new FramePilotService();
```

**Step 4:** `src/modules/framepilot/db.ts`
```typescript
import { supabase } from '@/lib/supabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function createVideo(data: {
  userId: string;
  filename: string;
  size: number;
}) {
  const { data: video, error } = await supabaseAdmin
    .from('videos')
    .insert({
      user_id: data.userId,
      original_filename_encrypted: encrypt(data.filename),
      status: 'uploaded',
    })
    .select()
    .single();

  if (error) throw error;
  return video;
}

export async function saveTranscription(videoId: string, transcription: any) {
  const { error } = await supabaseAdmin
    .from('transcriptions')
    .insert({
      video_id: videoId,
      language: transcription.language,
      raw_text_encrypted: encrypt(transcription.text),
      segments_encrypted: encrypt(JSON.stringify(transcription.segments)),
    });

  if (error) throw error;
}

export async function saveCinematic(videoId: string, cinematic: any) {
  const { error } = await supabaseAdmin
    .from('cinematic_analysis')
    .insert({
      video_id: videoId,
      analysis_data: cinematic, // JSONB column
    });

  if (error) throw error;
}

export async function updateVideoStatus(videoId: string, status: string) {
  const { error } = await supabaseAdmin
    .from('videos')
    .update({ status })
    .eq('id', videoId);

  if (error) throw error;
}

function encrypt(data: string): string {
  // TODO: Implement encryption
  return data;
}
```

**Step 5:** `src/modules/framepilot/index.ts`
```typescript
// Public API - Only this should be imported by API routes
export { framePilot } from './service';
export type {
  VideoAnalysisRequest,
  VideoAnalysisResult,
  DirectorRequest,
  DirectorMode,
} from './types';
```

---

### 2.2 Refactor AI Layer

**Split openai.ts and directorAI.ts:**

**Create:** `src/lib/ai/provider-openai.ts`
```typescript
import OpenAI from 'openai';
import https from 'https';

const httpsAgent = process.env.NODE_ENV === 'development' 
  ? new https.Agent({ rejectUnauthorized: false })
  : undefined;

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  ...(httpsAgent && { httpAgent: httpsAgent }),
});

export async function callWhisper(file: File) {
  // Move Whisper logic here
}

export async function callGPT4Vision(frames: string[], prompt: string) {
  // Move GPT-4 Vision logic here
}

export async function callGPT4(prompt: string, options?: any) {
  // Move GPT-4 Turbo logic here
}
```

**Create:** `src/modules/framepilot/prompts/scene-director.ts`
```typescript
export function buildSceneDirectorPrompt(
  transcription: any,
  cinematicAnalysis?: any
): string {
  return `Sen bir PROFESYONEL VİDEO YÖNETMENİ...
  
  TRANSKRIPT:
  ${JSON.stringify(transcription.segments, null, 2)}
  
  ${cinematicAnalysis ? `GÖRSEL ANALİZ: ...` : ''}
  
  ...
  `;
}
```

---

### 2.3 Update API Routes

**Before:**
```typescript
// src/app/api/analyze-full/route.ts
import { transcribeVideoWithRetry } from '@/lib/openai';
import { videoPreprocessor } from '@/lib/videoPreprocessor';
import { analyzeCinematic } from '@/lib/directors/cinematicDirector';
```

**After:**
```typescript
// src/app/api/analyze-full/route.ts
import { framePilot } from '@/modules/framepilot';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  // Validation
  if (!file) {
    return NextResponse.json({ error: 'File required' }, { status: 400 });
  }

  try {
    const result = await framePilot.analyzeVideo({
      videoFile: file,
      userId: 'temp-user', // TODO: Get from auth
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

---

## 🟢 Phase 3: Job-Based Architecture (1 Week)

### 3.1 Database Schema for Jobs

**Add to:** `supabase/schema.sql`

```sql
-- Jobs table for async processing
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('video_analysis', 'director_notes', 'tts')),
  status TEXT NOT NULL CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  error_message TEXT,
  result_data JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_video_id ON jobs(video_id);

-- RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jobs"
  ON jobs FOR SELECT
  USING (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

### 3.2 Job Service

**Create:** `src/lib/jobs/jobService.ts`

```typescript
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logger } from '@/lib/logger';

export type JobType = 'video_analysis' | 'director_notes' | 'tts';
export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface Job {
  id: string;
  userId: string;
  videoId?: string;
  type: JobType;
  status: JobStatus;
  progress: number;
  errorMessage?: string;
  resultData?: any;
  createdAt: string;
  updatedAt: string;
}

export class JobService {
  private log = logger.child({ service: 'jobs' });

  async createJob(data: {
    userId: string;
    videoId?: string;
    type: JobType;
  }): Promise<Job> {
    const { data: job, error } = await supabaseAdmin
      .from('jobs')
      .insert({
        user_id: data.userId,
        video_id: data.videoId,
        type: data.type,
        status: 'queued',
        progress: 0,
      })
      .select()
      .single();

    if (error) throw error;

    this.log.info('Job created', { jobId: job.id, type: data.type });
    return job;
  }

  async updateJobStatus(
    jobId: string,
    status: JobStatus,
    data?: {
      progress?: number;
      errorMessage?: string;
      resultData?: any;
    }
  ) {
    const updates: any = {
      status,
      ...(data?.progress !== undefined && { progress: data.progress }),
      ...(data?.errorMessage && { error_message: data.errorMessage }),
      ...(data?.resultData && { result_data: data.resultData }),
    };

    if (status === 'processing' && !updates.started_at) {
      updates.started_at = new Date().toISOString();
    }

    if (status === 'completed' || status === 'failed') {
      updates.completed_at = new Date().toISOString();
    }

    const { error } = await supabaseAdmin
      .from('jobs')
      .update(updates)
      .eq('id', jobId);

    if (error) throw error;

    this.log.info('Job status updated', { jobId, status, progress: data?.progress });
  }

  async getJob(jobId: string): Promise<Job | null> {
    const { data, error } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) return null;
    return data;
  }

  async getUserJobs(userId: string, limit = 50): Promise<Job[]> {
    const { data, error } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
}

export const jobService = new JobService();
```

---

### 3.3 Job Processor

**Create:** `src/lib/jobs/processor.ts`

```typescript
import { jobService } from './jobService';
import { framePilot } from '@/modules/framepilot';
import { logger } from '@/lib/logger';

export class JobProcessor {
  private log = logger.child({ service: 'job-processor' });

  async processVideoAnalysis(jobId: string, videoFile: File, userId: string) {
    this.log.info('Processing video analysis job', { jobId });

    try {
      await jobService.updateJobStatus(jobId, 'processing', { progress: 0 });

      // Step 1: Transcription (0-50%)
      await jobService.updateJobStatus(jobId, 'processing', { progress: 10 });
      const result = await framePilot.analyzeVideo({
        videoFile,
        userId,
      });

      await jobService.updateJobStatus(jobId, 'processing', { progress: 50 });

      // Step 2: Cinematic (50-100%)
      await jobService.updateJobStatus(jobId, 'processing', { progress: 75 });

      // Complete
      await jobService.updateJobStatus(jobId, 'completed', {
        progress: 100,
        resultData: result,
      });

      this.log.info('Video analysis job completed', { jobId });
    } catch (error: any) {
      this.log.error('Video analysis job failed', error, { jobId });
      await jobService.updateJobStatus(jobId, 'failed', {
        errorMessage: error.message,
      });
    }
  }

  async processDirectorNotes(
    jobId: string,
    videoId: string,
    mode: string,
    userId: string
  ) {
    // Similar pattern
  }
}

export const jobProcessor = new JobProcessor();
```

---

### 3.4 New API Routes

**Create:** `src/app/api/videos/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { jobService } from '@/lib/jobs/jobService';
import { jobProcessor } from '@/lib/jobs/processor';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'File required' }, { status: 400 });
  }

  // TODO: Get userId from auth
  const userId = 'temp-user';

  // Create job
  const job = await jobService.createJob({
    userId,
    type: 'video_analysis',
  });

  // Process async (don't await)
  jobProcessor.processVideoAnalysis(job.id, file, userId).catch(console.error);

  return NextResponse.json({
    success: true,
    jobId: job.id,
    message: 'Video analysis started',
  });
}
```

**Create:** `src/app/api/jobs/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { jobService } from '@/lib/jobs/jobService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const job = await jobService.getJob(params.id);

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: job });
}
```

---

### 3.5 Frontend Polling

**Update:** `src/app/upload/page.tsx`

```typescript
async function handleUpload() {
  setUploading(true);

  // 1. Start job
  const response = await fetch('/api/videos', {
    method: 'POST',
    body: formData,
  });

  const { jobId } = await response.json();

  // 2. Poll for status
  const pollInterval = setInterval(async () => {
    const statusRes = await fetch(`/api/jobs/${jobId}`);
    const { data: job } = await statusRes.json();

    setProgress(job.progress);

    if (job.status === 'completed') {
      clearInterval(pollInterval);
      setUploading(false);
      router.push(`/videos/${job.videoId}`);
    } else if (job.status === 'failed') {
      clearInterval(pollInterval);
      setUploading(false);
      setError(job.errorMessage);
    }
  }, 2000); // Poll every 2 seconds
}
```

---

## 📊 Implementation Checklist

### Phase 1: Cleanup & Security ✅

- [ ] Remove unused files
  - [ ] `src/app/test-preprocessing/`
  - [ ] `src/app/api/test-preprocessing/`
  - [ ] `src/app/api/test-env/` ⚠️ **SECURITY RISK**
  - [ ] `src/app/api/transcribe/`
- [ ] Fix environment consistency
  - [ ] Single source: `MAX_UPLOAD_MB`
  - [ ] Update `next.config.mjs`
  - [ ] Update `upload/page.tsx`
- [ ] Add logging infrastructure
  - [ ] Create `src/lib/logger.ts`
  - [ ] Add to `cinematicDirector.ts`
  - [ ] Add cost tracking
- [ ] Fix CinematicDirector
  - [ ] JSON parse error handling
  - [ ] Performance metrics
  - [ ] Cost calculation

### Phase 2: Modularization 🔄

- [ ] Create FramePilot module structure
  - [ ] `src/modules/framepilot/`
  - [ ] `types.ts`
  - [ ] `service.ts`
  - [ ] `db.ts`
  - [ ] `index.ts`
- [ ] Refactor AI layer
  - [ ] `src/lib/ai/provider-openai.ts`
  - [ ] `src/modules/framepilot/ai/transcription.ts`
  - [ ] `src/modules/framepilot/ai/cinematic.ts`
  - [ ] `src/modules/framepilot/ai/director.ts`
- [ ] Extract prompts
  - [ ] `prompts/scene-director.ts`
  - [ ] `prompts/script-rewrite.ts`
  - [ ] `prompts/full-rewrite.ts`
- [ ] Update API routes
  - [ ] `api/analyze-full/route.ts`
  - [ ] `api/director/route.ts`
- [ ] Add Supabase integration
  - [ ] Video upload to Storage
  - [ ] Save transcription to DB
  - [ ] Save cinematic to DB

### Phase 3: Job-Based Architecture 🚀

- [ ] Database schema
  - [ ] Add `jobs` table
  - [ ] Add RLS policies
  - [ ] Run migration
- [ ] Job service
  - [ ] Create `src/lib/jobs/jobService.ts`
  - [ ] Create `src/lib/jobs/processor.ts`
- [ ] New API routes
  - [ ] `POST /api/videos` - Create job
  - [ ] `GET /api/jobs/[id]` - Get job status
- [ ] Frontend polling
  - [ ] Update `upload/page.tsx`
  - [ ] Add progress bar
  - [ ] Handle errors

---

## 🎯 Success Metrics

**After Phase 1:**
- ✅ Zero security risks (test endpoints removed)
- ✅ Consistent upload limits
- ✅ Logging infrastructure in place
- ✅ CinematicDirector has observability

**After Phase 2:**
- ✅ Clear module boundaries
- ✅ Supabase persistence working
- ✅ Prompt versioning possible
- ✅ Easy to add new AI providers

**After Phase 3:**
- ✅ Async processing
- ✅ Job status tracking
- ✅ No timeout issues
- ✅ Ready for real queue (Upstash/QStash)

---

## 🚨 Critical Warnings

### 1. Breaking Changes
Phase 2 and 3 will break existing localStorage-based flow. Plan migration:
- Export existing localStorage data
- Migrate to Supabase
- Update frontend to use new API

### 2. Authentication Required
Before Phase 3 goes to production:
- Implement Supabase Auth
- Add user context
- Protect API routes
- Enable RLS

### 3. Cost Monitoring
After Phase 1, you'll have cost tracking. Monitor:
- OpenAI API usage
- Supabase storage
- Vercel bandwidth

---

## 📅 Timeline

| Phase | Duration | Effort |
|-------|----------|--------|
| Phase 1 | 1-2 days | 16 hours |
| Phase 2 | 1 week | 40 hours |
| Phase 3 | 1 week | 40 hours |
| **Total** | **2-3 weeks** | **96 hours** |

---

## 🎓 Learning Resources

**Modular Architecture:**
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Vertical Slice Architecture](https://www.jimmybogard.com/vertical-slice-architecture/)

**Job Queues:**
- [Upstash QStash](https://upstash.com/docs/qstash)
- [BullMQ](https://docs.bullmq.io/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

**Observability:**
- [Structured Logging](https://www.honeycomb.io/blog/structured-logging-and-your-team)
- [OpenTelemetry](https://opentelemetry.io/)

---

**Report Date:** 5 Aralık 2025  
**Version:** 1.0  
**Status:** Ready for Implementation
