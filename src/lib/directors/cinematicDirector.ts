/**
 * Cinematic Director - Görsel Analiz Modülü
 * Kamera, ışık, kompozisyon, drone çekimi analizi
 */

import OpenAI from 'openai';
import https from 'https';
import fs from 'fs';
import { logger } from '@/lib/logger';
import { calculateCost, formatCost } from '@/lib/utils/costTracking';

// SSL bypass - ONLY for development
const httpsAgent = process.env.NODE_ENV === 'development' 
  ? new https.Agent({ rejectUnauthorized: false })
  : undefined;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  ...(httpsAgent && { httpAgent: httpsAgent }),
});

export interface CinematicAnalysis {
  overall_score: number; // 0-100
  camera_analysis: CameraAnalysis;
  lighting_analysis: LightingAnalysis;
  composition_analysis: CompositionAnalysis;
  quality_analysis: QualityAnalysis;
  recommendations: string[];
}

export interface CameraAnalysis {
  type: 'handheld' | 'tripod' | 'gimbal' | 'drone' | 'static' | 'unknown';
  movement: 'smooth' | 'shaky' | 'static' | 'dynamic';
  angles: string[]; // 'wide', 'close-up', 'aerial', 'eye-level', etc.
  stability_score: number; // 0-100
  drone_detected: boolean;
  recommendations: string[];
}

export interface LightingAnalysis {
  type: 'natural' | 'artificial' | 'mixed';
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  brightness_score: number; // 0-100
  issues: string[]; // 'too dark', 'overexposed', 'harsh shadows', etc.
  recommendations: string[];
}

export interface CompositionAnalysis {
  framing: 'excellent' | 'good' | 'fair' | 'poor';
  background: 'clean' | 'cluttered' | 'distracting' | 'appropriate';
  rule_of_thirds: boolean;
  subject_positioning: 'centered' | 'off-center' | 'optimal' | 'poor';
  recommendations: string[];
}

export interface QualityAnalysis {
  resolution_quality: 'excellent' | 'good' | 'fair' | 'poor';
  color_balance: 'excellent' | 'good' | 'fair' | 'poor';
  sharpness: 'excellent' | 'good' | 'fair' | 'poor';
  overall_quality: number; // 0-100
  issues: string[];
}

/**
 * Analyze video frames with GPT-4 Vision
 */
export async function analyzeCinematic(
  framePaths: string[],
  transcription?: any
): Promise<CinematicAnalysis> {
  const startTime = performance.now();
  const log = logger.child({
    function: 'analyzeCinematic',
    frameCount: framePaths.length,
    model: 'gpt-4o',
  });

  log.info('Starting cinematic analysis', {
    frameCount: framePaths.length,
    hasTranscription: !!transcription,
  });

  // Sample frames (max 5 for cost optimization)
  console.log('📊 [2/6] Frame sampling başlıyor...');
  const sampleFrames = sampleFramesEvenly(framePaths, 5);
  console.log(`✅ ${sampleFrames.length} frame seçildi (${framePaths.length} frame'den)`);
  
  // Convert frames to base64
  console.log('🔄 [3/6] Frameler base64e çevriliyor...');
  const frameImages = sampleFrames.map((framePath, index) => {
    console.log(`  📸 Processing frame ${index + 1}/${sampleFrames.length}: ${framePath}`);
    const imageBuffer = fs.readFileSync(framePath);
    const base64Image = imageBuffer.toString('base64');
    console.log(`  ✅ Frame ${index + 1} encoded: ${(base64Image.length / 1024).toFixed(2)} KB`);
    return `data:image/jpeg;base64,${base64Image}`;
  });
  console.log(`✅ Tüm frameler encode edildi. Toplam: ${(frameImages.join('').length / 1024 / 1024).toFixed(2)} MB`);

  const prompt = `Sen bir PROFESYONEL SİNEMATOGRAFİ ve KAMERA YÖNETMENİSİN. Video frame'lerini analiz edip detaylı görsel analiz raporu veriyorsun.

${transcription ? `VIDEO KONUSU (Transkriptten): ${transcription.text.substring(0, 200)}...` : ''}

GÖREV:
Bu video frame'lerini analiz et ve şunları belirle:

1. 🎥 KAMERA ANALİZİ:
   - Kamera tipi: Handheld mi? Tripod mu? Gimbal mi? DRONE mu? Static mi?
   - Hareket kalitesi: Smooth mu? Shaky mi? Static mi?
   - Kamera açıları: Wide angle? Close-up? Aerial (havadan)? Eye-level?
   - Stabilizasyon skoru (0-100)
   - **DRONE TESPİTİ**: Havadan çekim var mı? (Yüksekten, kuş bakışı, geniş alan görünümü)

2. 💡 IŞIK ANALİZİ:
   - Işık tipi: Doğal mı? Yapay mı? Karışık mı?
   - Işık kalitesi: Excellent? Good? Fair? Poor?
   - Parlaklık skoru (0-100)
   - Sorunlar: Çok karanlık? Overexposed? Sert gölgeler?

3. 🎨 KOMPOZİSYON ANALİZİ:
   - Framing kalitesi: Excellent? Good? Fair? Poor?
   - Arka plan: Temiz mi? Karışık mı? Dikkat dağıtıcı mı?
   - Rule of thirds uygulanmış mı?
   - Subject positioning: Merkez mi? Off-center mi? Optimal mi?

4. 📊 KALİTE ANALİZİ:
   - Çözünürlük kalitesi: Excellent? Good? Fair? Poor?
   - Renk dengesi: Excellent? Good? Fair? Poor?
   - Netlik (sharpness): Excellent? Good? Fair? Poor?
   - Genel kalite skoru (0-100)

5. 💡 ÖNERİLER:
   - Kamera için öneriler (açı, hareket, stabilizasyon)
   - Işık için öneriler (brightness, soft box, doğal ışık)
   - Kompozisyon için öneriler (framing, background, positioning)
   - Kalite için öneriler (resolution, color grading, sharpness)

ÖNEMLİ:
- DRONE çekimi varsa mutlaka belirt! (Havadan, yüksekten, geniş alan görünümü)
- Her analiz için SKOR ver (0-100)
- Öneriler UYGULANAB İLİR olmalı
- SATIŞ ve SOSYAL MEDYA optimizasyonu düşün

FORMAT (JSON):
{
  "overall_score": 75,
  "camera_analysis": {
    "type": "drone" | "handheld" | "tripod" | "gimbal" | "static",
    "movement": "smooth" | "shaky" | "static",
    "angles": ["aerial", "wide", "eye-level"],
    "stability_score": 85,
    "drone_detected": true,
    "recommendations": [
      "Drone çekimi mükemmel, daha fazla aerial shot ekle",
      "Kamera hareketleri smooth, devam et"
    ]
  },
  "lighting_analysis": {
    "type": "natural" | "artificial" | "mixed",
    "quality": "excellent" | "good" | "fair" | "poor",
    "brightness_score": 80,
    "issues": ["Bazı sahnelerde gölge var"],
    "recommendations": ["Öğlen saatlerinde çek", "Soft box ekle"]
  },
  "composition_analysis": {
    "framing": "excellent" | "good" | "fair" | "poor",
    "background": "clean" | "cluttered" | "distracting",
    "rule_of_thirds": true,
    "subject_positioning": "optimal",
    "recommendations": ["Arka planı daha minimalist yap"]
  },
  "quality_analysis": {
    "resolution_quality": "excellent" | "good" | "fair" | "poor",
    "color_balance": "good",
    "sharpness": "excellent",
    "overall_quality": 85,
    "issues": ["Hafif renk düzeltmesi gerekebilir"]
  },
  "recommendations": [
    "Drone çekimlerini artır - tarla satışı için mükemmel",
    "Işığı öğlen saatlerinde çek",
    "Arka planı daha temiz tut"
  ]
}

Sadece JSON döndür.`;

  try {
    log.info('Calling GPT-4o Vision API', {
      promptLength: prompt.length,
      frameCount: frameImages.length,
    });
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // GPT-4 Omni - vision capabilities included
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            ...frameImages.map((img) => ({
              type: 'image_url' as const,
              image_url: { url: img },
            })),
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const duration = performance.now() - startTime;
    const tokens = response.usage?.total_tokens || 0;
    const cost = calculateCost('gpt-4o', tokens);

    log.info('GPT-4o Vision response received', {
      duration: `${duration.toFixed(2)}ms`,
      tokens,
      cost: formatCost(cost.estimatedCost),
      finishReason: response.choices[0]?.finish_reason,
      responseId: response.id,
    });
    
    const rawContent = response.choices[0]?.message?.content;
    log.debug('Parsing response', {
      rawLength: rawContent?.length || 0,
      preview: rawContent?.substring(0, 200),
    });
    
    // Clean markdown code blocks (```json ... ```)
    let cleanedContent = rawContent || '{}';
    if (cleanedContent.includes('```')) {
      log.debug('Cleaning markdown code blocks');
      cleanedContent = cleanedContent
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
    }
    
    let result: CinematicAnalysis;
    try {
      result = JSON.parse(cleanedContent);
      log.debug('JSON parsing successful', {
        keys: Object.keys(result).join(', '),
      });
    } catch (parseError: any) {
      log.error('JSON parsing failed', parseError, {
        rawContent: cleanedContent.substring(0, 500),
      });
      throw new Error(`JSON parsing failed: ${parseError.message}`);
    }
    
    log.info('Cinematic analysis completed', {
      overallScore: result.overall_score,
      cameraType: result.camera_analysis?.type,
      droneDetected: result.camera_analysis?.drone_detected,
      lightingQuality: result.lighting_analysis?.quality,
    });

    return result;
  } catch (error: any) {
    const duration = performance.now() - startTime;
    
    log.error('Cinematic analysis failed', error, {
      duration: `${duration.toFixed(2)}ms`,
      errorType: error?.constructor?.name,
      errorCode: error?.code,
      errorStatus: error?.status,
      frameCount: framePaths.length,
      sampledFrames: sampleFrames.length,
    });
    
    // Throw user-friendly error
    const errorMessage = error?.message || 'Unknown error';
    const errorCode = error?.code || error?.status || 'UNKNOWN';
    throw new Error(`Görsel analiz başarısız oldu [${errorCode}]: ${errorMessage}`);
  }
}

/**
 * Sample frames evenly from the list
 */
function sampleFramesEvenly(frames: string[], count: number): string[] {
  if (frames.length <= count) return frames;
  
  const step = Math.floor(frames.length / count);
  const sampled: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const index = Math.min(i * step, frames.length - 1);
    sampled.push(frames[index]);
  }
  
  return sampled;
}
