# FFmpeg Kurulum Rehberi (Windows)

## ⚠️ FFmpeg Gerekli!

Video preprocessing için FFmpeg sisteminizde kurulu olmalı.

---

## Seçenek 1: Chocolatey (Önerilen - En Kolay)

### 1. Chocolatey Kurulu mu Kontrol Et:
```powershell
choco --version
```

### 2. Chocolatey Yoksa Kur:
PowerShell'i **Administrator** olarak aç ve çalıştır:
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

### 3. FFmpeg'i Kur:
```powershell
choco install ffmpeg
```

### 4. Kontrol Et:
```powershell
ffmpeg -version
```

---

## Seçenek 2: Manuel Kurulum

### 1. FFmpeg İndir:
https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip

### 2. Zip'i Aç:
- `C:\ffmpeg` klasörüne çıkar

### 3. PATH'e Ekle:
- Windows Search → "Environment Variables"
- "System variables" → "Path" → "Edit"
- "New" → `C:\ffmpeg\bin` ekle
- "OK" → "OK"

### 4. Terminal'i Yeniden Başlat:
- Tüm terminal pencerelerini kapat
- Yeni terminal aç

### 5. Kontrol Et:
```powershell
ffmpeg -version
```

---

## Seçenek 3: Scoop (Alternatif)

### 1. Scoop Kur:
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
```

### 2. FFmpeg Kur:
```powershell
scoop install ffmpeg
```

### 3. Kontrol Et:
```powershell
ffmpeg -version
```

---

## ✅ Kurulum Sonrası Test

FFmpeg kurulduktan sonra, video preprocessing'i test edebilirsiniz:

```typescript
import { videoPreprocessor } from '@/lib/videoPreprocessor';

// Test
const metadata = await videoPreprocessor.getMetadata('test-video.mp4');
console.log(metadata);
```

---

## 🚀 Sonraki Adımlar

FFmpeg kurulduktan sonra:
1. Terminal'i yeniden başlat
2. `npm run dev` ile sunucuyu başlat
3. Video preprocessing çalışacak!

---

## 💡 Not

- FFmpeg kurulumu **bir kerelik** işlemdir
- Tüm video işleme özellikleri için gereklidir
- Production'da da gerekli olacak (Docker image'e dahil edilecek)
