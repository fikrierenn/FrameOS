'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Segment {
  id: number;
  start: number;
  end: number;
  text: string;
}

interface VideoData {
  filename: string;
  transcription: {
    text: string;
    language: string;
    segments: Segment[];
  };
  cinematic?: {
    overall_score?: number;
    camera_analysis?: {
      type: string;
      movement: string;
      angles: string[];
      stability_score: number;
      drone_detected: boolean;
      recommendations?: string[];
    };
    lighting_analysis?: {
      type: string;
      quality: string;
      brightness_score: number;
      issues: string[];
      recommendations?: string[];
    };
    composition_analysis?: {
      framing: string;
      background: string;
      rule_of_thirds: boolean;
      subject_positioning?: string;
      recommendations?: string[];
    };
    quality_analysis?: {
      resolution_quality: string;
      color_balance?: string;
      sharpness: string;
      overall_quality?: number;
      issues?: string[];
    };
    recommendations?: string[];
  };
  uploadedAt: string;
  hasVideo?: boolean;
}

interface DirectorNote {
  timestamp: string;
  visual: string;
  audio: string;
  speech: string;
  reasoning: string;
}

interface ScriptRewrite {
  timestamp: string;
  original: string;
  rewritten: string;
  improvement: string;
  emotion?: string;
}

type DirectorMode = 'scene_director' | 'script_rewrite' | 'full_rewrite' | null;

export default function VideoDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  
  // Director Mode states
  const [directorMode, setDirectorMode] = useState<DirectorMode>(null);
  const [directorAnalysis, setDirectorAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // TTS states
  const [playingAudio, setPlayingAudio] = useState<number | null>(null);
  const [audioLoading, setAudioLoading] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Türkçe çeviri fonksiyonları
  const translateCameraType = (type: string) => {
    const translations: Record<string, string> = {
      'handheld': 'El Kamerası',
      'tripod': 'Tripod',
      'gimbal': 'Gimbal',
      'drone': 'Drone',
      'static': 'Sabit',
      'unknown': 'Bilinmiyor'
    };
    return translations[type?.toLowerCase()] || type || 'Bilinmiyor';
  };

  const translateMovement = (movement: string) => {
    const translations: Record<string, string> = {
      'smooth': 'Akıcı',
      'shaky': 'Titrek',
      'static': 'Sabit',
      'dynamic': 'Dinamik',
      'unknown': 'Bilinmiyor'
    };
    return translations[movement?.toLowerCase()] || movement || 'Bilinmiyor';
  };

  const translateLightingType = (type: string) => {
    const translations: Record<string, string> = {
      'natural': 'Doğal',
      'artificial': 'Yapay',
      'mixed': 'Karışık',
      'unknown': 'Bilinmiyor'
    };
    return translations[type?.toLowerCase()] || type || 'Bilinmiyor';
  };

  const translateQuality = (quality: string) => {
    const translations: Record<string, string> = {
      'excellent': 'Mükemmel',
      'good': 'İyi',
      'fair': 'Orta',
      'poor': 'Zayıf',
      'unknown': 'Bilinmiyor'
    };
    return translations[quality?.toLowerCase()] || quality || 'Bilinmiyor';
  };

  const translateFraming = (framing: string) => {
    const translations: Record<string, string> = {
      'excellent': 'Mükemmel',
      'good': 'İyi',
      'fair': 'Orta',
      'poor': 'Zayıf',
      'unknown': 'Bilinmiyor'
    };
    return translations[framing?.toLowerCase()] || framing || 'Bilinmiyor';
  };

  const translateBackground = (background: string) => {
    const translations: Record<string, string> = {
      'clean': 'Temiz',
      'cluttered': 'Dağınık',
      'distracting': 'Dikkat Dağıtıcı',
      'appropriate': 'Uygun',
      'unknown': 'Bilinmiyor'
    };
    return translations[background?.toLowerCase()] || background || 'Bilinmiyor';
  };

  const translateAngle = (angle: string) => {
    const translations: Record<string, string> = {
      'wide': 'Geniş Açı',
      'close-up': 'Yakın Çekim',
      'aerial': 'Havadan',
      'eye-level': 'Göz Hizası',
      'high-angle': 'Yüksek Açı',
      'low-angle': 'Alçak Açı',
      'unknown': 'Bilinmiyor'
    };
    return translations[angle?.toLowerCase()] || angle || 'Bilinmiyor';
  };

  // localStorage'dan veriyi yükle
  useEffect(() => {
    try {
      const data = localStorage.getItem(params.id);
      if (data) {
        const parsedData = JSON.parse(data);
        setVideoData(parsedData);
        
        // Video blob URL'i sessionStorage'dan al
        if (parsedData.hasVideo) {
          const blobUrl = sessionStorage.getItem(`video-blob-${params.id}`);
          if (blobUrl) {
            setVideoBlobUrl(blobUrl);
          }
        }
        
        setStatus('ready');
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Error loading video data:', error);
      setStatus('error');
    }
  }, [params.id]);

  const handleSegmentClick = (start: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = start;
      videoRef.current.play();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Director AI analizi başlat
  const handleDirectorAnalysis = async (mode: DirectorMode) => {
    if (!videoData || !mode) return;

    setDirectorMode(mode);
    setIsAnalyzing(true);
    setDirectorAnalysis(null);

    try {
      const response = await fetch('/api/director', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcription: videoData.transcription,
          cinematic: videoData.cinematic, // 🆕 Cinematic analysis eklendi
          mode,
        }),
      });

      if (!response.ok) {
        throw new Error('Director AI analizi başarısız oldu');
      }

      const result = await response.json();
      setDirectorAnalysis(result.data);
    } catch (error) {
      console.error('Director AI error:', error);
      alert('Director AI analizi başarısız oldu. Lütfen tekrar deneyin.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Timestamp'i saniyeye çevir (00:00-00:03 -> 0)
  const parseTimestamp = (timestamp: string): number => {
    const match = timestamp.match(/(\d+):(\d+)-(\d+):(\d+)/);
    if (match) {
      const startMinutes = parseInt(match[1]);
      const startSeconds = parseInt(match[2]);
      return startMinutes * 60 + startSeconds;
    }
    return 0;
  };

  // Orijinal video sesini oynat
  const handlePlayOriginal = (timestamp: string) => {
    if (videoRef.current) {
      const startTime = parseTimestamp(timestamp);
      videoRef.current.currentTime = startTime;
      videoRef.current.play();
    }
  };

  // TTS - Metni seslendir
  const handleTextToSpeech = async (text: string, index: number) => {
    try {
      // Eğer aynı audio çalıyorsa durdur
      if (playingAudio === index && audioRef.current) {
        audioRef.current.pause();
        setPlayingAudio(null);
        return;
      }

      // Önceki audio'yu durdur
      if (audioRef.current) {
        audioRef.current.pause();
      }

      setAudioLoading(index);
      setPlayingAudio(null);

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          voice: 'alloy', // Türkçe için uygun ses
          speed: 1.0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('TTS API Error:', errorData);
        throw new Error(errorData.details || 'Seslendirme başarısız oldu');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setPlayingAudio(index);
        setAudioLoading(null);
      };

      audio.onended = () => {
        setPlayingAudio(null);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setPlayingAudio(null);
        setAudioLoading(null);
        alert('Ses çalma hatası');
      };

      await audio.play();
    } catch (error) {
      console.error('TTS error:', error);
      setAudioLoading(null);
      setPlayingAudio(null);
      alert('Seslendirme başarısız oldu. Lütfen tekrar deneyin.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
          >
            ← Dashboard'a Dön
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {videoData?.filename || 'Video Detay'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {videoData?.uploadedAt && new Date(videoData.uploadedAt).toLocaleString('tr-TR')}
          </p>
        </div>

        {/* Director Mode Buttons */}
        {status === 'ready' && (
          <div className="mb-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              🎬 Director Mode
            </h2>
            <p className="mb-4 opacity-90">
              AI yönetmen videoyu analiz edip profesyonel öneriler sunar
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleDirectorAnalysis('scene_director')}
                disabled={isAnalyzing}
                className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📹 Sahne Yönetmenliği
              </button>
              <button
                onClick={() => handleDirectorAnalysis('script_rewrite')}
                disabled={isAnalyzing}
                className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🎙 Script Rewrite
              </button>
              <button
                onClick={() => handleDirectorAnalysis('full_rewrite')}
                disabled={isAnalyzing}
                className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🪄 Full Rewrite
              </button>
            </div>
          </div>
        )}

        {/* Cinematic Analysis */}
        {videoData?.cinematic && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              🎥 Görsel Analiz
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Drone Detection */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg">
                <div className="text-3xl mb-2">{videoData.cinematic.camera_analysis?.drone_detected ? '🚁' : '📹'}</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {videoData.cinematic.camera_analysis?.drone_detected ? 'Drone Çekimi' : 'Normal Çekim'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {videoData.cinematic.camera_analysis?.drone_detected ? 'Havadan görüntü tespit edildi' : 'Yer seviyesi çekim'}
                </p>
              </div>

              {/* Camera */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg">
                <div className="text-3xl mb-2">🎥</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Kamera</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {translateCameraType(videoData.cinematic.camera_analysis?.type || '')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {translateMovement(videoData.cinematic.camera_analysis?.movement || '')}
                </p>
              </div>

              {/* Lighting */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-4 rounded-lg">
                <div className="text-3xl mb-2">💡</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Işık</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {translateLightingType(videoData.cinematic.lighting_analysis?.type || '')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {translateQuality(videoData.cinematic.lighting_analysis?.quality || '')}
                </p>
              </div>

              {/* Quality */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg">
                <div className="text-3xl mb-2">📊</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Kalite</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {translateQuality(videoData.cinematic.quality_analysis?.resolution_quality || '')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {translateQuality(videoData.cinematic.quality_analysis?.sharpness || '')}
                </p>
              </div>
            </div>

            {/* Detailed Info */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">📹 Kamera Detayları</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Açılar: {videoData.cinematic.camera_analysis?.angles?.map(a => translateAngle(a)).join(', ') || 'Belirtilmemiş'}</li>
                  <li>• Stabilizasyon: {videoData.cinematic.camera_analysis?.stability_score || 0}/100</li>
                </ul>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">🎨 Kompozisyon</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Kadraj: {translateFraming(videoData.cinematic.composition_analysis?.framing || '')}</li>
                  <li>• Arka Plan: {translateBackground(videoData.cinematic.composition_analysis?.background || '')}</li>
                  <li>• Üçte Bir Kuralı: {videoData.cinematic.composition_analysis?.rule_of_thirds ? 'Evet ✓' : 'Hayır'}</li>
                </ul>
              </div>
            </div>

            {/* Issues */}
            {videoData.cinematic.lighting_analysis?.issues && videoData.cinematic.lighting_analysis.issues.length > 0 && (
              <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-400 mb-2">⚠️ Işık Sorunları</h4>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  {videoData.cinematic.lighting_analysis.issues.map((issue, i) => (
                    <li key={i}>• {issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Analyzing State */}
        {isAnalyzing && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              🎬 AI Yönetmen Analiz Ediyor...
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Video izleniyor, sahneler analiz ediliyor, öneriler hazırlanıyor...
            </p>
          </div>
        )}

        {/* Director Analysis Results */}
        {directorAnalysis && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                🎬 Director Notes
              </h2>
              <button
                onClick={() => {
                  // PDF export fonksiyonu - Görsel Analiz + Director Notes
                  const printWindow = window.open('', '', 'height=800,width=800');
                  if (printWindow) {
                    printWindow.document.write('<html><head><title>Video Analiz Raporu - ' + videoData?.filename + '</title>');
                    printWindow.document.write('<meta charset="UTF-8">');
                    printWindow.document.write('<style>');
                    printWindow.document.write('body{font-family:Arial,sans-serif;padding:20px;line-height:1.6;color:#333;}');
                    printWindow.document.write('h1{color:#7c3aed;border-bottom:3px solid #7c3aed;padding-bottom:10px;}');
                    printWindow.document.write('h2{color:#ec4899;margin-top:30px;border-bottom:2px solid #ec4899;padding-bottom:8px;}');
                    printWindow.document.write('h3{color:#7c3aed;margin-top:20px;}');
                    printWindow.document.write('.info-box{background:#f3f4f6;padding:15px;border-radius:8px;margin:15px 0;}');
                    printWindow.document.write('.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:15px;margin:15px 0;}');
                    printWindow.document.write('.card{background:#f9fafb;border:1px solid #e5e7eb;padding:15px;border-radius:8px;}');
                    printWindow.document.write('.card h4{margin:0 0 10px 0;color:#374151;font-size:16px;}');
                    printWindow.document.write('.card p{margin:5px 0;font-size:14px;}');
                    printWindow.document.write('.note{border-left:4px solid #7c3aed;padding-left:16px;margin:16px 0;background:#f9fafb;padding:15px;border-radius:0 8px 8px 0;}');
                    printWindow.document.write('.timestamp{color:#7c3aed;font-family:monospace;font-weight:bold;font-size:14px;}');
                    printWindow.document.write('.label{font-weight:bold;color:#374151;margin-top:10px;}');
                    printWindow.document.write('.warning{background:#fef3c7;border:1px solid #fbbf24;padding:15px;border-radius:8px;margin:15px 0;}');
                    printWindow.document.write('ul{margin:10px 0;padding-left:20px;}');
                    printWindow.document.write('li{margin:5px 0;}');
                    printWindow.document.write('</style>');
                    printWindow.document.write('</head><body>');
                    
                    // Header
                    printWindow.document.write('<h1>🎬 Video Analiz Raporu</h1>');
                    printWindow.document.write('<div class="info-box">');
                    printWindow.document.write('<p><strong>Video:</strong> ' + (videoData?.filename || 'Bilinmiyor') + '</p>');
                    printWindow.document.write('<p><strong>Tarih:</strong> ' + new Date().toLocaleString('tr-TR') + '</p>');
                    printWindow.document.write('</div>');
                    
                    // Görsel Analiz
                    if (videoData?.cinematic) {
                      printWindow.document.write('<h2>🎥 Görsel Analiz</h2>');
                      printWindow.document.write('<div class="grid">');
                      
                      // Drone Detection
                      printWindow.document.write('<div class="card">');
                      printWindow.document.write('<h4>' + (videoData.cinematic.camera_analysis?.drone_detected ? '🚁 Drone Çekimi' : '📹 Normal Çekim') + '</h4>');
                      printWindow.document.write('<p>' + (videoData.cinematic.camera_analysis?.drone_detected ? 'Havadan görüntü tespit edildi' : 'Yer seviyesi çekim') + '</p>');
                      printWindow.document.write('</div>');
                      
                      // Camera
                      printWindow.document.write('<div class="card">');
                      printWindow.document.write('<h4>🎥 Kamera</h4>');
                      printWindow.document.write('<p><strong>Tip:</strong> ' + translateCameraType(videoData.cinematic.camera_analysis?.type || '') + '</p>');
                      printWindow.document.write('<p><strong>Hareket:</strong> ' + translateMovement(videoData.cinematic.camera_analysis?.movement || '') + '</p>');
                      printWindow.document.write('</div>');
                      
                      // Lighting
                      printWindow.document.write('<div class="card">');
                      printWindow.document.write('<h4>💡 Işık</h4>');
                      printWindow.document.write('<p><strong>Tip:</strong> ' + translateLightingType(videoData.cinematic.lighting_analysis?.type || '') + '</p>');
                      printWindow.document.write('<p><strong>Kalite:</strong> ' + translateQuality(videoData.cinematic.lighting_analysis?.quality || '') + '</p>');
                      printWindow.document.write('</div>');
                      
                      // Quality
                      printWindow.document.write('<div class="card">');
                      printWindow.document.write('<h4>📊 Kalite</h4>');
                      printWindow.document.write('<p><strong>Çözünürlük:</strong> ' + translateQuality(videoData.cinematic.quality_analysis?.resolution_quality || '') + '</p>');
                      printWindow.document.write('<p><strong>Netlik:</strong> ' + translateQuality(videoData.cinematic.quality_analysis?.sharpness || '') + '</p>');
                      printWindow.document.write('</div>');
                      
                      printWindow.document.write('</div>');
                      
                      // Detailed Info
                      printWindow.document.write('<h3>📹 Kamera Detayları</h3>');
                      printWindow.document.write('<ul>');
                      printWindow.document.write('<li><strong>Açılar:</strong> ' + (videoData.cinematic.camera_analysis?.angles?.map(a => translateAngle(a)).join(', ') || 'Belirtilmemiş') + '</li>');
                      printWindow.document.write('<li><strong>Stabilizasyon:</strong> ' + (videoData.cinematic.camera_analysis?.stability_score || 0) + '/100</li>');
                      printWindow.document.write('</ul>');
                      
                      printWindow.document.write('<h3>🎨 Kompozisyon</h3>');
                      printWindow.document.write('<ul>');
                      printWindow.document.write('<li><strong>Kadraj:</strong> ' + translateFraming(videoData.cinematic.composition_analysis?.framing || '') + '</li>');
                      printWindow.document.write('<li><strong>Arka Plan:</strong> ' + translateBackground(videoData.cinematic.composition_analysis?.background || '') + '</li>');
                      printWindow.document.write('<li><strong>Üçte Bir Kuralı:</strong> ' + (videoData.cinematic.composition_analysis?.rule_of_thirds ? 'Evet ✓' : 'Hayır') + '</li>');
                      printWindow.document.write('</ul>');
                      
                      // Issues
                      if (videoData.cinematic.lighting_analysis?.issues && videoData.cinematic.lighting_analysis.issues.length > 0) {
                        printWindow.document.write('<div class="warning">');
                        printWindow.document.write('<h4>⚠️ Işık Sorunları</h4>');
                        printWindow.document.write('<ul>');
                        videoData.cinematic.lighting_analysis.issues.forEach((issue: string) => {
                          printWindow.document.write('<li>' + issue + '</li>');
                        });
                        printWindow.document.write('</ul>');
                        printWindow.document.write('</div>');
                      }
                    }
                    
                    // Director Notes
                    const directorContent = document.getElementById('director-analysis-content');
                    if (directorContent) {
                      printWindow.document.write('<h2>🎬 Director Notes</h2>');
                      printWindow.document.write(directorContent.innerHTML);
                    }
                    
                    printWindow.document.write('</body></html>');
                    printWindow.document.close();
                    printWindow.print();
                  }
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                📄 PDF İndir
              </button>
            </div>
            <div id="director-analysis-content">

            {/* Scene Director */}
            {directorMode === 'scene_director' && directorAnalysis.director_notes && (
              <div className="space-y-4">
                {directorAnalysis.director_notes.map((note: DirectorNote, index: number) => (
                  <div key={index} className="border-l-4 border-purple-500 pl-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-r-lg">
                    <div className="font-mono text-sm text-purple-600 dark:text-purple-400 mb-2">
                      {note.timestamp}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">📹 Görsel:</span>
                        <p className="text-gray-600 dark:text-gray-400 ml-6">{note.visual}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">🎵 Ses:</span>
                        <p className="text-gray-600 dark:text-gray-400 ml-6">{note.audio}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">💬 Konuşma:</span>
                        <p className="text-gray-600 dark:text-gray-400 ml-6">{note.speech}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">💡 Neden:</span>
                        <p className="text-gray-600 dark:text-gray-400 ml-6 italic">{note.reasoning}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Script Rewrite */}
            {directorMode === 'script_rewrite' && (
              <div className="space-y-6">
                {/* Analysis */}
                {directorAnalysis.script_analysis && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                      <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2">❌ Sorunlar</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-red-600 dark:text-red-300">
                        {directorAnalysis.script_analysis.problems.map((problem: string, i: number) => (
                          <li key={i}>{problem}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <h3 className="font-semibold text-green-700 dark:text-green-400 mb-2">✅ Fırsatlar</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-green-600 dark:text-green-300">
                        {directorAnalysis.script_analysis.opportunities.map((opp: string, i: number) => (
                          <li key={i}>{opp}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Rewritten Script */}
                {directorAnalysis.rewritten_script && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Yeniden Yazılmış Script:</h3>
                    {directorAnalysis.rewritten_script.map((item: ScriptRewrite, index: number) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="font-mono text-xs text-purple-600 dark:text-purple-400 mb-2">
                          {item.timestamp}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Orijinal:</div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 line-through mb-2">{item.original}</p>
                            <button
                              onClick={() => handlePlayOriginal(item.timestamp)}
                              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-lg font-semibold transition-colors flex items-center gap-1"
                            >
                              ▶️ Orijinal Sesi Dinle
                            </button>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Yeni:</div>
                            <p className="text-sm text-gray-900 dark:text-white font-medium mb-2">{item.rewritten}</p>
                            <button
                              onClick={() => handleTextToSpeech(item.rewritten, index)}
                              disabled={audioLoading === index}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              {audioLoading === index ? (
                                <>⏳ Yükleniyor...</>
                              ) : playingAudio === index ? (
                                <>⏸️ Durdur</>
                              ) : (
                                <>🔊 Seslendir</>
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 space-y-1">
                          <div className="text-xs text-green-600 dark:text-green-400">
                            💡 {item.improvement}
                          </div>
                          {item.emotion && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                              🎭 Ton: <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 rounded">{item.emotion}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Full Rewrite */}
            {directorMode === 'full_rewrite' && directorAnalysis.rewritten_script && (
              <div className="space-y-3">
                {directorAnalysis.rewritten_script.map((item: ScriptRewrite, index: number) => (
                  <div key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg">
                    <div className="font-mono text-xs text-purple-600 dark:text-purple-400 mb-2">
                      {item.timestamp}
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium mb-2">{item.rewritten}</p>
                    <button
                      onClick={() => handleTextToSpeech(item.rewritten, index)}
                      disabled={audioLoading === index}
                      className="mb-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {audioLoading === index ? (
                        <>⏳ Yükleniyor...</>
                      ) : playingAudio === index ? (
                        <>⏸️ Durdur</>
                      ) : (
                        <>🔊 Seslendir</>
                      )}
                    </button>
                    <div className="space-y-1">
                      <div className="text-xs text-purple-600 dark:text-purple-400">
                        💡 {item.improvement}
                      </div>
                      {item.emotion && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          🎭 Ton: <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 rounded">{item.emotion}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div> {/* Close director-analysis-content */}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol: Video Player */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              {/* Video Player */}
              <div className="bg-black aspect-video flex items-center justify-center">
                {videoBlobUrl ? (
                  <video
                    ref={videoRef}
                    controls
                    className="w-full h-full"
                    src={videoBlobUrl}
                  >
                    Tarayıcınız video etiketini desteklemiyor.
                  </video>
                ) : (
                  <div className="text-center text-white p-8">
                    <div className="text-6xl mb-4">🎬</div>
                    <p className="text-xl mb-2">Video Oynatılamıyor</p>
                    <p className="text-sm text-gray-400">
                      Video dosyası bulunamadı. Lütfen videoyu yeniden yükleyin.
                    </p>
                  </div>
                )}
              </div>

              {/* Video Info */}
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {videoData?.filename || 'Video'}
                </h2>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>Dil: {videoData?.transcription.language.toUpperCase()}</span>
                  <span>•</span>
                  <span>Segment: {videoData?.transcription.segments.length}</span>
                  <span>•</span>
                  <span className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs font-medium">
                      Hazır
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sağ: Transkript */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Transkript
              </h2>

              {status === 'loading' ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : status === 'error' ? (
                <div className="text-center py-8">
                  <p className="text-red-600 dark:text-red-400">Video bulunamadı</p>
                </div>
              ) : videoData ? (
                <div>
                  {/* Dil Bilgisi */}
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Dil: <span className="font-medium text-gray-900 dark:text-white">{videoData.transcription.language.toUpperCase()}</span>
                    </p>
                  </div>

                  {/* Tam Metin */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Tam Metin
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {videoData.transcription.text}
                    </p>
                  </div>

                  {/* Segmentler */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Zaman Damgalı Segmentler ({videoData.transcription.segments.length})
                    </h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {videoData.transcription.segments.map((segment) => (
                        <button
                          key={segment.id}
                          onClick={() => handleSegmentClick(segment.start)}
                          className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors group"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-xs font-mono text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0">
                              {formatTime(segment.start)}
                            </span>
                            <p className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                              {segment.text}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
