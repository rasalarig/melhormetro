import { NextRequest, NextResponse } from 'next/server';
import { getAll, getOne, query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { moderateTourImages } from '@/lib/moderation';

export const dynamic = 'force-dynamic';

// GET /api/properties/[id]/tours
// Returns all active+approved tours for the property (public).
// If requester is the property owner, also returns inactive/pending/rejected tours.
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const propertyId = parseInt(params.id, 10);
    if (isNaN(propertyId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const property = await getOne('SELECT * FROM properties WHERE id = $1', [propertyId]);
    if (!property) {
      return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 });
    }

    const user = await getCurrentUser();

    // Check if requester is the property owner
    let isOwner = false;
    if (user) {
      const seller = await getOne('SELECT id FROM sellers WHERE user_id = $1', [user.id]);
      if (seller && seller.id === property.seller_id) {
        isOwner = true;
      }
    }

    let tours;
    if (isOwner) {
      // Owner sees all non-deleted tours
      tours = await getAll(
        `SELECT pt.*,
          COALESCE(
            (SELECT json_agg(json_build_object(
              'id', tm.id,
              'media_url', tm.media_url,
              'media_type', tm.media_type,
              'display_order', tm.display_order
            ) ORDER BY tm.display_order ASC)
            FROM tour_media tm WHERE tm.tour_id = pt.id),
            '[]'::json
          ) as media
         FROM property_tours pt
         WHERE pt.property_id = $1 AND pt.status != 'deleted'
         ORDER BY pt.is_original DESC, pt.created_at ASC`,
        [propertyId]
      );
    } else {
      // Public sees only active + approved tours
      tours = await getAll(
        `SELECT pt.*,
          COALESCE(
            (SELECT json_agg(json_build_object(
              'id', tm.id,
              'media_url', tm.media_url,
              'media_type', tm.media_type,
              'display_order', tm.display_order
            ) ORDER BY tm.display_order ASC)
            FROM tour_media tm WHERE tm.tour_id = pt.id),
            '[]'::json
          ) as media
         FROM property_tours pt
         WHERE pt.property_id = $1 AND pt.status = 'active' AND pt.moderation_status = 'approved'
         ORDER BY pt.is_original DESC, pt.created_at ASC`,
        [propertyId]
      );
    }

    return NextResponse.json({ tours });
  } catch (error) {
    console.error('Error fetching tours:', error);
    return NextResponse.json({ error: 'Falha ao buscar tours' }, { status: 500 });
  }
}

// POST /api/properties/[id]/tours
// Create a new tour for the property (owner only).
// Body: { title?, description?, media: [{url, type}] }
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const propertyId = parseInt(params.id, 10);
    if (isNaN(propertyId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Autenticação necessária' }, { status: 401 });
    }

    const property = await getOne('SELECT * FROM properties WHERE id = $1', [propertyId]);
    if (!property) {
      return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 });
    }

    // Verify ownership
    const seller = await getOne('SELECT id FROM sellers WHERE user_id = $1', [user.id]);
    if (!seller || seller.id !== property.seller_id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, media } = body;

    // Create the tour with moderation_status = 'pending' (auto-moderation will run after)
    const tour = await getOne(
      `INSERT INTO property_tours (property_id, title, description, status, moderation_status, is_original, created_by)
       VALUES ($1, $2, $3, 'active', 'pending', FALSE, $4)
       RETURNING *`,
      [propertyId, title || null, description || null, user.id]
    );

    // Insert media items
    if (media && Array.isArray(media)) {
      for (let i = 0; i < media.length; i++) {
        const item = media[i];
        if (item.url && item.url.trim()) {
          await query(
            `INSERT INTO tour_media (tour_id, media_url, media_type, display_order)
             VALUES ($1, $2, $3, $4)`,
            [tour.id, item.url.trim(), item.type || 'image', i]
          );
        }
      }
    }

    // Fetch the created tour with its media
    const created = await getOne(
      `SELECT pt.*,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', tm.id,
            'media_url', tm.media_url,
            'media_type', tm.media_type,
            'display_order', tm.display_order
          ) ORDER BY tm.display_order ASC)
          FROM tour_media tm WHERE tm.tour_id = pt.id),
          '[]'::json
        ) as media
       FROM property_tours pt WHERE pt.id = $1`,
      [tour.id]
    );

    // Fire-and-forget: auto-moderate the tour images (non-original tours only)
    // We don't await this so the response is returned immediately
    moderateTourImages(tour.id).catch((err) =>
      console.error(`Auto-moderation failed for tour ${tour.id}:`, err)
    );

    return NextResponse.json({ tour: created }, { status: 201 });
  } catch (error) {
    console.error('Error creating tour:', error);
    return NextResponse.json({ error: 'Falha ao criar tour' }, { status: 500 });
  }
}
