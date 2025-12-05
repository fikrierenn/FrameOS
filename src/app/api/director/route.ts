/**
 * Director AI API Endpoint
 * POST /api/director
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithDirectorAI } from '@/lib/directorAI';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcription, cinematic, mode } = body;

    if (!transcription) {
      return NextResponse.json(
        { error: 'Transkript bulunamadı' },
        { status: 400 }
      );
    }

    if (!mode || !['scene_director', 'script_rewrite', 'full_rewrite'].includes(mode)) {
      return NextResponse.json(
        { error: 'Geçersiz mode. Seçenekler: scene_director, script_rewrite, full_rewrite' },
        { status: 400 }
      );
    }

    console.log(`🎬 Director AI request: ${mode}`);
    if (cinematic) {
      console.log(`🎥 Cinematic analysis available: Drone=${cinematic.hasDrone}`);
    }

    // Director AI analizi (cinematic data ile)
    const analysis = await analyzeWithDirectorAI(transcription, mode, cinematic);

    console.log(`✅ Director AI completed: ${mode}`);

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Director AI API error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Director AI analizi başarısız oldu',
      },
      { status: 500 }
    );
  }
}

// Timeout'u artır (AI analizi uzun sürebilir)
export const maxDuration = 300; // 5 dakika
