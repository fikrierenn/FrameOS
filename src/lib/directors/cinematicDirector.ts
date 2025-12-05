/**
 * Cinematic Director - Görsel Analiz Modülü
 * Kamera, ışık, kompozisyon, drone çekimi analizi
 */

import OpenAI from 'openai';
import https from 'https';
import fs from 'fs';

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
  console.log('🎥 [1/6] Cinematic Director: Görsel analiz başlıyor...');
  console.log(`📸 ${framePaths.length} frame analiz edilecek`);
  console.log(`🎬 Model: gpt-4o`);
  console.log(`🔧 SSL Bypass: Enabled`);

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
    console.log('🚀 [4/6] GPT-4o Vision API çağrılıyor...');
    console.log(`📝 Prompt length: ${prompt.length} characters`);
    console.log(`🖼️ Frame count: ${frameImages.length}`);
    
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

    console.log('✅ [5/6] GPT-4o response alındı!');
    console.log(`📊 Response status: ${response.choices[0]?.finish_reason}`);
    console.log(`🔢 Response ID: ${response.id}`);
    console.log(`⏱️ Model: ${response.model}`);
    
    const rawContent = response.choices[0]?.message?.content;
    console.log(`📄 Raw response length: ${rawContent?.length || 0} characters`);
    console.log(`📝 Raw response preview: ${rawContent?.substring(0, 200)}...`);

    console.log('🔍 [6/6] JSON parsing başlıyor...');
    
    // Clean markdown code blocks (```json ... ```)
    let cleanedContent = rawContent || '{}';
    if (cleanedContent.includes('```')) {
      console.log('🧹 Markdown code block tespit edildi, temizleniyor...');
      cleanedContent = cleanedContent
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      console.log(`✅ Temizlendi. Yeni uzunluk: ${cleanedContent.length} characters`);
    }
    
    let result;
    try {
      result = JSON.parse(cleanedContent);
      console.log('✅ JSON parsing başarılı!');
      console.log(`🎯 Parsed keys: ${Object.keys(result).join(', ')}`);
    } catch (parseError: any) {
      console.error('❌ JSON parsing FAILED!');
      console.error('📝 Parse Error:', parseError.message);
      console.error('📄 Attempted to parse:', cleanedContent.substring(0, 500));
      throw new Error(`JSON parsing failed: ${parseError.message}`);
    }
    
    console.log('✅ Cinematic analysis complete');
    console.log(`🎥 Camera type: ${result.camera_analysis?.type}`);
    console.log(`🚁 Drone detected: ${result.camera_analysis?.drone_detected}`);
    console.log(`💡 Lighting: ${result.lighting_analysis?.quality}`);
    console.log(`📊 Overall score: ${result.overall_score}/100`);

    return result;
  } catch (error: any) {
    console.error('❌ ============================================');
    console.error('❌ CINEMATIC ANALYSIS ERROR - DETAILED DEBUG');
    console.error('❌ ============================================');
    console.error('🔍 Error Type:', error?.constructor?.name || 'Unknown');
    console.error('📝 Error Message:', error?.message || 'No message');
    
    // OpenAI API specific errors
    if (error?.status) {
      console.error('🌐 HTTP Status:', error.status);
    }
    if (error?.code) {
      console.error('🔑 Error Code:', error.code);
    }
    if (error?.type) {
      console.error('🏷️ Error Type:', error.type);
    }
    if (error?.error) {
      console.error('🚨 API Error Details:', JSON.stringify(error.error, null, 2));
    }
    
    // Stack trace (first 3 lines)
    if (error?.stack) {
      const stackLines = error.stack.split('\n').slice(0, 3);
      console.error('📚 Stack Trace (top 3):');
      stackLines.forEach((line: string) => console.error('  ', line));
    }
    
    // Additional context
    console.error('📊 Context:');
    console.error('  - Frame count:', framePaths.length);
    console.error('  - Sampled frames:', sampleFrames.length);
    console.error('  - Model: gpt-4o');
    console.error('  - SSL Bypass: Enabled');
    
    console.error('❌ ============================================');
    
    // Throw user-friendly error with details
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
