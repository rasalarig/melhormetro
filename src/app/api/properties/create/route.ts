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
        { error: 'Você precisa estar logado para cadastrar um imóvel' },
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
        { error: 'Vendedor não encontrado. Faça login novamente.' },
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
      media_status,
      address_privacy = 'exact',
      approximate_radius_km = 1.0,
      allow_resale = false,
      resale_commission_percent,
      resale_terms,
      facade_orientation,
      condominium_id,
    } = body;

    if (!title || !description || !price || !area || !type || !address || !city) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    // Auto-set seller_id from authenticated user
    const property = await getOne(
      `INSERT INTO properties (title, description, price, area, type, address, city, state, neighborhood, characteristics, details, seller_id, media_status, address_privacy, approximate_radius_km, allow_resale, resale_commission_percent, resale_terms, facade_orientation, condominium_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
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
        media_status || 'ready',
        address_privacy || 'exact',
        approximate_radius_km || 1.0,
        allow_resale || false,
        resale_commission_percent != null ? resale_commission_percent : null,
        resale_terms || null,
        facade_orientation || null,
        condominium_id != null ? condominium_id : null,
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

    // Create the original tour for this new property
    try {
      const tour = await getOne(
        `INSERT INTO property_tours (property_id, title, status, moderation_status, is_original, created_by)
         VALUES ($1, $2, 'active', 'approved', TRUE, $3)
         RETURNING *`,
        [property.id, title, user.id]
      );

      if (tour) {
        // Migrate images into tour_media
        const allMedia = [
          ...(imageUrls || []).map((img: { url: string; is_cover?: boolean }, idx: number) => ({
            url: img.url?.trim(),
            type: 'image' as const,
            order: idx,
          })),
          ...(video_urls || []).map((url: string, idx: number) => {
            const trimmed = url?.trim() || '';
            let mtype: string = 'video';
            if (/youtube\.com|youtu\.be/i.test(trimmed)) mtype = 'youtube';
            else if (/tiktok\.com/i.test(trimmed)) mtype = 'tiktok';
            else if (/instagram\.com/i.test(trimmed)) mtype = 'instagram';
            else if (/vimeo\.com/i.test(trimmed)) mtype = 'vimeo';
            return { url: trimmed, type: mtype, order: (imageUrls?.length || 0) + idx };
          }),
        ];

        for (const m of allMedia) {
          if (m.url) {
            await query(
              `INSERT INTO tour_media (tour_id, media_url, media_type, display_order)
               VALUES ($1, $2, $3, $4)`,
              [tour.id, m.url, m.type, m.order]
            );
          }
        }
      }
    } catch (err) {
      console.error('Error creating original tour:', err);
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
      { error: 'Falha ao cadastrar imóvel' },
      { status: 500 }
    );
  }
}
