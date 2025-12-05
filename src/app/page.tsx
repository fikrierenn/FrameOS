'use client';

import Link from 'next/link';

// Mock video data
const mockVideos = [
  {
    id: 'video-1',
    filename: 'demo-video-1.mp4',
    status: 'ready' as const,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'video-2',
    filename: 'presentation.mp4',
    status: 'processing' as const,
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'video-3',
    filename: 'tutorial.mp4',
    status: 'ready' as const,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function Home() {
  const getStatusBadge = (status: string) => {
    const badges = {
      uploaded: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      processing: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      ready: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      error: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
    };

    const labels = {
      uploaded: 'Yüklendi',
      processing: 'İşleniyor',
      ready: 'Hazır',
      error: 'Hata',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    return `${diffDays} gün önce`;
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🎬 FrameOS
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            AI-Powered Video & Foto Analiz Platformu
          </p>
        </div>

        {/* Action Bar */}
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Videolarım
          </h2>
          <Link
            href="/upload"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md transition-colors"
          >
            + Yeni Video Yükle
          </Link>
        </div>

        {/* Videos Grid */}
        {mockVideos.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📹</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Henüz video yüklemediniz
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              İlk videonuzu yükleyerek başlayın
            </p>
            <Link
              href="/upload"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md transition-colors"
            >
              Video Yükle
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockVideos.map((video) => (
              <Link
                key={video.id}
                href={`/videos/${video.id}`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow group"
              >
                {/* Thumbnail */}
                <div className="bg-gray-200 dark:bg-gray-700 aspect-video flex items-center justify-center">
                  <span className="text-6xl">🎬</span>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {video.filename}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(video.created_at)}
                    </span>
                    {getStatusBadge(video.status)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3">
            ℹ️ Platform Özellikleri
          </h3>
          <ul className="space-y-2 text-blue-800 dark:text-blue-400">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">✓</span>
              <span>Otomatik video transkripsiyon (OpenAI Whisper)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">✓</span>
              <span>Çoklu dil desteği (Türkçe, İngilizce, vb.)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">✓</span>
              <span>Zaman damgalı segment analizi</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">✓</span>
              <span>Güvenli veri şifreleme (AES-256-GCM)</span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
