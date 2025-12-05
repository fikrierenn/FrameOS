# ⏱️ Rate Limit Hatası - Çözüm

## 🔴 Sorun
```
Request failed with status code 429
```

Bu hata **Gemini API'nin ücretsiz tier rate limit'i** aşıldığında oluşur.

---

## 📊 Gemini API Limitleri

### Ücretsiz Tier:
- **15 istek / dakika**
- **1,500 istek / gün**
- **1 milyon token / dakika**

### Bizim Durumumuz:
- Video boyutu: **9.90MB** = ~13.8MB base64
- Retry mekanizması: **2 deneme**
- Her deneme: **1 istek**

**Sorun**: Retry'lar çok hızlı yapıldı, dakikada 15 isteği aştık!

---

## ✅ Yapılan Düzeltmeler

1. **Retry sayısı azaltıldı**: 3 → 2
2. **Bekleme süresi artırıldı**: 2s, 4s → 5s, 10s
3. **Rate limit kontrolü eklendi**: 429 hatası alınca retry yapılmıyor
4. **Detaylı error mesajları**: Kullanıcı ne olduğunu anlıyor

---

## 🎯 Şimdi Ne Yapmalısın?

### Seçenek 1: Bekle (Önerilen)
```
⏳ 1-2 dakika bekle
🔄 Sayfayı yenile
🎬 Tekrar video yükle
```

Rate limit dakikada sıfırlanır. 1-2 dakika bekleyince tekrar çalışacak.

### Seçenek 2: Daha Küçük Video Dene
```
📹 1 dakikadan kısa video seç
📦 Daha küçük dosya boyutu (< 5MB)
```

Küçük videolar daha az token kullanır.

### Seçenek 3: Gemini API Key Yükselt
```
💳 Google AI Studio'ya git
💰 Ücretli plana geç
🚀 Sınırsız istek
```

Ücretli plan: $0.075 / 1M token (çok ucuz!)

---

## 🔍 Rate Limit Kontrolü

Şu anda kaç istek kaldığını görmek için:
```
https://aistudio.google.com/app/apikey
```

Buradan API key'inin kullanım istatistiklerini görebilirsin.

---

## 📝 Sonraki Adımlar

1. ✅ **Şimdi**: 1-2 dakika bekle
2. ✅ **Sonra**: Küçük bir video ile test et (1 dakika, < 5MB)
3. 🔜 **İleride**: Supabase ekle (video storage + database)
4. 🔜 **İleride**: Production'a geç (ücretli plan)

---

**1-2 dakika bekle ve tekrar dene!** ⏳
