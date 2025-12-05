/**
 * Full Video Analysis API Endpoint
 * 
 * POST /api/analyze-full
 * - Video dosyasını alır
 * - Audio transcription (Whisper)
 * - Frame extraction (FFmpeg)
 * - Cinematic analysis (GPT-4 Vision)
 * - Sonuçları döner
 */

import { NextRequest, NextResponse } from 'next/server';
import { transcribeVideoWithRetry } from '@/lib/openai';
import { videoPreprocessor } from '@/lib/videoPreprocessor';
import { analyzeCinematic } from '@/lib/directors/cinematicDirector';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function POST(request: NextRequest) {
  let tempVideoPath: string | null = null;
  let audioPath: string | null = null;
  let framesDir: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Dosya bulunamadı' },
        { status: 400 }
      );
    }

    // Dosya boyutu kontrolü (100MB)
    const MAX_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Dosya çok büyük. Maksimum 100MB olmalıdır' },
        { status: 400 }
      );
    }

    // Video formatı kontrolü
    if (!file.type.startsWith('video/')) {
      return NextResponse.json(
        { error: 'Geçersiz dosya formatı. Video dosyası gerekli' },
        { status: 400 }
      );
    }

    console.log(`🎬 Full analysis starting: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    // Save video temporarily
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    tempVideoPath = path.join(os.tmpdir(), `video-${Date.now()}-${file.name}`);
    fs.writeFileSync(tempVideoPath, buffer);
    console.log('📁 Video saved temporarily:', tempVideoPath);

    // Step 1: Audio Transcription
    console.log('🎵 Step 1/3: Audio transcription...');
    const transcription = await transcribeVideoWithRetry(file);
    console.log(`✅ Transcription done: ${transcription.language}, ${transcription.segments.length} segments`);

    // Step 2: Frame Extraction
    console.log('🎞️ Step 2/3: Frame extraction...');
    const frames = await videoPreprocessor.extractFrames(tempVideoPath, 0.5); // 1 frame every 2 seconds
    console.log(`✅ Frames extracted: ${frames.length} frames`);
    
    if (frames.length > 0) {
      framesDir = path.dirname(frames[0].path);
    }

    // Step 3: Cinematic Analysis
    console.log('🎥 Step 3/3: Cinematic analysis...');
    const cinematicAnalysis = await analyzeCinematic(
      frames.map(f => f.path),
      transcription
    );
    console.log(`✅ Cinematic analysis done: ${cinematicAnalysis.overall_score}/100`);

    console.log('✅ Full analysis completed successfully!');

    return NextResponse.json({
      success: true,
      data: {
        transcription,
        cinematic: cinematicAnalysis,
      },
    });
  } catch (error) {
    console.error('❌ Full analysis error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Analiz başarısız oldu',
      },
      { status: 500 }
    );
  } finally {
    // Cleanup - ALWAYS runs (success or error)
    console.log('🗑️ Cleaning up temporary files...');
    try {
      if (tempVideoPath && fs.existsSync(tempVideoPath)) {
        fs.unlinkSync(tempVideoPath);
        console.log('✅ Deleted:', tempVideoPath);
      }
      if (audioPath && fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
        console.log('✅ Deleted:', audioPath);
      }
      if (framesDir && fs.existsSync(framesDir)) {
        fs.rmSync(framesDir, { recursive: true, force: true });
        console.log('✅ Deleted:', framesDir);
      }
    } catch (cleanupError) {
      console.warn('⚠️ Cleanup error:', cleanupError);
    }
  }
}

// Timeout'u artır (video işleme uzun sürebilir)
export const maxDuration = 300; // 5 dakika
