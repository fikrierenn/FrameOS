# 🎬 Director Mode - Teknik Spesifikasyon

## 🎯 Vizyon

Video yüklendi → AI izliyor, dinliyor, analiz ediyor → Yönetmen koltuğuna oturuyor → Profesyonel öneriler sunuyor

---

## 🏗️ Sistem Mimarisi

### 1. Video Analiz Pipeline

```
Video Upload
    ↓
[1] Audio Extraction (Whisper)
    ↓
[2] Visual Analysis (GPT-4 Vision)
    ↓
[3] Scene Detection (FFmpeg)
    ↓
[4] Director AI (GPT-4)
    ↓
Director Notes + Script Rewrite
```

---

## 🎥 Özellik 1: Sahne Bazlı Yönetmenlik

### Input:
```json
{
  "video": "video.mp4",
  "transcription": {
    "segments": [
      { "start": 4, "end": 7, "text": "Mutfağımız ankastre dahil" }
    ]
  },
  "scenes": [
    { "start": 4, "end": 7, "description": "Kitchen view, appliances visible" }
  ]
}
```

### AI Prompt:
```
Sen bir video yönetmenisin. Gayrimenkul tanıtım videosu izliyorsun.

Video: {video_description}
Konuşma: {transcription}
Sahneler: {scenes}

Her sahne için:
1. Görsel öneriler (text overlay, animasyon, vurgu)
2. Ses önerileri (müzik, efekt, vurgu)
3. Konuşma önerileri (eklenmesi/çıkarılması gereken cümleler)

Format:
[00:04-00:07] 
📹 Görsel: Sol üstte "ANKASTRE DAHİL" yazısı animasyonlu çıksın
🎵 Ses: Hafif buildup müziği ekle
💬 Konuşma: "Mutfağımız ankastre dahil" → "Mutfağımız komple ankastre dahil, Bosch marka"
```

### Output:
```json
{
  "director_notes": [
    {
      "timestamp": "00:04-00:07",
      "visual": "Sol üstte 'ANKASTRE DAHİL' yazısı animasyonlu çıksın",
      "audio": "Hafif buildup müziği ekle",
      "speech": "Mutfağımız komple ankastre dahil, Bosch marka",
      "reasoning": "Ankastre vurgusu satış için kritik, marka belirtmek güven verir"
    }
  ]
}
```

---

## 🎙 Özellik 2: Konuşma Yönetimi (Script Director)

### AI Prompt:
```
Sen bir script writer'sın. Gayrimenkul tanıtım videosu için konuşma metni yazıyorsun.

Mevcut konuşma:
{current_transcription}

Görevin:
1. Gereksiz cümleleri temizle
2. Akışı düzelt
3. Daha vurucu, satış odaklı yap
4. Empati cümleleri ekle
5. CTA optimize et

Kurallar:
- Hook: İlk 3 saniye dikkat çekici olmalı
- Değer vurgusu: Her özelliği değere çevir
- CTA: Net ve aciliyet yaratmalı
- Ton: Samimi ama profesyonel

Format:
[Analiz]
- Sorunlar: ...
- Fırsatlar: ...

[Yeni Script]
[00:00-00:03] "Hook cümlesi"
[00:04-00:10] "Değer vurgusu"
...
```

### Output:
```json
{
  "analysis": {
    "problems": [
      "Hook yok, video düz başlıyor",
      "Özellikler sıralanıyor ama değere çevrilmiyor",
      "CTA çok zayıf"
    ],
    "opportunities": [
      "Lokasyon vurgusu yapılabilir",
      "Nadir özellikler öne çıkarılabilir",
      "Aciliyet yaratılabilir"
    ]
  },
  "new_script": [
    {
      "timestamp": "00:00-00:03",
      "text": "Özlüce'nin kalbinde, tamamen yenilenmiş 3+1 bir daireye hoş geldiniz.",
      "note": "Hook: Lokasyon + durum vurgusu"
    }
  ]
}
```

---

## 🪄 Özellik 3: Full Rewrite Mode

### AI Prompt:
```
Sen bir profesyonel video script writer'sın.

Video: {video_url}
Mevcut konuşma: {transcription}
Sahneler: {scenes}

Görevin:
1. Videoyu izle (GPT-4 Vision)
2. Sahneleri ayır
3. Tamamen yeni bir anlatıcı metni çıkar
4. Metni sahnelere göre zamanla
5. CTA, değer vurgusu, bölüm başlıkları ekle

Format:
[00:00-00:03] "Hook cümlesi"
[00:04-00:07] "Salon tanıtımı"
[00:08-00:10] "Mutfak vurgusu"
...

Her cümle:
- Kısa ve net
- Değer odaklı
- Satış diline uygun
```

### Output:
```json
{
  "rewritten_script": [
    {
      "timestamp": "00:00-00:03",
      "text": "Özlüce'nin kalbinde, tamamen yenilenmiş 3+1 bir daireye hoş geldiniz.",
      "scene": "Entrance/Living room",
      "purpose": "Hook + Location emphasis"
    },
    {
      "timestamp": "00:04-00:07",
      "text": "Salonumuz güney cepheli, 35 m² ve gün ışığını direkt alıyor.",
      "scene": "Living room",
      "purpose": "Value proposition"
    }
  ],
  "improvements": [
    "Hook eklendi",
    "Değer vurguları artırıldı",
    "CTA güçlendirildi"
  ]
}
```

---

## 🛠️ Teknik Implementasyon

### 1. Video Analysis Service

```typescript
// src/lib/videoAnalysis.ts

import OpenAI from 'openai';
import ffmpeg from 'fluent-ffmpeg';

export async function analyzeVideo(videoFile: File) {
  // 1. Audio transcription (zaten var)
  const transcription = await transcribeVideo(videoFile);
  
  // 2. Scene detection
  const scenes = await detectScenes(videoFile);
  
  // 3. Visual analysis (GPT-4 Vision)
  const visualAnalysis = await analyzeVisuals(videoFile, scenes);
  
  // 4. Director AI
  const directorNotes = await generateDirectorNotes({
    transcription,
    scenes,
    visualAnalysis
  });
  
  return {
    transcription,
    scenes,
    visualAnalysis,
    directorNotes
  };
}
```

### 2. Scene Detection

```typescript
async function detectScenes(videoFile: File): Promise<Scene[]> {
  // FFmpeg ile scene detection
  // Her sahnenin başlangıç/bitiş zamanı
  // Her sahnenin thumbnail'i
  
  return [
    {
      start: 0,
      end: 3,
      thumbnail: 'scene1.jpg',
      description: 'Entrance view'
    }
  ];
}
```

### 3. Visual Analysis (GPT-4 Vision)

```typescript
async function analyzeVisuals(
  videoFile: File, 
  scenes: Scene[]
): Promise<VisualAnalysis[]> {
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  
  const analyses = [];
  
  for (const scene of scenes) {
    // Her sahnenin thumbnail'ini GPT-4 Vision'a gönder
    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Bu gayrimenkul videosunun sahnesini analiz et. Ne görüyorsun? Hangi özellikler var?'
            },
            {
              type: 'image_url',
              image_url: {
                url: scene.thumbnail
              }
            }
          ]
        }
      ]
    });
    
    analyses.push({
      scene: scene,
      description: response.choices[0].message.content
    });
  }
  
  return analyses;
}
```

### 4. Director AI

```typescript
async function generateDirectorNotes(data: {
  transcription: TranscriptionResult;
  scenes: Scene[];
  visualAnalysis: VisualAnalysis[];
}): Promise<DirectorNotes> {
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  
  const prompt = `
Sen bir video yönetmenisin. Gayrimenkul tanıtım videosu analiz ediyorsun.

TRANSKRIPT:
${JSON.stringify(data.transcription, null, 2)}

SAHNELER:
${JSON.stringify(data.scenes, null, 2)}

GÖRSEL ANALİZ:
${JSON.stringify(data.visualAnalysis, null, 2)}

Her sahne için yönetmenlik notları ver:
1. Görsel öneriler (text overlay, animasyon)
2. Ses önerileri (müzik, efekt)
3. Konuşma önerileri (ekleme/çıkarma)

Format: JSON
{
  "director_notes": [
    {
      "timestamp": "00:04-00:07",
      "visual": "...",
      "audio": "...",
      "speech": "...",
      "reasoning": "..."
    }
  ]
}
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' }
  });
  
  return JSON.parse(response.choices[0].message.content);
}
```

---

## 🎨 UI/UX Tasarımı

### Director Mode Sayfası

```
┌─────────────────────────────────────────────────────┐
│  🎬 Director Mode                                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐  ┌──────────────────────────┐   │
│  │              │  │  Director Notes          │   │
│  │    Video     │  │                          │   │
│  │   Player     │  │  [00:04-00:07]          │   │
│  │              │  │  📹 Sol üstte "ANKASTRE  │   │
│  │              │  │     DAHİL" yazısı        │   │
│  └──────────────┘  │  🎵 Buildup müziği       │   │
│                    │  💬 "Bosch marka" ekle   │   │
│  Timeline:         │                          │   │
│  ━━━━━━━━━━━━━━   │  [00:12-00:16]          │   │
│  ^                 │  📹 Salon genişliği      │   │
│  00:04             │     vurgula              │   │
│                    │  💬 "Güney cepheli"      │   │
│  [Modes]           │     ekle                 │   │
│  ○ Scene Director  │                          │   │
│  ○ Script Rewrite  └──────────────────────────┘   │
│  ○ Full Rewrite                                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

```sql
-- Director Analysis
CREATE TABLE director_analyses (
  id UUID PRIMARY KEY,
  video_id UUID REFERENCES videos(id),
  mode TEXT, -- 'scene_director' | 'script_rewrite' | 'full_rewrite'
  
  -- Scene detection
  scenes JSONB,
  
  -- Visual analysis
  visual_analysis JSONB,
  
  -- Director notes
  director_notes JSONB,
  
  -- Rewritten script
  rewritten_script JSONB,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 💰 Maliyet Analizi

### OpenAI API Costs:

1. **Whisper** (Audio transcription)
   - $0.006 / dakika
   - 2 dakikalık video: $0.012

2. **GPT-4 Vision** (Visual analysis)
   - $0.01 / image
   - 10 sahne: $0.10

3. **GPT-4 Turbo** (Director AI)
   - $0.01 / 1K tokens (input)
   - $0.03 / 1K tokens (output)
   - ~5K tokens: $0.20

**Toplam per video**: ~$0.33 (10 TL)

**1000 video/ay**: $330/ay (10,000 TL)

---

## 🚀 Implementasyon Planı

### Phase 1: Scene Director (1 hafta)
- ✅ Whisper transcription (zaten var)
- 🔲 Scene detection (FFmpeg)
- 🔲 GPT-4 Vision integration
- 🔲 Director AI prompt
- 🔲 UI: Director notes display

### Phase 2: Script Rewrite (3 gün)
- 🔲 Script analysis AI
- 🔲 Rewrite generation
- 🔲 UI: Side-by-side comparison

### Phase 3: Full Rewrite (3 gün)
- 🔲 Complete script generation
- 🔲 Timeline sync
- 🔲 Export functionality

### Phase 4: Polish (2 gün)
- 🔲 UI/UX improvements
- 🔲 Performance optimization
- 🔲 Error handling

**Toplam**: ~2 hafta

---

## 🎯 Başarı Metrikleri

1. **Kullanım**: Kaç video analiz edildi?
2. **Kalite**: Director notes ne kadar uygulandı?
3. **Memnuniyet**: Kullanıcı feedback'i
4. **ROI**: Maliyet vs değer

---

## 🏆 Rekabet Avantajı

Bu özellik **dünyada yok**! 

- Runway ML: Sadece video generation
- Descript: Sadece editing
- Kapwing: Sadece basic tools

**Bizim sistem**: AI Director - Video izleyip yönetmenlik yapıyor! 🎬

---

## 🚀 Hemen Başlayalım!

Hangi phase'den başlamak istersin?

1. **Phase 1**: Scene Director (temel)
2. **Prototype**: Hızlı demo (1 gün)
3. **Full System**: Tüm özellikler (2 hafta)

Ben hazırım! 🎬
