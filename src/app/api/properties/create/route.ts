import { NextRequest, NextResponse } from 'next/server';
import { getOne, query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { checkAlertsForProperty } from '@/lib/alerts';

async function geocodeAddress(address: string, city: string, state: string): Promise<{ lat: number; lng: number } | null> {
  const googleKey = process.env.GOOGLE_MAPS_KEY;
  // Try Google Geocoding first
  if (googleKey) {
    try {
      const q = encodeURIComponent(`${address}, ${city}, ${state}, Brasil`);
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${q}&key=${googleKey}`);
      if (res.ok) {
        const data = await res.json();
        const loc = data.results?.[0]?.geometry?.location;
        if (loc) return { lat: loc.lat, lng: loc.lng };
      }
    } catch (err) {
      console.error('[Geocode Google] Error:', err);
    }
  }
  // Fallback: Nominatim
  try {
    const q = encodeURIComponent(`${address}, ${city}, ${state}, Brasil`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=br`, {
      headers: { 'User-Agent': 'MelhorMetro/1.0' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (err) {
    console.error('[Geocode Nominatim] Error:', err);
  }
  return null;
}

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
      condominium_name,
      listing_as,
      is_exclusive = false,
      exclusivity_months,
      listing_commission_rate,
    } = body;

    // Validate listing_as
    const validListingTypes = ['proprietario', 'autonomo', 'imobiliaria'];
    if (listing_as && !validListingTypes.includes(listing_as)) {
      return NextResponse.json(
        { error: 'Tipo de anunciante inválido' },
        { status: 400 }
      );
    }

    if (!title || !description || !price || !area || !type || !address || !city) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    // Auto-set seller_id from authenticated user
    const property = await getOne(
      `INSERT INTO properties (title, description, price, area, type, address, city, state, neighborhood, characteristics, details, seller_id, media_status, address_privacy, approximate_radius_km, allow_resale, resale_commission_percent, resale_terms, facade_orientation, condominium_name, listing_as, is_exclusive, exclusivity_months, listing_commission_rate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
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
        resale_commission_percent != null ? Math.min(100, Math.max(0, Number(resale_commission_percent))) : null,
        resale_terms || null,
        facade_orientation || null,
        condominium_name || null,
        listing_as || null,
        is_exclusive || false,
        listing_as === 'proprietario' && is_exclusive && exclusivity_months ? Number(exclusivity_months) : null,
        listing_as === 'proprietario' && listing_commission_rate != null ? Number(listing_commission_rate) : null,
      ]
    );

    // Auto-geocode address if no coordinates
    if (property && (!property.latitude || !property.longitude)) {
      const coords = await geocodeAddress(address, city, state);
      if (coords) {
        await query(
          'UPDATE properties SET latitude = $1, longitude = $2 WHERE id = $3',
          [coords.lat, coords.lng, property.id]
        );
        property.latitude = coords.lat;
        property.longitude = coords.lng;
      }
    }

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
