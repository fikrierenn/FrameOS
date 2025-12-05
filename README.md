# 🎬 FrameOS - Transcription Core (MVP)

> **Video & Foto AI Analiz Ekosistemi - Sprint 1: Transcription Core**

## 🚀 Hızlı Başlangıç

### 1. Bağımlılıkları Yükle

```bash
npm install
```

### 2. Environment Variables

`.env.local` dosyası oluşturun (`.env.local.example` dosyasını kopyalayın):

```bash
cp .env.local.example .env.local
```

Ardından `.env.local` dosyasını düzenleyin ve gerekli değerleri girin.

**Encryption Key Oluşturma:**
```bash
openssl rand -hex 32
```

### 3. Geliştirme Sunucusunu Başlat

```bash
npm run dev
```

Tarayıcınızda `http://localhost:3000` adresini açın.

## 📚 Dokümantasyon

Detaylı dokümantasyon için `.kiro/specs/transcription-core/` klasörüne bakın:

- [Requirements](../.kiro/specs/transcription-core/requirements.md)
- [Design](../.kiro/specs/transcription-core/design.md)
- [Tasks](../.kiro/specs/transcription-core/tasks.md)
- [Spec README](../.kiro/specs/transcription-core/README.md)

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
│   ├── app/              # Next.js App Router
│   ├── modules/          # Modüler yapı (framepilot, shared)
│   ├── lib/              # Core helpers
│   └── types/            # TypeScript types
├── i18n/                 # Çoklu dil
├── supabase/             # Database schema
└── .kiro/specs/          # Spec dokümanları
```

## 📄 Lisans

Commercial use. Bu proje FrameOS markası altında ticari ürün olacaktır.

---

**FrameOS** - AI-Powered Content Analysis Platform 🚀
