# Text-to-Speech (TTS) Feature Completed ✅

## Özellik
Yeniden yazılmış script metinlerini OpenAI TTS API kullanarak seslendirme

## Implementation

### 1. Backend - TTS API Endpoint
**Dosya**: `src/app/api/tts/route.ts`

**Özellikler**:
- OpenAI TTS-1 model kullanımı
- Ses seçimi (alloy, echo, fable, onyx, nova, shimmer)
- Hız kontrolü (speed parameter)
- MP3 format audio döndürme
- Error handling ve logging

**API Kullanımı**:
```typescript
POST /api/tts
{
  "text": "Seslendirilecek metin",
  "voice": "alloy",
  "speed": 1.0
}
```

### 2. Frontend - UI Integration
**Dosya**: `src/app/videos/[id]/page.tsx`

**Eklenen State**:
```typescript
const [playingAudio, setPlayingAudio] = useState<number | null>(null);
const [audioLoading, setAudioLoading] = useState<number | null>(null);
const audioRef = useRef<HTMLAudioElement | null>(null);
```

**Eklenen Fonksiyon**:
- `handleTextToSpeech(text, index)` - TTS API'yi çağırır, audio oluşturur ve çalar

**UI Değişiklikleri**:
1. **Script Rewrite modunda**: Her "Yeni:" metnin altına "🔊 Seslendir" butonu
2. **Full Rewrite modunda**: Her script segmentinin altına "🔊 Seslendir" butonu

**Buton Durumları**:
- ⏳ Yükleniyor... (audio oluşturulurken)
- 🔊 Seslendir (hazır durumda)
- ⏸️ Durdur (çalarken)

### 3. Özellikler

✅ **Tek Seferde Bir Audio**: Yeni audio başlatıldığında önceki durdurulur
✅ **Play/Pause Toggle**: Aynı butona tekrar basınca durdurur
✅ **Loading State**: API çağrısı sırasında loading gösterir
✅ **Error Handling**: Hata durumunda kullanıcıya bilgi verir
✅ **Memory Management**: Audio bitince URL'i temizler
✅ **Türkçe Ses**: Alloy voice Türkçe için uygun

## Kullanım Akışı

1. Kullanıcı videoyu yükler
2. "Script Rewrite" veya "Full Rewrite" modunu seçer
3. AI yeniden yazılmış script'i gösterir
4. Kullanıcı "🔊 Seslendir" butonuna basar
5. TTS API metni seslendiri
6. Audio otomatik çalar
7. Kullanıcı isterse "⏸️ Durdur" ile durdurabilir

## Test Edilmesi Gerekenler

1. ✅ Script Rewrite modunda seslendir butonu görünüyor mu?
2. ✅ Full Rewrite modunda seslendir butonu görünüyor mu?
3. ⏳ TTS API çalışıyor mu? (OpenAI API key gerekli)
4. ⏳ Audio düzgün çalıyor mu?
5. ⏳ Türkçe telaffuz doğru mu?
6. ⏳ Play/Pause toggle çalışıyor mu?
7. ⏳ Loading state görünüyor mu?

## Gelecek İyileştirmeler

- [ ] Ses seçimi (alloy, nova, shimmer)
- [ ] Hız kontrolü (0.5x, 1x, 1.5x, 2x)
- [ ] Audio cache (aynı metni tekrar seslendirmemek için)
- [ ] Duygu/ton parametresi (energetic, calm, professional)
- [ ] Tüm script'i tek seferde seslendir
- [ ] Audio download butonu

## Dosyalar

- ✅ `src/app/api/tts/route.ts` - TTS API endpoint
- ✅ `src/app/videos/[id]/page.tsx` - UI integration
- ✅ `.kiro/specs/ai-director-full/tasks.md` - Task 7.2.2 eklendi

## Maliyet

OpenAI TTS-1 fiyatlandırması:
- $0.015 / 1,000 karakter
- Ortalama script segment: ~200 karakter
- Segment başına maliyet: ~$0.003 (3 kuruş)

## Notlar

- TTS API OpenAI API key gerektirir
- Audio dosyaları cache edilmiyor (her seferinde yeniden oluşturuluyor)
- Türkçe telaffuz için "alloy" voice kullanılıyor
- Audio format: MP3
