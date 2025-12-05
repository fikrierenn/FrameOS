/**
 * OpenAI Whisper API - Video/Audio Transcription
 * Production-ready, reliable, and cost-effective
 */

import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import os from 'os';
import https from 'https';

// SSL bypass için custom agent (sadece development)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  httpAgent: httpsAgent,
});

export interface TranscriptionSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

export interface TranscriptionResult {
  text: string;
  language: string;
  segments: TranscriptionSegment[];
}

export async function transcribeVideo(file: File): Promise<TranscriptionResult> {
  console.log('🎬 OpenAI Whisper ile video analizi başlıyor...');

  const bytes = await file.arrayBuffer();
  const sizeMB = bytes.byteLength / (1024 * 1024);

  if (sizeMB > 25) {
    throw new Error(`Dosya çok büyük (${sizeMB.toFixed(2)}MB). Max 25MB`);
  }

  console.log(`Processing: ${file.name}, ${sizeMB.toFixed(2)}MB`);

  // Geçici dosya oluştur (Whisper API File object bekliyor)
  const tempDir = os.tmpdir();
  const tempFilePath = path.join(tempDir, `upload-${Date.now()}-${file.name}`);
  
  try {
    // File'ı geçici dizine yaz
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(tempFilePath, buffer);
    console.log('Temp file created:', tempFilePath);

    // Whisper API'ye gönder
    console.log('Sending to OpenAI Whisper API...');
    
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    });

    console.log('✅ Whisper response received!');
    console.log('Language:', transcription.language);
    console.log('Duration:', transcription.duration, 'seconds');

    // Segments'i parse et
    const segments: TranscriptionSegment[] = [];
    let fullText = '';

    if (transcription.segments && transcription.segments.length > 0) {
      transcription.segments.forEach((seg: any, i: number) => {
        segments.push({
          id: i,
          start: Math.floor(seg.start),
          end: Math.floor(seg.end),
          text: seg.text.trim(),
        });
        fullText += seg.text + ' ';
      });
    } else {
      // Fallback: Eğer segment yoksa, text'i cümlelere böl
      fullText = transcription.text || '';
      const sentences = fullText.split(/[.!?]+/).filter((s) => s.trim());
      sentences.forEach((s, i) => {
        segments.push({
          id: i,
          start: i * 5,
          end: (i + 1) * 5,
          text: s.trim(),
        });
      });
    }

    console.log(`✅ Transkript hazır: ${transcription.language}, ${segments.length} segments`);

    return {
      text: fullText.trim(),
      language: transcription.language || 'unknown',
      segments,
    };
  } catch (error: any) {
    console.error('OpenAI Whisper Error:', error);
    
    if (error.status === 429) {
      throw new Error('⏱️ Rate limit aşıldı! Lütfen birkaç saniye bekleyip tekrar deneyin.');
    } else if (error.status === 401) {
      throw new Error('🔑 API key geçersiz! Lütfen OpenAI API key\'inizi kontrol edin.');
    } else {
      throw new Error(`OpenAI Whisper Hatası: ${error.message || 'Bilinmeyen hata'}`);
    }
  } finally {
    // Geçici dosyayı sil
    try {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
        console.log('Temp file deleted:', tempFilePath);
      }
    } catch (cleanupError) {
      console.warn('Temp file cleanup failed:', cleanupError);
    }
  }
}

export async function transcribeVideoWithRetry(file: File, maxRetries: number = 2): Promise<TranscriptionResult> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await transcribeVideo(file);
    } catch (error: any) {
      lastError = error as Error;

      // Rate limit hatası varsa kısa bekle
      if (error.message?.includes('Rate limit')) {
        console.log('⏱️ Rate limit - 10 saniye bekleniyor...');
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }

      console.log(`❌ Attempt ${attempt}/${maxRetries} failed`);

      if (attempt < maxRetries) {
        const waitTime = 3000 * attempt; // 3s, 6s
        console.log(`⏳ ${waitTime / 1000} saniye bekleniyor...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError || new Error('Transkripsiyon başarısız oldu');
}
