/**
 * Video Preprocessing Service
 * FFmpeg wrapper for video analysis preparation
 */

import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface VideoMetadata {
  duration: number;
  resolution: { width: number; height: number };
  fps: number;
  codec: string;
  bitrate: number;
  hasAudio: boolean;
}

export interface AudioFile {
  path: string;
  duration: number;
  format: string;
}

export interface Frame {
  path: string;
  timestamp: number;
  index: number;
}

export interface Thumbnail {
  path: string;
  timestamp: number;
}

export class VideoPreprocessor {
  private tempDir: string;

  constructor() {
    this.tempDir = path.join(os.tmpdir(), 'video-preprocessing');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Extract audio from video
   */
  async extractAudio(videoPath: string): Promise<AudioFile> {
    console.log('🎵 Extracting audio from video...');

    const outputPath = path.join(
      this.tempDir,
      `audio-${Date.now()}.wav`
    );

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .output(outputPath)
        .audioCodec('pcm_s16le')
        .audioFrequency(16000)
        .audioChannels(1)
        .on('end', () => {
          console.log('✅ Audio extracted:', outputPath);
          
          // Get audio duration
          ffmpeg.ffprobe(outputPath, (err, metadata) => {
            if (err) {
              reject(err);
              return;
            }

            resolve({
              path: outputPath,
              duration: metadata.format.duration || 0,
              format: 'wav',
            });
          });
        })
        .on('error', (err) => {
          console.error('❌ Audio extraction failed:', err);
          reject(new Error(`Audio extraction failed: ${err.message}`));
        })
        .run();
    });
  }

  /**
   * Extract frames from video at specified FPS
   */
  async extractFrames(videoPath: string, fps: number = 1): Promise<Frame[]> {
    console.log(`🎞️ Extracting frames at ${fps} fps...`);

    const framesDir = path.join(this.tempDir, `frames-${Date.now()}`);
    fs.mkdirSync(framesDir, { recursive: true });

    return new Promise((resolve, reject) => {
      const frames: Frame[] = [];
      let frameIndex = 0;

      ffmpeg(videoPath)
        .outputOptions([
          `-vf fps=${fps}`,
        ])
        .output(path.join(framesDir, 'frame-%04d.jpg'))
        .on('end', () => {
          // Read all generated frames
          const files = fs.readdirSync(framesDir);
          
          files.forEach((file, index) => {
            frames.push({
              path: path.join(framesDir, file),
              timestamp: index / fps,
              index: index,
            });
          });

          console.log(`✅ Extracted ${frames.length} frames`);
          resolve(frames);
        })
        .on('error', (err) => {
          console.error('❌ Frame extraction failed:', err);
          reject(new Error(`Frame extraction failed: ${err.message}`));
        })
        .run();
    });
  }

  /**
   * Generate thumbnails at key moments
   */
  async generateThumbnails(
    videoPath: string,
    count: number = 5
  ): Promise<Thumbnail[]> {
    console.log(`🖼️ Generating ${count} thumbnails...`);

    const metadata = await this.getMetadata(videoPath);
    const interval = metadata.duration / (count + 1);
    const thumbnails: Thumbnail[] = [];

    const thumbnailsDir = path.join(this.tempDir, `thumbnails-${Date.now()}`);
    fs.mkdirSync(thumbnailsDir, { recursive: true });

    for (let i = 1; i <= count; i++) {
      const timestamp = interval * i;
      const outputPath = path.join(thumbnailsDir, `thumb-${i}.jpg`);

      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
          .screenshots({
            timestamps: [timestamp],
            filename: `thumb-${i}.jpg`,
            folder: thumbnailsDir,
            size: '640x360',
          })
          .on('end', () => {
            thumbnails.push({
              path: outputPath,
              timestamp,
            });
            resolve();
          })
          .on('error', (err) => {
            console.error(`❌ Thumbnail ${i} generation failed:`, err);
            reject(err);
          });
      });
    }

    console.log(`✅ Generated ${thumbnails.length} thumbnails`);
    return thumbnails;
  }

  /**
   * Get video metadata
   */
  async getMetadata(videoPath: string): Promise<VideoMetadata> {
    console.log('📊 Getting video metadata...');

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          console.error('❌ Metadata extraction failed:', err);
          reject(new Error(`Metadata extraction failed: ${err.message}`));
          return;
        }

        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

        if (!videoStream) {
          reject(new Error('No video stream found'));
          return;
        }

        const result: VideoMetadata = {
          duration: metadata.format.duration || 0,
          resolution: {
            width: videoStream.width || 0,
            height: videoStream.height || 0,
          },
          fps: this.parseFps(videoStream.r_frame_rate || '0/1'),
          codec: videoStream.codec_name || 'unknown',
          bitrate: metadata.format.bit_rate || 0,
          hasAudio: !!audioStream,
        };

        console.log('✅ Metadata extracted:', result);
        resolve(result);
      });
    });
  }

  /**
   * Parse FPS string (e.g., "30/1" -> 30)
   */
  private parseFps(fpsString: string): number {
    const [num, den] = fpsString.split('/').map(Number);
    return den ? num / den : num;
  }

  /**
   * Validate video file
   */
  async validateVideo(videoPath: string): Promise<{
    valid: boolean;
    error?: string;
  }> {
    try {
      const metadata = await this.getMetadata(videoPath);

      // Check duration
      if (metadata.duration > 600) {
        return {
          valid: false,
          error: 'Video too long (max 10 minutes)',
        };
      }

      // Check resolution
      if (metadata.resolution.width < 640 || metadata.resolution.height < 360) {
        return {
          valid: false,
          error: 'Video resolution too low (min 640x360)',
        };
      }

      // Check audio
      if (!metadata.hasAudio) {
        return {
          valid: false,
          error: 'Video has no audio track',
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Clean up temporary files
   */
  cleanup(paths: string[]): void {
    paths.forEach((filePath) => {
      try {
        if (fs.existsSync(filePath)) {
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            fs.rmSync(filePath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(filePath);
          }
          console.log('🗑️ Cleaned up:', filePath);
        }
      } catch (error) {
        console.warn('⚠️ Cleanup failed:', filePath, error);
      }
    });
  }

  /**
   * Get temp directory path
   */
  getTempDir(): string {
    return this.tempDir;
  }
}

// Singleton instance
export const videoPreprocessor = new VideoPreprocessor();
