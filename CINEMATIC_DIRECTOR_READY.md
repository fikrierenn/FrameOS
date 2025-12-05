# 🎥 Cinematic Director - Görsel Analiz Hazır!

## ✅ Eklenen Özellikler

### 1. Cinematic Director Modülü
**Dosya**: `src/lib/directors/cinematicDirector.ts`

**Analiz Edilen**:
- 🚁 **Drone Tespiti** - Havadan çekim var mı?
- 🎥 **Kamera Tipi** - Handheld, Tripod, Gimbal, Drone, Static
- 📹 **Kamera Hareketi** - Smooth, Shaky, Dynamic
- 📐 **Kamera Açıları** - Wide, Close-up, Aerial, Eye-level
- 💡 **Işık Analizi** - Doğal/Yapay, Kalite, Parlaklık, Sorunlar
- 🎨 **Kompozisyon** - Framing, Arka plan, Rule of thirds
- 📊 **Kalite** - Çözünürlük, Renk dengesi, Netlik

### 2. Full Analysis API
**Endpoint**: `POST /api/analyze-full`

**İşlem Akışı**:
1. Video yüklenir
2. Audio transcription (Whisper)
3. Frame extraction (FFmpeg - 1 frame/2 saniye)
4. Cinematic analysis (GPT-4 Vision - 5 frame sample)
5. Sonuçlar döner

### 3. Director AI Entegrasyonu
**Güncellenen**: `src/lib/directorAI.ts`

**Yeni Özellik**:
- Cinematic analysis data kullanılıyor
- Görsel bilgi ile zenginleştirilmiş öneriler
- Drone tespiti sonuçları önerilere yansıyor

---

## 🎯 Kullanım

### Test İçin:

1. **Video Yükle** (yeni endpoint ile):
   ```
   POST /api/analyze-full
   ```

2. **Sonuçları Gör**:
   ```json
   {
     "transcription": { ... },
     "cinematic": {
       "overall_score": 85,
       "camera_analysis": {
         "type": "drone",
         "drone_detected": true,
         "stability_score": 90
       },
       "lighting_analysis": { ... },
       "composition_analysis": { ... }
     }
   }
   ```

3. **Director Mode Kullan**:
   - Artık "Sahne Yönetmenliği" butonu görsel analiz kullanıyor
   - Drone çekimi varsa öneriler buna göre şekilleniyor

---

## 📊 Örnek Çıktı

### Tarla Videosu (Drone ile):
```
🎥 KAMERA:
- Tip: drone
- 🚁 DRONE TESPİTİ: EVET - Havadan çekim var!
- Stabilizasyon: 90/100
- Açılar: aerial, wide

💡 IŞIK:
- Tip: natural
- Kalite: excellent
- Parlaklık: 85/100

🎨 KOMPOZİSYON:
- Framing: excellent
- Arka plan: clean
- Rule of thirds: Evet

📊 ÖNERİLER:
- Drone çekimlerini artır - tarla satışı için mükemmel
- Geniş açı çekimleri devam ettir
- Doğal ışık mükemmel, öğlen saatlerinde çekmeye devam et
```

### Gayrimenkul Videosu (Handheld):
```
🎥 KAMERA:
- Tip: handheld
- 🚁 DRONE TESPİTİ: Hayır
- Stabilizasyon: 65/100
- Açılar: eye-level, close-up

💡 IŞIK:
- Tip: mixed
- Kalite: fair
- Parlaklık: 60/100
- Sorunlar: Bazı odalarda karanlık

📊 ÖNERİLER:
- Gimbal kullan - daha smooth görüntü
- İç mekanda soft box ekle
- Dış cephe için drone çekimi ekle
- Işığı artır - özellikle yatak odalarında
```

---

## 💰 Maliyet

### GPT-4 Vision:
- $0.01 / image
- 5 frame sample per video
- **Maliyet per video**: ~$0.05 (1.50 TL)

### Toplam (Whisper + Vision):
- 2 dakikalık video: $0.012 (Whisper) + $0.05 (Vision) = **$0.062 (1.86 TL)**
- 5 dakikalık video: $0.03 (Whisper) + $0.05 (Vision) = **$0.08 (2.40 TL)**

**Çok makul!** 💰

---

## 🚀 Sonraki Adımlar

1. **Sunucuyu restart et**
2. **Test et** - Tarla videosu ile
3. **Sonuçları gör** - Drone tespiti çalışıyor mu?

---

## 🎬 Artık Tam Kapsamlı AI Director!

- ✅ Audio analizi (Whisper)
- ✅ **Görsel analizi (GPT-4 Vision)** 🆕
- ✅ **Drone tespiti** 🆕
- ✅ Kamera, ışık, kompozisyon analizi 🆕
- ✅ Satış psikolojisi
- ✅ Funnel stratejisi
- ✅ Sosyal medya optimizasyonu

**Gerçek bir SİNEMATOGRAFİ + SATIŞ UZMANI!** 🎥💰
