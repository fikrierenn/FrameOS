# 🏗️ FrameOS - Mimari Analiz Raporu

**Tarih:** 5 Aralık 2025  
**Analist:** Senior Software Architect  
**Proje:** FrameOS - AI Video Director

---

## 📊 Executive Summary

**Genel Durum:** 🟡 Orta Seviye (MVP çalışıyor, production-ready değil)

**Güçlü Yönler:**
- ✅ Modern tech stack (Next.js 14, TypeScript, OpenAI)
- ✅ Temiz API route yapısı
- ✅ Environment variable yönetimi
- ✅ Temp file cleanup mekanizması

**Kritik Sorunlar:**
- ❌ **Persistence yok** - Tüm data localStorage'da (production için kabul edilemez)
- ❌ **Authentication yok** - Multi-tenancy planlanmış ama implement edilmemiş
- ❌ **Test coverage %0** - Hiç test yok
- ❌ **Error handling eksik** - Birçok edge case handle edilmemiş

---

## 🎯 Mimari Katmanlar

### 1. Frontend Layer (React/Next.js)

**Durum:** 🟡 Orta

**Mevcut:**
```
src/app/
├── page.tsx              # Dashboard (localStorage okuma)
├── upload/page.tsx       # Video upload
└── videos/[id]/page.tsx  # Video detail (869 satır - ÇOK BÜYÜK!)
```

**Sorunlar:**
- ❌ `videos/[id]/page.tsx` 869 satır - Component'lere bölünmeli
- ❌ State management yok (Context API veya Zustand gerekli)
- ❌ localStorage kullanımı - Production için uygun değil
- ❌ Error boundaries yok
- ❌ Loading states tutarsız

**Öneriler:**
```
src/
├── components/
│   ├── video/
│   │   ├── VideoPlayer.tsx
│   │   ├── TranscriptionView.tsx
│   │   ├── CinematicAnalysis.tsx
│   │   └── DirectorNotes.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── LoadingSpinner.tsx
│   └── layout/
│       ├── Header.tsx
│       └── Sidebar.tsx
├── hooks/
│   ├── useVideo.ts
│   ├── useDirectorAI.ts
│   └── useTTS.ts
└── store/
    └── videoStore.ts  # Zustand store
```

---

### 2. API Layer (Next.js API Routes)

**Durum:** 🟢 İyi

**Mevcut:**
```
src/app/api/
├── analyze-full/      # ✅ Full video analysis
├── director/          # ✅ Director AI
├── tts/               # ✅ Text-to-Speech
├── download-video/    # ✅ YouTube download
├── test-env/          # ⚠️ Test endpoint (production'da silinmeli)
└── transcribe/        # ⚠️ Kullanılmıyor mu?
```

**Sorunlar:**
- ❌ Rate limiting yok
- ❌ Request validation eksik (Zod kullanılmalı)
- ❌ API versioning yok
- ❌ Webhook support yok (async processing için)
- ⚠️ Test endpoint'leri production'da

**Öneriler:**
```typescript
// middleware.ts - Rate limiting
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

// Zod validation
import { z } from 'zod';

const DirectorRequestSchema = z.object({
  transcription: z.object({
    text: z.string(),
    segments: z.array(z.any()),
  }),
  mode: z.enum(['scene_director', 'script_rewrite', 'full_rewrite']),
});
```

---

### 3. Business Logic Layer

**Durum:** 🟡 Orta

**Mevcut:**
```
src/lib/
├── openai.ts              # ✅ Whisper transcription
├── directorAI.ts          # ⚠️ 500+ satır - bölünmeli
├── directors/
│   └── cinematicDirector.ts  # ✅ GPT-4 Vision
├── videoPreprocessor.ts   # ✅ FFmpeg wrapper
└── videoUploadService.ts  # ❌ BOŞ DOSYA!
```

**Sorunlar:**
- ❌ `directorAI.ts` 500+ satır - Prompt'lar ayrı dosyalara taşınmalı
- ❌ `videoUploadService.ts` boş - Implement edilmemiş
- ❌ Error handling tutarsız
- ❌ Retry logic eksik (sadece transcription'da var)
- ❌ Caching yok

**Öneriler:**
```
src/lib/
├── services/
│   ├── transcription/
│   │   ├── whisperService.ts
│   │   └── transcriptionQueue.ts
│   ├── director/
│   │   ├── directorService.ts
│   │   ├── sceneDirector.ts
│   │   ├── scriptRewriter.ts
│   │   └── fullRewriter.ts
│   ├── video/
│   │   ├── videoService.ts
│   │   ├── videoProcessor.ts
│   │   └── videoStorage.ts
│   └── tts/
│       └── ttsService.ts
├── prompts/
│   ├── sceneDirector.ts
│   ├── scriptRewrite.ts
│   └── fullRewrite.ts
└── utils/
    ├── retry.ts
    ├── cache.ts
    └── errorHandler.ts
```

---

### 4. Data Layer (Persistence)

**Durum:** 🔴 Kritik Sorun

**Mevcut:**
- ❌ **localStorage kullanılıyor** - Production için kabul edilemez
- ❌ **sessionStorage** - Video blob'ları geçici
- ✅ Supabase schema hazır ama **KULLANILMIYOR**
- ✅ RLS policies tanımlı ama **KULLANILMIYOR**

**Sorunlar:**
```typescript
// ❌ MEVCUT - videos/[id]/page.tsx
const data = localStorage.getItem(params.id);  // KABUL EDİLEMEZ!

// ❌ Video blob sessionStorage'da
const blobUrl = sessionStorage.getItem(`video-blob-${params.id}`);
```

**Supabase Entegrasyonu Eksik:**
```sql
-- ✅ Schema hazır ama kullanılmıyor
CREATE TABLE videos (...);
CREATE TABLE transcriptions (...);
CREATE TABLE transcription_jobs (...);

-- ✅ RLS policies hazır ama kullanılmıyor
CREATE POLICY "Users can view own videos" ...
```

**Acil Yapılması Gerekenler:**
```typescript
// 1. Video upload - Supabase Storage
import { supabase } from '@/lib/supabaseClient';

async function uploadVideo(file: File, userId: string) {
  const { data, error } = await supabase.storage
    .from('videos')
    .upload(`${userId}/${Date.now()}-${file.name}`, file);
  
  // DB'ye metadata kaydet
  await supabase.from('videos').insert({
    user_id: userId,
    storage_path_encrypted: encrypt(data.path),
    original_filename_encrypted: encrypt(file.name),
    status: 'uploaded',
  });
}

// 2. Transcription results - DB'ye kaydet
async function saveTranscription(videoId: string, result: any) {
  await supabase.from('transcriptions').insert({
    video_id: videoId,
    language: result.language,
    raw_text_encrypted: encrypt(result.text),
    segments_encrypted: encrypt(JSON.stringify(result.segments)),
  });
}

// 3. Video listesi - DB'den çek
async function getVideos(userId: string) {
  const { data } = await supabase
    .from('videos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  return data;
}
```

---

### 5. Authentication & Authorization

**Durum:** 🔴 Yok

**Mevcut:**
- ❌ Authentication yok
- ❌ User management yok
- ❌ Session management yok
- ✅ Supabase Auth hazır ama **KULLANILMIYOR**

**Acil Yapılması Gerekenler:**
```typescript
// 1. Supabase Auth setup
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// 2. Login/Signup pages
src/app/
├── login/page.tsx
├── signup/page.tsx
└── auth/
    └── callback/route.ts  # OAuth callback

// 3. Protected routes
// middleware.ts
export async function middleware(request: NextRequest) {
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session && request.nextUrl.pathname.startsWith('/videos')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// 4. User context
'use client';
import { createContext, useContext } from 'react';

const UserContext = createContext<User | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);
  
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}
```

---

### 6. External Services Integration

**Durum:** 🟢 İyi

**Mevcut:**
- ✅ OpenAI Whisper (transcription)
- ✅ OpenAI GPT-4 Vision (cinematic analysis)
- ✅ OpenAI GPT-4 Turbo (director AI)
- ✅ OpenAI TTS (text-to-speech)
- ✅ yt-dlp (YouTube download)
- ✅ FFmpeg (video processing)

**Sorunlar:**
- ❌ API key rotation yok
- ❌ Cost tracking yok
- ❌ Usage monitoring yok
- ⚠️ SSL bypass development'ta (güvenlik riski)

**Öneriler:**
```typescript
// 1. API cost tracking
interface APIUsage {
  service: 'whisper' | 'gpt4' | 'tts';
  tokens: number;
  cost: number;
  timestamp: Date;
}

// 2. Usage monitoring
async function trackAPIUsage(usage: APIUsage) {
  await supabase.from('api_usage').insert(usage);
}

// 3. Budget alerts
async function checkBudget(userId: string) {
  const { data } = await supabase
    .from('api_usage')
    .select('cost')
    .eq('user_id', userId)
    .gte('timestamp', startOfMonth());
  
  const totalCost = data.reduce((sum, u) => sum + u.cost, 0);
  if (totalCost > BUDGET_LIMIT) {
    throw new Error('Budget limit exceeded');
  }
}
```

---

## 🧪 Testing

**Durum:** 🔴 Kritik Sorun

**Mevcut:**
- ❌ Test coverage: **0%**
- ✅ Vitest configured ama **KULLANILMIYOR**
- ✅ 1 test dosyası var: `supabase-security.test.ts` ama **BOŞ**

**Acil Yapılması Gerekenler:**
```typescript
// 1. Unit tests
// src/lib/__tests__/directorAI.test.ts
describe('DirectorAI', () => {
  it('should generate scene director notes', async () => {
    const result = await generateSceneDirectorNotes(mockTranscription);
    expect(result).toHaveLength(5);
    expect(result[0]).toHaveProperty('visual');
  });
});

// 2. Integration tests
// src/app/api/__tests__/analyze-full.test.ts
describe('POST /api/analyze-full', () => {
  it('should analyze video successfully', async () => {
    const response = await fetch('/api/analyze-full', {
      method: 'POST',
      body: formData,
    });
    expect(response.status).toBe(200);
  });
});

// 3. E2E tests (Playwright)
// e2e/video-upload.spec.ts
test('should upload and analyze video', async ({ page }) => {
  await page.goto('/upload');
  await page.setInputFiles('input[type="file"]', 'test-video.mp4');
  await page.click('button:has-text("Yükle")');
  await expect(page.locator('.transcription')).toBeVisible();
});
```

**Test Coverage Hedefi:**
- Unit tests: 80%+
- Integration tests: 60%+
- E2E tests: Critical paths

---

## 🔒 Security

**Durum:** 🟡 Orta

**Güvenlik Durumu:**
- ✅ API keys environment variables'da
- ✅ SSL bypass sadece development'ta
- ✅ Temp file cleanup
- ❌ **Authentication yok** - En kritik güvenlik açığı
- ❌ **RLS kullanılmıyor** - Multi-tenancy riski
- ❌ Input validation eksik
- ❌ Rate limiting yok
- ❌ CORS configuration eksik

**Güvenlik Açıkları:**
```typescript
// ❌ AÇIK 1: No authentication
// Herkes herkesin videosunu görebilir (localStorage)

// ❌ AÇIK 2: No input validation
export async function POST(request: NextRequest) {
  const { text } = await request.json();  // Validation yok!
  // XSS, injection riski
}

// ❌ AÇIK 3: No rate limiting
// DDoS riski, API cost explosion

// ❌ AÇIK 4: File upload validation eksik
// Malicious file upload riski
```

**Acil Düzeltmeler:**
```typescript
// 1. Input validation (Zod)
import { z } from 'zod';

const TTSRequestSchema = z.object({
  text: z.string().min(1).max(5000),
  voice: z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']),
  speed: z.number().min(0.25).max(4.0),
});

// 2. Rate limiting
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

// 3. File validation
function validateVideoFile(file: File) {
  const allowedTypes = ['video/mp4', 'video/mov', 'video/avi'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }
  
  if (file.size > 100 * 1024 * 1024) {
    throw new Error('File too large');
  }
}

// 4. CORS
// next.config.mjs
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGIN },
        { key: 'Access-Control-Allow-Methods', value: 'POST, OPTIONS' },
      ],
    },
  ];
}
```

---

## 📈 Performance

**Durum:** 🟡 Orta

**Sorunlar:**
- ❌ Video processing senkron - Timeout riski
- ❌ Caching yok
- ❌ CDN yok
- ❌ Image optimization eksik
- ⚠️ Large component (869 satır)

**Öneriler:**
```typescript
// 1. Async processing (Queue)
import { Queue } from 'bullmq';

const videoQueue = new Queue('video-processing', {
  connection: Redis.fromEnv(),
});

// Upload endpoint - Queue'ya ekle
await videoQueue.add('analyze', { videoId, userId });

// Worker - Background processing
const worker = new Worker('video-processing', async (job) => {
  const { videoId } = job.data;
  await analyzeVideo(videoId);
});

// 2. Caching (Redis)
import { Redis } from '@upstash/redis';

async function getCachedTranscription(videoId: string) {
  const cached = await redis.get(`transcription:${videoId}`);
  if (cached) return cached;
  
  const result = await transcribeVideo(videoId);
  await redis.set(`transcription:${videoId}`, result, { ex: 3600 });
  return result;
}

// 3. CDN (Cloudflare/Vercel)
// next.config.mjs
images: {
  domains: ['your-cdn.com'],
  loader: 'cloudflare',
}
```

---

## 📦 Dependencies

**Durum:** 🟢 İyi

**Mevcut:**
```json
{
  "dependencies": {
    "@google/generative-ai": "^0.24.1",  // ⚠️ Kullanılıyor mu?
    "@supabase/supabase-js": "^2.39.0",  // ⚠️ Kullanılmıyor!
    "fluent-ffmpeg": "^2.1.3",           // ✅
    "next": "14.2.0",                    // ✅
    "openai": "^4.104.0",                // ✅
    "yt-dlp-exec": "^1.0.2"              // ✅
  }
}
```

**Eksik Dependencies:**
```bash
# Rate limiting
npm install @upstash/ratelimit @upstash/redis

# Validation
npm install zod

# State management
npm install zustand

# Queue (async processing)
npm install bullmq ioredis

# Monitoring
npm install @sentry/nextjs

# Testing
npm install -D @testing-library/react @testing-library/jest-dom
npm install -D @playwright/test
```

---

## 🚀 Deployment

**Durum:** 🟡 Orta

**Mevcut:**
- ✅ Vercel-ready (Next.js)
- ❌ Environment variables production'da set edilmeli
- ❌ Database migration strategy yok
- ❌ CI/CD pipeline yok
- ❌ Monitoring yok

**Production Checklist:**
```bash
# 1. Environment variables
OPENAI_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
UPSTASH_REDIS_URL=...
SENTRY_DSN=...

# 2. Database migrations
npx supabase db push

# 3. CI/CD (GitHub Actions)
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test
      - run: npm run build
      - uses: vercel/action@v1

# 4. Monitoring (Sentry)
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

---

## 📋 Öncelikli Aksiyonlar

### 🔴 Kritik (1-2 Hafta)

1. **Supabase Entegrasyonu**
   - localStorage → Supabase migration
   - Video upload → Supabase Storage
   - Transcription results → DB
   - User authentication

2. **Security**
   - Authentication implement
   - Input validation (Zod)
   - Rate limiting
   - RLS enable

3. **Error Handling**
   - Global error boundary
   - API error responses standardize
   - Retry logic

### 🟡 Önemli (2-4 Hafta)

4. **Testing**
   - Unit tests (80% coverage)
   - Integration tests
   - E2E tests (critical paths)

5. **Performance**
   - Async processing (Queue)
   - Caching (Redis)
   - Component optimization

6. **Code Organization**
   - Component'lere bölme
   - Prompt'ları ayrı dosyalara
   - Service layer refactor

### 🟢 İyileştirme (1-2 Ay)

7. **Monitoring**
   - Sentry integration
   - API usage tracking
   - Cost monitoring

8. **DevOps**
   - CI/CD pipeline
   - Database migrations
   - Staging environment

9. **Features**
   - Video chunking (25MB+)
   - Batch processing
   - Webhook support

---

## 💰 Maliyet Tahmini

**Geliştirme Süresi:**
- Kritik aksiyonlar: 80-120 saat
- Önemli aksiyonlar: 120-160 saat
- İyileştirmeler: 80-120 saat
- **Toplam:** 280-400 saat (7-10 hafta)

**Aylık Operasyonel Maliyet (1000 kullanıcı):**
- Supabase: $25-50
- Vercel: $20-50
- Upstash Redis: $10-20
- OpenAI API: $500-2000 (kullanıma bağlı)
- **Toplam:** $555-2120/ay

---

## 🎯 Sonuç

**Mevcut Durum:** MVP çalışıyor ama production-ready değil

**En Kritik Sorunlar:**
1. ❌ Persistence yok (localStorage)
2. ❌ Authentication yok
3. ❌ Test coverage %0
4. ❌ Error handling eksik

**Öneri:** 
- Önce Supabase entegrasyonu ve authentication
- Sonra testing ve error handling
- Son olarak performance ve monitoring

**Production-Ready Süresi:** 7-10 hafta (full-time)

---

**Rapor Tarihi:** 5 Aralık 2025  
**Versiyon:** 1.0
