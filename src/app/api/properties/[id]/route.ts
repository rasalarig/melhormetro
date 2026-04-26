import { NextRequest, NextResponse } from 'next/server';
import { query, getOne, getAll } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { deleteFromR2 } from '@/lib/r2';

async function geocodeAddress(address: string, city: string, state: string): Promise<{ lat: number; lng: number } | null> {
  const googleKey = process.env.GOOGLE_MAPS_KEY;
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

export const dynamic = 'force-dynamic';

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
      address_privacy,
      approximate_radius_km,
      allow_resale,
      resale_commission_percent,
      resale_terms,
      facade_orientation,
      condominium_id,
      listing_as,
      is_exclusive,
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
        address_privacy = COALESCE($16, address_privacy),
        approximate_radius_km = COALESCE($17, approximate_radius_km),
        allow_resale = COALESCE($18, allow_resale),
        resale_commission_percent = COALESCE($19, resale_commission_percent),
        resale_terms = COALESCE($20, resale_terms),
        facade_orientation = COALESCE($21, facade_orientation),
        condominium_id = CASE WHEN $22::integer IS NOT NULL THEN $22::integer ELSE condominium_id END,
        listing_as = COALESCE($24, listing_as),
        is_exclusive = COALESCE($25, is_exclusive),
        exclusivity_months = COALESCE($26, exclusivity_months),
        listing_commission_rate = COALESCE($27, listing_commission_rate),
        updated_at = NOW()
      WHERE id = $23`,
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
        address_privacy || null,
        approximate_radius_km !== undefined ? approximate_radius_km : null,
        allow_resale !== undefined ? allow_resale : null,
        resale_commission_percent !== undefined ? resale_commission_percent : null,
        resale_terms !== undefined ? resale_terms : null,
        facade_orientation !== undefined ? (facade_orientation || null) : null,
        condominium_id !== undefined ? condominium_id : null,
        params.id,
        listing_as !== undefined ? (listing_as || null) : null,
        is_exclusive !== undefined ? is_exclusive : null,
        exclusivity_months !== undefined ? (exclusivity_months ? Number(exclusivity_months) : null) : null,
        listing_commission_rate !== undefined ? (listing_commission_rate != null ? Number(listing_commission_rate) : null) : null,
      ]
    );

    // Auto-geocode if address changed and no coordinates provided
    if ((address || city) && !latitude && !longitude) {
      const current = await getOne('SELECT address, city, state, latitude, longitude FROM properties WHERE id = $1', [params.id]);
      if (current && !current.latitude && !current.longitude) {
        const coords = await geocodeAddress(current.address, current.city, current.state);
        if (coords) {
          await query('UPDATE properties SET latitude = $1, longitude = $2 WHERE id = $3', [coords.lat, coords.lng, params.id]);
        }
      }
    }

    // Handle image updates if imageUrls is provided
    if (imageUrls && Array.isArray(imageUrls)) {
      // Fetch old filenames before deleting from DB
      const oldImages = await getAll(
        'SELECT filename FROM property_images WHERE property_id = $1',
        [params.id]
      ) as { filename: string }[];

      // Delete existing DB records
      await query('DELETE FROM property_images WHERE property_id = $1', [params.id]);

      // Insert new images
      const newUrls = new Set(imageUrls.map((img: { url: string }) => img.url.trim()));
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

      // Delete removed files from R2 (fire-and-forget, don't block response)
      for (const old of oldImages) {
        if (old.filename && !newUrls.has(old.filename)) {
          deleteFromR2(old.filename).catch((err) =>
            console.error('Failed to delete from R2:', old.filename, err)
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
    // Admin can delete any property
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    if (!user.is_admin) {
      const ownership = await verifyOwnership(params.id);
      if (ownership.error) return ownership.error;
    }

    // Fetch filenames before deleting
    const images = await getAll(
      'SELECT filename FROM property_images WHERE property_id = $1',
      [params.id]
    ) as { filename: string }[];

    await query('DELETE FROM properties WHERE id = $1', [params.id]);

    // Clean up R2 files (fire-and-forget)
    for (const img of images) {
      if (img.filename) {
        deleteFromR2(img.filename).catch((err) =>
          console.error('Failed to delete from R2:', img.filename, err)
        );
      }
    }

    return NextResponse.json({ message: 'Imóvel excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting property:', error);
    return NextResponse.json(
      { error: 'Failed to delete property' },
      { status: 500 }
    );
  }
}
