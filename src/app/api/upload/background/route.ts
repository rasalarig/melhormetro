import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { uploadToR2 } from '@/lib/r2';
import { convertToMp4 } from '@/lib/convert-video';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const MAX_SIZE_IMAGE = 10 * 1024 * 1024;
const MAX_SIZE_VIDEO = 100 * 1024 * 1024;
const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO = ['video/mp4', 'video/quicktime', 'video/webm'];

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  let propertyId: string | null = null;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    propertyId = formData.get('propertyId') as string;
    const files = formData.getAll('files') as File[];

    if (!propertyId || !files.length) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    for (const file of files) {
      const isImage = ALLOWED_IMAGE.includes(file.type);
      const isVideo = ALLOWED_VIDEO.includes(file.type);

      if (!isImage && !isVideo) continue;

      const maxSize = isVideo ? MAX_SIZE_VIDEO : MAX_SIZE_IMAGE;
      if (file.size > maxSize) continue;

      const bytes = await file.arrayBuffer();
      let buffer = Buffer.from(bytes);
      const originalExt = file.name.split('.').pop()?.toLowerCase() || 'bin';

      let key: string;
      let contentType = file.type;

      if (isVideo && originalExt !== 'mp4') {
        const converted = await convertToMp4(buffer, originalExt);
        buffer = converted.buffer;
        contentType = converted.contentType;
        key = `${randomUUID()}.mp4`;
      } else {
        key = `${randomUUID()}.${originalExt}`;
      }

      const url = await uploadToR2(buffer, key, contentType);

      await query(
        `INSERT INTO property_images (property_id, filename, original_name, is_cover)
         VALUES ($1, $2, $3, $4)`,
        [propertyId, url, file.name, 0]
      );
    }

    // Mark property as ready
    await query('UPDATE properties SET media_status = $1 WHERE id = $2', ['ready', propertyId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Background upload error:', error);
    // Always mark as ready so property doesn't get stuck
    if (propertyId) {
      await query('UPDATE properties SET media_status = $1 WHERE id = $2', ['ready', propertyId]).catch(() => {});
    }
    return NextResponse.json({ error: 'Falha no upload' }, { status: 500 });
  }
}
