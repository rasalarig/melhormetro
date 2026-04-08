import { NextRequest, NextResponse } from 'next/server';
import { getOne, query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { checkAlertsForProperty } from '@/lib/alerts';

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Voce precisa estar logado para cadastrar um imovel' },
        { status: 401 }
      );
    }

    // Get seller record for the logged-in user
    const seller = await getOne(
      'SELECT * FROM sellers WHERE user_id = $1',
      [user.id]
    );

    if (!seller) {
      return NextResponse.json(
        { error: 'Vendedor nao encontrado. Faca login novamente.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      price,
      area,
      type,
      address,
      city,
      state = 'SP',
      neighborhood,
      characteristics,
      details,
      imageUrls,
      video_urls,
    } = body;

    if (!title || !description || !price || !area || !type || !address || !city) {
      return NextResponse.json(
        { error: 'Campos obrigatorios faltando' },
        { status: 400 }
      );
    }

    // Auto-set seller_id from authenticated user
    const property = await getOne(
      `INSERT INTO properties (title, description, price, area, type, address, city, state, neighborhood, characteristics, details, seller_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        title,
        description,
        price,
        area,
        type,
        address,
        city,
        state,
        neighborhood || null,
        characteristics ? JSON.stringify(characteristics) : null,
        details ? JSON.stringify(details) : null,
        seller.id,
      ]
    );

    // Insert image URLs into property_images
    if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
      for (const img of imageUrls) {
        if (img.url && img.url.trim()) {
          await query(
            `INSERT INTO property_images (property_id, filename, original_name, is_cover)
             VALUES ($1, $2, $3, $4)`,
            [
              property.id,
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
            [property.id, trimmed, originalName, 0]
          );
        }
      }
    }

    // Check alerts for the new property
    try {
      await checkAlertsForProperty(Number(property.id));
    } catch (err) {
      console.error('Error checking alerts for new property:', err);
    }

    return NextResponse.json({ property }, { status: 201 });
  } catch (error) {
    console.error('Error creating property:', error);
    return NextResponse.json(
      { error: 'Falha ao cadastrar imovel' },
      { status: 500 }
    );
  }
}
