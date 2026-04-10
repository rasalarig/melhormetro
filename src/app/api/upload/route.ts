import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { uploadToR2 } from '@/lib/r2';
import { convertToMp4 } from '@/lib/convert-video';

const MAX_SIZE_IMAGE = 10 * 1024 * 1024; // 10MB
const MAX_SIZE_VIDEO = 100 * 1024 * 1024; // 100MB
const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO = ['video/mp4', 'video/quicktime', 'video/webm'];

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const results = [];

    for (const file of files) {
      const isImage = ALLOWED_IMAGE.includes(file.type);
      const isVideo = ALLOWED_VIDEO.includes(file.type);

      if (!isImage && !isVideo) {
        return NextResponse.json(
          { error: `Tipo de arquivo não permitido: ${file.type}` },
          { status: 400 }
        );
      }

      const maxSize = isVideo ? MAX_SIZE_VIDEO : MAX_SIZE_IMAGE;
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `Arquivo ${file.name} excede o limite de ${isVideo ? '100MB' : '10MB'}` },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      let buffer = Buffer.from(bytes);
      const originalExt = file.name.split('.').pop()?.toLowerCase() || 'bin';

      let key: string;
      let contentType = file.type;

      if (isVideo && originalExt !== 'mp4') {
        // Convert to MP4 for universal browser compatibility
        const converted = await convertToMp4(buffer, originalExt);
        buffer = converted.buffer;
        contentType = converted.contentType;
        key = `${randomUUID()}.mp4`;
      } else {
        key = `${randomUUID()}.${originalExt}`;
      }

      const url = await uploadToR2(buffer, key, contentType);

      results.push({
        url,
        originalName: file.name,
        type: isImage ? 'image' : 'video',
      });
    }

    return NextResponse.json({ files: results });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Falha no upload' }, { status: 500 });
  }
}
