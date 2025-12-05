# 🎬 FrameOS - AI Video Director

> **AI-Powered Video Analysis & Director System**
> 
> Video içeriğinizi analiz edin, profesyonel yönetmenlik notları alın, satış odaklı script'ler oluşturun.

## ✨ Özellikler

### 🎥 Video Analizi
- **Audio Transcription** - OpenAI Whisper ile otomatik transkript
- **Cinematic Analysis** - GPT-4 Vision ile kamera, ışık, kompozisyon analizi
- **Drone Detection** - Havadan çekim tespiti

### 🎬 AI Director Modes
1. **Scene Director** - Her sahne için detaylı yönetmenlik notları (kamera, ışık, ses, konuşma)
2. **Script Rewrite** - Mevcut konuşmayı satış psikolojisi ile iyileştir
3. **Full Rewrite** - Conversion odaklı yeni script yaz

### 🎙️ TTS (Text-to-Speech)
- OpenAI TTS ile profesyonel seslendirme
- 6 farklı ses seçeneği
- Hız ayarı

### 📥 YouTube Download
- YouTube videolarını direkt analiz et
- yt-dlp entegrasyonu

### 📄 PDF Export
- Analysis sonuçlarını PDF olarak indir
- Türkçe karakter desteği

## 🚀 Hızlı Başlangıç

### 1. Bağımlılıkları Yükle

```bash
npm install
```

### 2. FFmpeg Kurulumu

FFmpeg video işleme için gereklidir. Detaylı kurulum için: [FFMPEG_SETUP.md](FFMPEG_SETUP.md)

**Windows (Chocolatey):**
```bash
choco install ffmpeg
```

**macOS (Homebrew):**
```bash
brew install ffmpeg
```

### 3. Environment Variables

`.env.local` dosyası oluşturun:

```bash
cp .env.local.example .env.local
```

Gerekli değerleri girin:
```env
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 4. Geliştirme Sunucusunu Başlat

```bash
npm run dev
```

Tarayıcınızda `http://localhost:3000` adresini açın.

## 📊 Limitler

- **Video Boyutu:** Max 100MB
- **Video Süresi:** Max 10 dakika
- **Desteklenen Formatlar:** MP4, MOV, AVI, WebM
- **Minimum Çözünürlük:** 640x360

## 🛠️ Geliştirme Komutları

```bash
npm run dev          # Geliştirme sunucusu
npm run build        # Production build
npm start            # Production sunucusu
npm test             # Testleri çalıştır
npm run type-check   # TypeScript kontrolü
npm run lint         # ESLint
npm run format       # Prettier ile formatla
```

## 🏗️ Proje Yapısı

```
frameos/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze-full/    # Full video analysis
│   │   │   ├── director/        # AI Director
│   │   │   ├── tts/             # Text-to-Speech
│   │   │   └── download-video/  # YouTube download
│   │   ├── upload/              # Video upload page
│   │   └── videos/[id]/         # Video detail page
│   ├── lib/
│   │   ├── openai.ts            # Whisper transcription
│   │   ├── directorAI.ts        # Director AI logic
│   │   ├── directors/
│   │   │   └── cinematicDirector.ts  # Visual analysis
│   │   └── videoPreprocessor.ts # FFmpeg wrapper
│   └── types/                   # TypeScript types
├── i18n/                        # Çoklu dil (TR/EN)
├── supabase/                    # Database schema
└── .kiro/specs/                 # Spec dokümanları
```

## 📚 Dokümantasyon

- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - Geliştirici rehberi
- [FFMPEG_SETUP.md](FFMPEG_SETUP.md) - FFmpeg kurulum
- [PRODUCTION_READY_CHECKLIST.md](PRODUCTION_READY_CHECKLIST.md) - Production checklist
- [.kiro/specs/ai-director-full/](.kiro/specs/ai-director-full/) - Detaylı spec

## 🔒 Güvenlik

- ✅ API keys environment variables'da
- ✅ SSL bypass sadece development'ta
- ✅ Temp file cleanup garantili
- ✅ File size validation
- ⏳ Supabase RLS (yakında)

## 🚧 Roadmap

- [ ] Supabase persistence (localStorage yerine DB)
- [ ] User authentication
- [ ] Video chunking (25MB+ videolar için)
- [ ] Caching strategy
- [ ] Unit tests
- [ ] Error tracking (Sentry)

## 📄 Lisans

Commercial use. Bu proje FrameOS markası altında ticari ürün olacaktır.

---

**FrameOS** - AI-Powered Video Director 🎬
