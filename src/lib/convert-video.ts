import { writeFile, unlink, mkdtemp, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * Converts any video buffer to MP4 (H.264 + AAC).
 * Returns the converted buffer if input is not already MP4,
 * or the original buffer if it is.
 */
export async function convertToMp4(
  inputBuffer: Buffer,
  originalExt: string
): Promise<{ buffer: Buffer; ext: string; contentType: string }> {
  // Already MP4 — skip conversion
  if (originalExt === 'mp4') {
    return { buffer: inputBuffer, ext: 'mp4', contentType: 'video/mp4' };
  }

  const tempDir = await mkdtemp(path.join(tmpdir(), 'vid-'));
  const inputPath = path.join(tempDir, `input.${originalExt}`);
  const outputPath = path.join(tempDir, 'output.mp4');

  try {
    await writeFile(inputPath, inputBuffer);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-c:v', 'libx264',
          '-preset', 'fast',
          '-crf', '23',
          '-c:a', 'aac',
          '-b:a', '128k',
          '-movflags', '+faststart',
          '-pix_fmt', 'yuv420p',
        ])
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(err))
        .run();
    });

    const outputBuffer = await readFile(outputPath);
    return { buffer: outputBuffer, ext: 'mp4', contentType: 'video/mp4' };
  } finally {
    // Cleanup temp files
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});
  }
}
