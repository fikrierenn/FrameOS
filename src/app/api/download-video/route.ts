import { NextRequest, NextResponse } from 'next/server';
import ytdl from 'yt-dlp-exec';
import path from 'path';
import fs from 'fs';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'Video URL gerekli' },
        { status: 400 }
      );
    }

    console.log('📥 Video indiriliyor:', url);

    // Temp directory oluştur
    const tempDir = path.join(process.cwd(), 'temp');
    console.log('📁 Temp directory:', tempDir);
    
    if (!fs.existsSync(tempDir)) {
      console.log('📁 Temp directory oluşturuluyor...');
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Unique filename
    const timestamp = Date.now();
    const outputPath = path.join(tempDir, `video-${timestamp}.mp4`);
    console.log('📝 Output path:', outputPath);

    // yt-dlp ile video indir
    console.log('⬇️ yt-dlp başlatılıyor...');
    const result = await ytdl(url, {
      output: outputPath,
      format: 'best[ext=mp4]/best', // MP4 formatını tercih et
      maxFilesize: '100M', // Max 100MB
      noCheckCertificates: true, // SSL sertifika kontrolünü atla
    });

    console.log('✅ Video indirildi:', outputPath);
    console.log('📊 yt-dlp result:', result);

    // Video dosyasını oku
    const videoBuffer = fs.readFileSync(outputPath);
    const videoBase64 = videoBuffer.toString('base64');

    // Temp dosyayı sil
    fs.unlinkSync(outputPath);

    return NextResponse.json({
      success: true,
      video: videoBase64,
      filename: `downloaded-${timestamp}.mp4`,
    });
  } catch (error: any) {
    console.error('❌ Video indirme hatası:', error);
    return NextResponse.json(
      { 
        error: 'Video indirilemedi', 
        details: error.message,
      },
      { status: 500 }
    );
  }
}
