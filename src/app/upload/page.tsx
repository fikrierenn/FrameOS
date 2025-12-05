'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'file' | 'url'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const MAX_SIZE_MB = 100;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);

    if (!selectedFile) return;

    // Dosya boyutu kontrolü
    if (selectedFile.size > MAX_SIZE_BYTES) {
      setError(`Dosya çok büyük. Maksimum ${MAX_SIZE_MB}MB olmalıdır`);
      setFile(null);
      return;
    }

    // Video formatı kontrolü
    if (!selectedFile.type.startsWith('video/')) {
      setError('Lütfen bir video dosyası seçin');
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  // SOLID: Single Responsibility - Her fonksiyon tek bir iş yapar
  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const progressInterval = setInterval(() => {
        setProgress((prev) => (prev >= 90 ? 90 : prev + 10));
      }, 500);

      const response = await fetch('/api/analyze-full', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Yükleme başarısız oldu');
      }

      const result = await response.json();
      setProgress(100);

      await saveVideoAndNavigate(file.name, result.data, file);
    } catch (err) {
      handleError(err);
    }
  };

  // SOLID: Single Responsibility - URL'den indirme işlemi ayrı fonksiyon
  const handleDownloadFromUrl = async () => {
    if (!videoUrl.trim()) {
      setError('Lütfen bir video linki girin');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      setProgress(10);
      
      // Video indir
      const downloadResponse = await fetch('/api/download-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: videoUrl }),
      });

      if (!downloadResponse.ok) {
        const errorData = await downloadResponse.json();
        throw new Error(errorData.details || 'Video indirilemedi');
      }

      const downloadResult = await downloadResponse.json();
      setProgress(30);

      // Base64'ü Blob'a çevir
      const videoBlob = base64ToBlob(downloadResult.video, 'video/mp4');
      const videoFile = new File([videoBlob], downloadResult.filename, { type: 'video/mp4' });

      setProgress(40);

      // Analiz et
      const formData = new FormData();
      formData.append('file', videoFile);

      const analyzeResponse = await fetch('/api/analyze-full', {
        method: 'POST',
        body: formData,
      });

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json();
        throw new Error(errorData.error || 'Analiz başarısız oldu');
      }

      const analyzeResult = await analyzeResponse.json();
      setProgress(100);

      await saveVideoAndNavigate(downloadResult.filename, analyzeResult.data, videoFile);
    } catch (err) {
      handleError(err);
    }
  };

  // SOLID: Single Responsibility - Video kaydetme ve yönlendirme
  const saveVideoAndNavigate = async (filename: string, data: any, videoFile: File) => {
    const videoBlobUrl = URL.createObjectURL(videoFile);
    const videoId = `video-${Date.now()}`;
    
    sessionStorage.setItem(`video-blob-${videoId}`, videoBlobUrl);
    
    localStorage.setItem(
      videoId,
      JSON.stringify({
        filename,
        transcription: data.transcription,
        cinematic: data.cinematic,
        uploadedAt: new Date().toISOString(),
        hasVideo: true,
      })
    );

    setTimeout(() => {
      router.push(`/videos/${videoId}`);
    }, 500);
  };

  // SOLID: Single Responsibility - Hata yönetimi
  const handleError = (err: unknown) => {
    setError(err instanceof Error ? err.message : 'İşlem başarısız oldu');
    setUploading(false);
    setProgress(0);
  };

  // SOLID: Single Responsibility - Base64 to Blob dönüşümü
  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
          >
            ← Geri
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Video Yükle
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Transkript edilmek üzere video dosyanızı yükleyin
          </p>
        </div>

        {/* Upload Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('file')}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === 'file'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              📁 Dosya Yükle
            </button>
            <button
              onClick={() => setActiveTab('url')}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === 'url'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              🔗 Link'ten İndir
            </button>
          </div>

          {/* File Upload Tab */}
          {activeTab === 'file' && (
            <div className="mb-6">
              <label
                htmlFor="video-upload"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Video Dosyası
              </label>
              <input
                id="video-upload"
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                disabled={uploading}
                className="block w-full text-sm text-gray-900 dark:text-gray-100
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  dark:file:bg-blue-900 dark:file:text-blue-300
                  disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Maksimum dosya boyutu: {MAX_SIZE_MB}MB
              </p>

              {/* Selected File Info */}
              {file && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Seçilen Dosya:
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Boyut: {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              )}
            </div>
          )}

          {/* URL Download Tab */}
          {activeTab === 'url' && (
            <div className="mb-6">
              <label
                htmlFor="video-url"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Video Linki
              </label>
              <input
                id="video-url"
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                disabled={uploading}
                placeholder="https://youtube.com/watch?v=... veya https://instagram.com/..."
                className="block w-full px-4 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Desteklenen platformlar: YouTube, Instagram, TikTok, Twitter ve daha fazlası
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Progress Bar */}
          {uploading && (
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Yükleniyor...
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Upload/Download Button */}
          <button
            onClick={activeTab === 'file' ? handleUpload : handleDownloadFromUrl}
            disabled={activeTab === 'file' ? (!file || uploading) : (!videoUrl.trim() || uploading)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-200"
          >
            {uploading 
              ? (activeTab === 'file' ? 'Yükleniyor...' : 'İndiriliyor ve Analiz Ediliyor...') 
              : (activeTab === 'file' ? 'Yükle ve Transkript Et' : 'İndir ve Analiz Et')
            }
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
            ℹ️ Bilgi
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
            <li>• Video yüklendikten sonra otomatik olarak transkript edilecektir</li>
            <li>• 🆕 Görsel analiz yapılacak (kamera, ışık, drone tespiti)</li>
            <li>• İşlem süresi video uzunluğuna bağlı olarak değişir</li>
            <li>• Desteklenen formatlar: MP4, MOV, AVI, MKV</li>
            <li>• Maksimum video uzunluğu: 10 dakika</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
