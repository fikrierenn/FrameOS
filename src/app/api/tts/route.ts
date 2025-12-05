import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import https from 'https';

// SSL bypass - ONLY for development
const httpsAgent = process.env.NODE_ENV === 'development' 
  ? new https.Agent({ rejectUnauthorized: false })
  : undefined;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  ...(httpsAgent && { httpAgent: httpsAgent }),
});

export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'alloy', speed = 1.0 } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    console.log('🎙️ TTS Request:', { textLength: text.length, voice, speed });

    // OpenAI TTS API çağrısı
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
      input: text,
      speed: speed,
    });

    // Audio buffer'ı al
    const buffer = Buffer.from(await mp3.arrayBuffer());

    console.log('✅ TTS Success:', { audioSize: buffer.length });

    // Audio dosyasını döndür
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('❌ TTS Error:', {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type,
      stack: error.stack,
    });
    
    return NextResponse.json(
      { 
        error: 'TTS generation failed', 
        details: error.message,
        status: error.status,
        code: error.code,
        type: error.type,
      },
      { status: 500 }
    );
  }
}
