import { NextRequest, NextResponse } from 'next/server';
import { query, getOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const property = await getOne(
      `SELECT p.*,
        COALESCE((SELECT json_agg(json_build_object(
          'id', pi.id,
          'filename', pi.filename,
          'original_name', pi.original_name,
          'is_cover', pi.is_cover
        )) FROM property_images pi WHERE pi.property_id = p.id), '[]'::json) as images
      FROM properties p
      WHERE p.id = $1`,
      [params.id]
    ) as Record<string, unknown> | null;

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    const parsed = {
      ...property,
      characteristics: property.characteristics
        ? JSON.parse(property.characteristics as string)
        : [],
      details: property.details ? JSON.parse(property.details as string) : {},
      images: typeof property.images === 'string' ? JSON.parse(property.images as string) : (property.images || []),
    };

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Error fetching property:', error);
    return NextResponse.json(
      { error: 'Failed to fetch property' },
      { status: 500 }
    );
  }
}

async function verifyOwnership(propertyId: string): Promise<{ error?: NextResponse; sellerId?: number }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) };
  }

  const seller = await getOne('SELECT id FROM sellers WHERE user_id = $1', [user.id]);
  if (!seller) {
    return { error: NextResponse.json({ error: 'Vendedor não encontrado' }, { status: 404 }) };
  }

  const property = await getOne(
    'SELECT * FROM properties WHERE id = $1',
    [propertyId]
  );

  if (!property) {
    return { error: NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 }) };
  }

  if (property.seller_id !== seller.id) {
    return { error: NextResponse.json({ error: 'Você não tem permissão para modificar este imóvel' }, { status: 403 }) };
  }

  return { sellerId: seller.id };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ownership = await verifyOwnership(params.id);
    if (ownership.error) return ownership.error;

    const body = await request.json();
    const {
      title,
      description,
      price,
      area,
      type,
      address,
      city,
      state,
      neighborhood,
      status,
      characteristics,
      details,
      latitude,
      longitude,
      imageUrls,
      video_urls,
      media_status,
    } = body;

    await query(
      `UPDATE properties SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        price = COALESCE($3, price),
        area = COALESCE($4, area),
        type = COALESCE($5, type),
        address = COALESCE($6, address),
        city = COALESCE($7, city),
        state = COALESCE($8, state),
        neighborhood = COALESCE($9, neighborhood),
        status = COALESCE($10, status),
        characteristics = COALESCE($11, characteristics),
        details = COALESCE($12, details),
        latitude = COALESCE($13, latitude),
        longitude = COALESCE($14, longitude),
        media_status = COALESCE($15, media_status),
        updated_at = NOW()
      WHERE id = $16`,
      [
        title || null,
        description || null,
        price || null,
        area || null,
        type || null,
        address || null,
        city || null,
        state || null,
        neighborhood || null,
        status || null,
        characteristics ? JSON.stringify(characteristics) : null,
        details ? JSON.stringify(details) : null,
        latitude !== undefined ? latitude : null,
        longitude !== undefined ? longitude : null,
        media_status || null,
        params.id,
      ]
    );

    // Handle image updates if imageUrls is provided
    if (imageUrls && Array.isArray(imageUrls)) {
      // Delete existing images
      await query('DELETE FROM property_images WHERE property_id = $1', [params.id]);

      // Insert new images
      for (const img of imageUrls) {
        if (img.url && img.url.trim()) {
          await query(
            `INSERT INTO property_images (property_id, filename, original_name, is_cover)
             VALUES ($1, $2, $3, $4)`,
            [
              params.id,
              img.url.trim(),
              img.url.trim().split('/').pop() || 'image',
              img.is_cover ? 1 : 0,
            ]
          );
        }
      }
    }

    // Insert video URLs into property_images
    if (video_urls && Array.isArray(video_urls) && video_urls.length > 0) {
      for (const videoUrl of video_urls) {
        if (videoUrl && typeof videoUrl === 'string' && videoUrl.trim()) {
          const trimmed = videoUrl.trim();
          let originalName = 'Video';
          if (/youtube\.com|youtu\.be/i.test(trimmed)) originalName = 'YouTube Video';
          else if (/tiktok\.com/i.test(trimmed)) originalName = 'TikTok Video';
          else if (/instagram\.com/i.test(trimmed)) originalName = 'Instagram Video';
          else if (/vimeo\.com/i.test(trimmed)) originalName = 'Vimeo Video';

          await query(
            `INSERT INTO property_images (property_id, filename, original_name, is_cover)
             VALUES ($1, $2, $3, $4)`,
            [params.id, trimmed, originalName, 0]
          );
        }
      }
    }

    const updated = await getOne(
      `SELECT p.*,
        COALESCE((SELECT json_agg(json_build_object(
          'id', pi.id,
          'filename', pi.filename,
          'original_name', pi.original_name,
          'is_cover', pi.is_cover
        )) FROM property_images pi WHERE pi.property_id = p.id), '[]'::json) as images
      FROM properties p
      WHERE p.id = $1`,
      [params.id]
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating property:', error);
    return NextResponse.json(
      { error: 'Failed to update property' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ownership = await verifyOwnership(params.id);
    if (ownership.error) return ownership.error;

    await query('DELETE FROM properties WHERE id = $1', [params.id]);

    return NextResponse.json({ message: 'Imóvel excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting property:', error);
    return NextResponse.json(
      { error: 'Failed to delete property' },
      { status: 500 }
    );
  }
}
