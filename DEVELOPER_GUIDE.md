# 🛠️ **DEVELOPER_GUIDE.md – FRAMEOS**
### *Technical Architecture, Standards & Implementation Guide*

---

# 📌 1. Giriş
Bu döküman, FRAMEOS ekosisteminde çalışan tüm yazılımcılar için **uygulama kuralları**, **mimari standartlar**, **repository çalışma modeli**, **kod organizasyonu** ve **genişleme kuralları** hakkında tam teknik rehberdir.

FrameOS; FramePilot, FrameVision, FrameScript, FrameAudio, FrameFlow, FrameCut ve FrameStudio modüllerinden oluşan **büyük bir AI platformudur**. MVP ilk adım: Transcription Core.

Bu rehber tüm sistemi genişlemeye hazır şekilde tasarlaman için oluşturuldu.

---

# 🏗️ 2. Genel Mimari
FRAMEOS 3 temel katmandan oluşur:

```
┌──────────────────────┐
│  Frontend (Next.js)  │
└───────────┬──────────┘
            │ API Routes
┌───────────▼──────────┐
│   Backend (Next.js)   │
│   + Supabase Admin     │
└───────────┬──────────┘
            │
┌───────────▼──────────┐
│   Supabase DB + Storage │
└────────────────────────┘
```

### **Frontend → Backend → DB → AI Provider** akışı vardır.

Her modül bağımsızdır.
Her analiz JSON-schema ile saklanır.
Modüller tek repo içinde izole klasörlerde bulunur.

---

# 📁 3. Repository Yapısı (Standart)**
```
src/
  app/                     # Next.js App Router
  modules/                 # AI modülleri
    framepilot/
    framevision/
    framescript/
    frameaudio/
    frameflow/
    framecut/
    framestudio/
    shared/

  lib/                     # Core helpers
    openai.ts
    supabaseClient.ts
    supabaseAdmin.ts
    queue.ts
    logger.ts

    transcription/
      createJob.ts
      runTranscription.ts
      parseSegments.ts

  app/api/                 # REST endpoints
    videos/
    jobs/
    photos/                # Sprint 2

supabase/
  schema.sql
```

---

# 🔐 4. ENV Standartları
`.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
MAX_UPLOAD_MB=200
```

- **OPENAI_API_KEY sadece server-side kullanılabilir.**
- Service role key hiçbir zaman client’a gönderilmez.

---

# 🗄️ 5. Veritabanı Kuralları
### **Kural 1 – Her modül kendi tablo setini oluşturur.**
FrameVision → photo, photo_analysis  
FramePilot → videos, transcription, jobs  
FrameFlow → flow_reports  
vb.

### **Kural 2 – JSONB kullanımı**
AI sonuçları mutlaka JSONB formatında saklanmalıdır.

Örnek:
```
segments jsonb NOT NULL
```

### **Kural 3 – Time-based sorgulara uygun timestamp**
Tüm tablolarda `created_at timestamptz NOT NULL DEFAULT now()` olacak.

### **Kural 4 – Analizlerin versiyonlanması**
Her analizin içine `version` alanı eklenebilir.

---

# 🧠 6. AI Servis Entegrasyonu
Tüm AI işlemleri **tek bir soyutlama dosyasından** geçer:
```
src/lib/openai.ts
```

### **Amaç:**
- OpenAI → Whisper → Gemini → Llama geçişlerini kolaylaştırmak

### **Transcription kullanımı:**
```
import { transcribeVideo } from "@/lib/openai";

const result = await transcribeVideo(videoUrl);
```

### **Gelecekte:**
```
transcribeVideo(provider = "openai")
voiceAnalysis(provider = "openai")
sceneDetect(provider = "openai")
```

---

# 🧩 7. Modül Geliştirme Kuralları
Her modül **5 standart dosya** içerir:

```
moduleName/
  index.ts
  service.ts
  parser.ts
  db.ts
  types.ts
```

### **index.ts**
Modülün dışarı açılan API’si.

### **service.ts**
AI çağrıları ve iş kuralları.

### **parser.ts**
AI çıktısını normalize eder.

### **db.ts**
Bu modülün veritabanı işlemleri.

### **types.ts**
TypeScript tanımları.

---

# 🔄 8. Backend İş Akışı Kuralları
### **1. Tüm API endpoint’leri try/catch ile sarmalanmalı**
### **2. Hata formatı standart olmalı:**
```
{
  ok: false,
  error: {
    code: "VIDEO_NOT_FOUND",
    message: "Video bulunamadı"
  }
}
```

### **3. Background job mantığı**
MVP için basit async işlem kabul edilir.  
Ama her fonksiyon ileride gerçek queue (Redis/Qstash/Upstash) için hazırlanmalıdır.

### **4. Tüm video işleme işlemleri server-side çalışır**
Client hiçbir zaman:
- OpenAI key
- service role key  
görmez.

---

# 🎨 9. Frontend Kuralları
### **1. UI minimalist olacak (Tailwind)**
### **2. UI → API mapping tek yönlü**
### **3. Video detayı içinde:**
- Sol: player  
- Sağ: transcript listesi  
- Click → video.seek()

### **4. Polling mekanizması**
```
setInterval(() => fetchJobStatus(), 2000);
```

### **5. Typescript zorunlu**
### **6. Server Actions (Next.js 14) modüler kullanılabilir**

---

# 🧩 10. Genişlemeye Hazırlık
FRAMEOS gelecekte çok katmanlı bir AI platformu olacak.  
Bu nedenle şu kurallar kritik:

### ✔ Her modül bağımsız çalışmalı.  
### ✔ Her modül kendi DB tablosuna sahip olmalı.  
### ✔ Analiz sonuçları JSONB formatında tutulmalı.  
### ✔ Modüller birbirini bloke etmemeli.  
### ✔ AI provider bağımlılığı tek dosyada soyutlanmalı.  
### ✔ Tüm fonksiyonlar async/await prensibiyle yazılmalı.

---

# 🚀 11. Geliştiricinin Yol Haritası
Yeni bir modül eklemek için 7 adım:

### **1) modules/ altında klasör oluştur**
```
modules/frameaudio/
```

### **2) 5 standart dosyayı ekle**
```
index.ts
service.ts
parser.ts
db.ts
types.ts
```

### **3) Supabase tablo şemasını schema.sql’e ekle**
### **4) API endpoint’ini oluştur**
### **5) Frontend ekranı oluştur**
### **6) openai.ts içine provider fonksiyonunu ekle**
### **7) FrameStudio içinde bu modülü göster**

---

# 🔥 12. Kod Kalitesi Kuralları
### ❗ Yasaklar
- Any kullanımı (strict mode açık olmalı)
- Inline SQL sorgusu
- UI içinde iş kuralı
- Çok uzun dosyalar (max 400 satır)
- Provider’a doğrudan raw istek (openai.ts kullanılmalı)

### ✔ Zorunlular
- Prettier + ESLint
- JSDoc açıklamaları
- Typescript interface kullanımı
- Error handler
- Logging

---

# 🧪 13. Test Stratejisi
MVP hafif test kabul eder.  
Gelecekte tüm modüllerde:

### **Unit test (Jest)**
- parsers
- services
- db helpers

### **Integration test (API routes)**
### **E2E test (Playwright)**

---

# 📦 14. Build & Deployment
### **Local geliştirme:**
```
npm run dev
```

### **Production build:**
```
npm run build
npm start
```

### Deployment hedefleri:
- Vercel (Frontend + API)
- Supabase (DB + Storage)

---

# 🧬 15. CI/CD (Future)
GitHub Actions pipeline hedefi:

```
- Lint
- Type check
- Unit tests
- Build
- Deploy
```

---

# 🧩 16. Sık Yapılan Hatalar
- OpenAI anahtarının client’a sızması ❌
- DB transaction eksikliği ❌
- JSON.parse hataları ❌
- uzun AI sonuçlarının text olarak saklanması ❌ (JSONB kullanılmalı)
- UI içinde async mantık ❌

---

# 🏁 17. Sonuç
Bu rehber FrameOS geliştirme ekosisteminin **temel yasalarıdır**.  
Her modül bu kurallara göre inşa edilmelidir.

Bu doküman güncellenecek ve genişleyecek.  
FrameOS büyüdükçe bu rehber platformun anayasa kitabı olacaktır.

---

Hazırsan sırada:  
✔ CONTRIBUTING.md  
✔ LICENSE  
✔ API_REFERENCE.md  
✔ FrameOS Architecture Diagram (ASCII)

Hangisini isteyorsun üstad?

