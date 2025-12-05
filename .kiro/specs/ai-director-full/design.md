# Design Document - AI Director Full System

## Overview

PIVOTERA AI Director Mode, video içerik üreticilerine profesyonel yönetmenlik hizmeti sunan, çok modlu (multi-modal) AI analiz sistemidir. Ses, görüntü, jest ve sinematik öğeleri eş zamanlı analiz ederek, zaman damgalı ve uygulanabilir öneriler sunar.

**Temel Prensip**: "AI sadece analiz etmez, yönetmenlik yapar"

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Video Upload │  │ Director UI  │  │ Export Panel │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Next.js API Routes)            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ /api/upload  │  │ /api/analyze │  │ /api/export  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Analysis Pipeline                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  1. Video Preprocessing (FFmpeg)                     │   │
│  │     - Extract audio                                  │   │
│  │     - Extract frames (1 fps)                         │   │
│  │     - Generate thumbnails                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                              ↓                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  2. Parallel Analysis                                │   │
│  │     ┌─────────────┐  ┌─────────────┐                │   │
│  │     │ Voice       │  │ Face        │                │   │
│  │     │ Director    │  │ Director    │                │   │
│  │     └─────────────┘  └─────────────┘                │   │
│  │     ┌─────────────┐  ┌─────────────┐                │   │
│  │     │ Gesture     │  │ Cinematic   │                │   │
│  │     │ Director    │  │ Director    │                │   │
│  │     └─────────────┘  └─────────────┘                │   │
│  └──────────────────────────────────────────────────────┘   │
│                              ↓                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  3. Synchronization Analysis                         │   │
│  │     - Cross-modal correlation                        │   │
│  │     - Coherence scoring                              │   │
│  │     - Mismatch detection                             │   │
│  └──────────────────────────────────────────────────────┘   │
│                              ↓                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  4. Director AI (GPT-4)                              │   │
│  │     - Generate director notes                        │   │
│  │     - Script rewrite                                 │   │
│  │     - Prioritization                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Storage Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Supabase     │  │ Redis Cache  │  │ S3/Storage   │      │
│  │ (Database)   │  │ (Results)    │  │ (Videos)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## Components and Interfaces

### 1. Video Preprocessing Module

**Purpose**: Video'yu analiz için hazırlar

```typescript
interface VideoPreprocessor {
  extractAudio(videoPath: string): Promise<AudioFile>;
  extractFrames(videoPath: string, fps: number): Promise<Frame[]>;
  generateThumbnails(videoPath: string): Promise<Thumbnail[]>;
  getMetadata(videoPath: string): Promise<VideoMetadata>;
}

interface VideoMetadata {
  duration: number;
  resolution: { width: number; height: number };
  fps: number;
  codec: string;
  bitrate: number;
}
```

**Implementation**: FFmpeg

---

### 2. Voice Director Module

**Purpose**: Ses tonu, pitch, tempo, vurgu analizi

```typescript
interface VoiceDirector {
  analyze(audioFile: AudioFile, transcription: Transcription): Promise<VoiceAnalysis>;
}

interface VoiceAnalysis {
  overall_score: number; // 0-100
  segments: VoiceSegment[];
  issues: VoiceIssue[];
  recommendations: VoiceRecommendation[];
}

interface VoiceSegment {
  start: number;
  end: number;
  tone: 'warm' | 'cold' | 'energetic' | 'flat' | 'harsh';
  pitch_variation: number; // 0-100, higher = more varied
  tempo: number; // words per minute
  energy: number; // 0-100
  confidence_score: number; // 0-100
}

interface VoiceIssue {
  timestamp: string;
  type: 'monotone' | 'too_fast' | 'too_slow' | 'weak_emphasis' | 'poor_breath';
  severity: 'critical' | 'important' | 'minor';
  description: string;
}

interface VoiceRecommendation {
  timestamp: string;
  issue: string;
  suggestion: string;
  example: string;
}
```

**Implementation**:
- OpenAI Whisper (transcription)
- Librosa (audio feature extraction)
- Custom ML model (tone classification)

---

### 3. Face Director Module

**Purpose**: Mimik, göz teması, güven analizi

```typescript
interface FaceDirector {
  analyze(frames: Frame[], transcription: Transcription): Promise<FaceAnalysis>;
}

interface FaceAnalysis {
  overall_score: number; // 0-100
  segments: FaceSegment[];
  issues: FaceIssue[];
  recommendations: FaceRecommendation[];
}

interface FaceSegment {
  start: number;
  end: number;
  face_detected: boolean;
  eye_contact_score: number; // 0-100
  smile_frequency: number; // 0-100
  expression: 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'fearful';
  naturalness_score: number; // 0-100
  confidence_score: number; // 0-100
}

interface FaceIssue {
  timestamp: string;
  type: 'no_eye_contact' | 'frozen_expression' | 'tension' | 'mismatch';
  severity: 'critical' | 'important' | 'minor';
  description: string;
}
```

**Implementation**:
- GPT-4 Vision (facial expression analysis)
- MediaPipe Face Mesh (eye tracking)
- Custom ML model (confidence scoring)

---

### 4. Gesture Director Module

**Purpose**: El hareketi, beden dili analizi

```typescript
interface GestureDirector {
  analyze(frames: Frame[], transcription: Transcription): Promise<GestureAnalysis>;
}

interface GestureAnalysis {
  overall_score: number; // 0-100
  segments: GestureSegment[];
  issues: GestureIssue[];
  recommendations: GestureRecommendation[];
}

interface GestureSegment {
  start: number;
  end: number;
  hand_gesture_frequency: number; // gestures per minute
  gesture_appropriateness: number; // 0-100
  body_posture_score: number; // 0-100
  in_frame: boolean;
  synchronization_score: number; // 0-100 (with speech)
}

interface GestureIssue {
  timestamp: string;
  type: 'no_gesture' | 'excessive_gesture' | 'out_of_frame' | 'poor_posture' | 'mismatch';
  severity: 'critical' | 'important' | 'minor';
  description: string;
}
```

**Implementation**:
- MediaPipe Pose (body tracking)
- MediaPipe Hands (hand tracking)
- Custom ML model (gesture classification)

---

### 5. Cinematic Director Module

**Purpose**: Kamera, ışık, kadraj analizi

**CURRENT STATUS**: 
- ✅ File exists: `src/lib/directors/cinematicDirector.ts`
- ✅ Basic implementation working
- ❌ Critical bugs: "Görsel analiz başarısız oldu" error
- ❌ Insufficient error handling and logging
- ❌ No input validation or fallback mechanisms

**Enhanced Interface** (with error handling):

```typescript
interface CinematicDirector {
  analyze(frames: Frame[], metadata: VideoMetadata, options?: AnalysisOptions): Promise<CinematicAnalysisResult>;
}

interface AnalysisOptions {
  maxFrames?: number; // Default: 5
  model?: 'gpt-4o' | 'gpt-4-turbo';
  enableFallback?: boolean; // Default: true
  timeout?: number; // Default: 30000ms
  retryAttempts?: number; // Default: 3
}

interface CinematicAnalysisResult {
  success: boolean;
  data?: CinematicAnalysis;
  error?: AnalysisError;
  metadata: AnalysisMetadata;
}

interface AnalysisError {
  code: string; // 'INVALID_API_KEY', 'MODEL_NOT_FOUND', 'RATE_LIMIT_EXCEEDED', etc.
  message: string;
  userMessage: string; // User-friendly error message
  details?: any;
  timestamp: string;
}

interface AnalysisMetadata {
  model: string;
  frameCount: number;
  executionTime: number; // milliseconds
  tokenUsage?: number;
  estimatedCost?: number;
  fallbackUsed: boolean;
  retryCount: number;
}

interface CinematicAnalysis {
  overall_score: number; // 0-100
  camera_analysis: CameraAnalysis;
  lighting_analysis: LightingAnalysis;
  composition_analysis: CompositionAnalysis;
  quality_analysis: QualityAnalysis;
  recommendations: string[];
  confidence: 'high' | 'medium' | 'low'; // NEW: indicates analysis reliability
  warnings: string[]; // NEW: any issues during analysis
}

interface CameraAnalysis {
  type: 'handheld' | 'tripod' | 'gimbal' | 'drone' | 'static' | 'unknown';
  movement: 'smooth' | 'shaky' | 'static' | 'dynamic';
  angles: string[];
  stability_score: number; // 0-100
  drone_detected: boolean;
  recommendations: string[];
}

interface LightingAnalysis {
  type: 'natural' | 'artificial' | 'mixed';
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  brightness_score: number; // 0-100
  issues: string[];
  recommendations: string[];
}

interface CompositionAnalysis {
  framing: 'excellent' | 'good' | 'fair' | 'poor';
  background: 'clean' | 'cluttered' | 'distracting' | 'appropriate';
  rule_of_thirds: boolean;
  subject_positioning: 'centered' | 'off-center' | 'optimal' | 'poor';
  recommendations: string[];
}

interface QualityAnalysis {
  resolution_quality: 'excellent' | 'good' | 'fair' | 'poor';
  color_balance: 'excellent' | 'good' | 'fair' | 'poor';
  sharpness: 'excellent' | 'good' | 'fair' | 'poor';
  overall_quality: number; // 0-100
  issues: string[];
}
```

**Error Handling Components** (NEW):

```typescript
// Error Handler
interface ErrorHandler {
  handleAPIError(error: any): AnalysisError;
  handleValidationError(message: string): AnalysisError;
  handleNetworkError(error: any): AnalysisError;
  getUserFriendlyMessage(errorCode: string): string;
}

// Fallback Manager
interface FallbackManager {
  tryAlternativeModel(frames: string[], prompt: string, failedModel: string): Promise<CinematicAnalysis>;
  getMockAnalysis(reason: string): CinematicAnalysis;
  shouldRetry(error: any, attemptNumber: number): boolean;
  getRetryDelay(attemptNumber: number): number; // exponential backoff
}

// Metrics Collector
interface MetricsCollector {
  startTimer(operationId: string): void;
  endTimer(operationId: string): number;
  recordAPICall(model: string, tokens: number, cost: number): void;
  recordError(errorCode: string, errorType: string): void;
  recordFallback(fromModel: string, toModel: string): void;
  getMetricsSummary(): MetricsSummary;
}
```

**Implementation**:
- GPT-4o Vision (primary - scene analysis)
- GPT-4 Turbo (fallback - if GPT-4o unavailable)
- Mock Analysis (last resort - if all models fail)
- Comprehensive error logging at each step
- Input validation before expensive API calls
- Retry logic with exponential backoff
- SSL bypass for development environments

---

### 6. Synchronization Analyzer

**Purpose**: Çok modlu senkronizasyon analizi

```typescript
interface SynchronizationAnalyzer {
  analyze(
    voice: VoiceAnalysis,
    face: FaceAnalysis,
    gesture: GestureAnalysis,
    transcription: Transcription
  ): Promise<SynchronizationAnalysis>;
}

interface SynchronizationAnalysis {
  overall_coherence_score: number; // 0-100
  mismatches: SyncMismatch[];
  recommendations: SyncRecommendation[];
}

interface SyncMismatch {
  timestamp: string;
  modalities: ('voice' | 'face' | 'gesture')[];
  description: string;
  severity: 'critical' | 'important' | 'minor';
}
```

**Implementation**:
- Custom correlation algorithms
- GPT-4 (semantic analysis)

---

### 7. Director AI (Orchestrator)

**Purpose**: Tüm analizleri birleştirip yönetmenlik notları üretir

```typescript
interface DirectorAI {
  generateDirectorNotes(
    voice: VoiceAnalysis,
    face: FaceAnalysis,
    gesture: GestureAnalysis,
    cinematic: CinematicAnalysis,
    sync: SynchronizationAnalysis,
    transcription: Transcription
  ): Promise<DirectorNotes>;
  
  rewriteScript(
    transcription: Transcription,
    allAnalyses: AllAnalyses
  ): Promise<RewrittenScript>;
}

interface DirectorNotes {
  notes: DirectorNote[];
  summary: {
    total_issues: number;
    critical_issues: number;
    overall_score: number;
    top_priorities: string[];
  };
}

interface DirectorNote {
  timestamp: string;
  category: 'voice' | 'face' | 'gesture' | 'cinematic' | 'sync';
  severity: 'critical' | 'important' | 'minor';
  issue: string;
  visual_suggestion?: string;
  audio_suggestion?: string;
  speech_suggestion?: string;
  gesture_suggestion?: string;
  reasoning: string;
  confidence: number; // 0-100
}

interface RewrittenScript {
  segments: RewrittenSegment[];
  improvements_summary: string[];
  overall_improvement_score: number; // 0-100
}

interface RewrittenSegment {
  timestamp: string;
  original: string;
  rewritten: string;
  delivery_instructions: {
    tone?: string;
    gesture?: string;
    expression?: string;
    emphasis?: string[];
  };
  improvement_reason: string;
}
```

**Implementation**:
- GPT-4 Turbo (note generation)
- Custom prompt engineering
- Priority scoring algorithm

---

## Data Models

### Database Schema (Supabase)

```sql
-- Videos table
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  duration INTEGER,
  size_mb DECIMAL,
  status TEXT DEFAULT 'processing',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transcriptions table
CREATE TABLE transcriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  language TEXT,
  full_text TEXT,
  segments JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Director analyses table
CREATE TABLE director_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  
  -- Analysis results
  voice_analysis JSONB,
  face_analysis JSONB,
  gesture_analysis JSONB,
  cinematic_analysis JSONB,
  sync_analysis JSONB,
  
  -- Director outputs
  director_notes JSONB,
  rewritten_script JSONB,
  
  -- Metadata
  overall_score INTEGER,
  processing_time_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Analysis cache (Redis structure)
CREATE TABLE analysis_cache (
  video_id UUID PRIMARY KEY,
  cache_data JSONB,
  expires_at TIMESTAMP
);
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Voice Analysis Completeness
*For any* video with audio, voice analysis should produce confidence scores for all segments and identify at least one recommendation if overall score is below 80.
**Validates: Requirements 1.1, 1.2**

### Property 2: Face Detection Consistency
*For any* video frame with a visible face, face analysis should detect the face and produce expression scores with confidence above 60.
**Validates: Requirements 2.1, 2.2**

### Property 3: Gesture Tracking Continuity
*For any* video segment, gesture analysis should maintain tracking continuity without gaps larger than 1 second.
**Validates: Requirements 3.1, 3.2**

### Property 4: Synchronization Mismatch Detection
*For any* pair of modalities (voice, face, gesture), if their confidence scores differ by more than 30 points in the same segment, a synchronization mismatch should be flagged.
**Validates: Requirements 5.1, 5.2**

### Property 5: Director Note Timestamp Accuracy
*For any* director note, the timestamp should correspond to an actual segment in the video and be within 1 second of the detected issue.
**Validates: Requirements 6.1, 6.2**

### Property 6: Script Rewrite Preservation
*For any* rewritten script segment, the core message should be semantically equivalent to the original (measured by embedding similarity > 0.7).
**Validates: Requirements 7.1, 7.3**

### Property 7: Analysis Processing Time Bound
*For any* video under 10 minutes, total analysis time should not exceed 2 minutes per minute of video.
**Validates: Requirements 10.1, 10.5**

### Property 8: Export Format Validity
*For any* export request, the generated file should be valid according to its format specification (PDF, JSON, SRT).
**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

---

## Error Handling

### Error Categories

1. **Video Processing Errors**
   - Invalid format
   - Corrupted file
   - Unsupported codec
   - File too large

2. **Analysis Errors**
   - No face detected
   - No audio detected
   - Poor video quality
   - API failures

3. **System Errors**
   - Timeout
   - Out of memory
   - Storage failure
   - Network errors

### Error Recovery Strategy

```typescript
interface ErrorHandler {
  handleVideoError(error: VideoError): RecoveryAction;
  handleAnalysisError(error: AnalysisError): RecoveryAction;
  handleSystemError(error: SystemError): RecoveryAction;
}

type RecoveryAction = 
  | { type: 'retry'; maxAttempts: number }
  | { type: 'skip'; reason: string }
  | { type: 'fail'; userMessage: string };
```

---

## Testing Strategy

### Unit Tests
- Video preprocessing functions
- Individual analysis modules
- Score calculation algorithms
- Export formatters

### Integration Tests
- End-to-end analysis pipeline
- API endpoints
- Database operations
- Cache mechanisms

### Property-Based Tests
- Voice analysis completeness (Property 1)
- Face detection consistency (Property 2)
- Gesture tracking continuity (Property 3)
- Synchronization detection (Property 4)
- Director note accuracy (Property 5)
- Script preservation (Property 6)
- Processing time bounds (Property 7)
- Export validity (Property 8)

### Performance Tests
- Video processing speed
- Concurrent analysis handling
- Memory usage
- API response times

**Testing Framework**: Vitest + fast-check (property-based testing)

---

## Performance Considerations

### Optimization Strategies

1. **Parallel Processing**
   - Run voice, face, gesture, cinematic analyses in parallel
   - Use worker threads for CPU-intensive tasks

2. **Caching**
   - Cache analysis results in Redis (24 hour TTL)
   - Cache extracted frames and audio

3. **Lazy Loading**
   - Load frames on-demand for analysis
   - Stream video processing

4. **Resource Management**
   - Limit concurrent analyses
   - Clean up temporary files immediately
   - Use streaming for large files

### Expected Performance

- **5-minute video**: ~8-10 minutes total processing
- **Voice analysis**: ~30 seconds
- **Face analysis**: ~2 minutes (1 fps sampling)
- **Gesture analysis**: ~2 minutes
- **Cinematic analysis**: ~1 minute
- **Director AI**: ~2 minutes
- **Overhead**: ~1 minute

---

## Security Considerations

1. **Video Privacy**
   - Encrypt videos at rest
   - Secure temporary file handling
   - Auto-delete after 30 days

2. **API Security**
   - Rate limiting
   - Authentication required
   - Input validation

3. **Data Protection**
   - No PII in analysis results
   - GDPR compliance
   - User data deletion

---

## Deployment Architecture

### Production Stack

```
Frontend: Vercel (Next.js)
API: Vercel Serverless Functions
Video Processing: AWS Lambda (long-running)
Storage: Supabase Storage + S3
Database: Supabase PostgreSQL
Cache: Redis Cloud
ML Models: OpenAI API + Custom models on AWS SageMaker
```

### Scaling Strategy

1. **Horizontal Scaling**
   - Multiple Lambda instances for video processing
   - Load balancer for API requests

2. **Vertical Scaling**
   - Increase Lambda memory for large videos
   - Optimize frame sampling rate

3. **Cost Optimization**
   - Use spot instances for batch processing
   - Implement smart caching
   - Optimize API calls

---

## Future Enhancements

1. **Real-Time Analysis**
   - WebRTC integration
   - Live feedback during recording

2. **Advanced ML Models**
   - Custom voice tone classifier
   - Emotion detection model
   - Gesture recognition model

3. **Industry Templates**
   - Real estate specific analysis
   - Education content optimization
   - Sales pitch evaluation

4. **Collaborative Features**
   - Team reviews
   - Shared analysis
   - Version comparison

---

## Conclusion

This design provides a comprehensive, modular, and scalable architecture for the AI Director Full System. The multi-modal analysis approach, combined with intelligent synchronization and GPT-4 powered director notes, creates a unique and powerful tool for content creators.

**Key Differentiators**:
- Multi-modal analysis (voice + face + gesture + cinematic)
- Synchronization detection
- Actionable, timestamped director notes
- Professional script rewriting
- Export and integration capabilities

**Next Steps**: Implementation plan and task breakdown
