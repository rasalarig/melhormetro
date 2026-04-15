import { NextRequest, NextResponse } from 'next/server';
import { getOne, query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { moderateTourImages } from '@/lib/moderation';

export const dynamic = 'force-dynamic';

// GET /api/tours/[tourId]
// Returns a single tour with its media. Public access for approved/active tours.
export async function GET(
  _request: NextRequest,
  { params }: { params: { tourId: string } }
) {
  try {
    const tourId = parseInt(params.tourId, 10);
    if (isNaN(tourId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const tour = await getOne(
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
      [tourId]
    );

    if (!tour) {
      return NextResponse.json({ error: 'Tour não encontrado' }, { status: 404 });
    }

    // Check visibility for non-owners
    const user = await getCurrentUser();
    let isOwner = false;
    if (user) {
      const seller = await getOne(
        `SELECT s.id FROM sellers s
         JOIN properties p ON p.seller_id = s.id
         WHERE s.user_id = $1 AND p.id = $2`,
        [user.id, tour.property_id]
      );
      if (seller) isOwner = true;
    }

    if (!isOwner && (tour.status !== 'active' || tour.moderation_status !== 'approved')) {
      return NextResponse.json({ error: 'Tour não disponível' }, { status: 404 });
    }

    return NextResponse.json({ tour });
  } catch (error) {
    console.error('Error fetching tour:', error);
    return NextResponse.json({ error: 'Falha ao buscar tour' }, { status: 500 });
  }
}

// PUT /api/tours/[tourId]
// Update tour title, description, and/or media. Owner only.
// Body: { title?, description?, media?: [{url, type}] }
export async function PUT(
  request: NextRequest,
  { params }: { params: { tourId: string } }
) {
  try {
    const tourId = parseInt(params.tourId, 10);
    if (isNaN(tourId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Autenticação necessária' }, { status: 401 });
    }

    const tour = await getOne('SELECT * FROM property_tours WHERE id = $1', [tourId]);
    if (!tour || tour.status === 'deleted') {
      return NextResponse.json({ error: 'Tour não encontrado' }, { status: 404 });
    }

    // Verify ownership
    const seller = await getOne(
      `SELECT s.id FROM sellers s
       JOIN properties p ON p.seller_id = s.id
       WHERE s.user_id = $1 AND p.id = $2`,
      [user.id, tour.property_id]
    );
    if (!seller) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, media } = body;

    // Update tour fields
    await query(
      `UPDATE property_tours
       SET title = $1, description = $2, updated_at = NOW()
       WHERE id = $3`,
      [title !== undefined ? title : tour.title, description !== undefined ? description : tour.description, tourId]
    );

    // If media array is provided, replace all tour_media and re-trigger moderation
    const mediaWasUpdated = media && Array.isArray(media);
    if (mediaWasUpdated) {
      // Reset moderation status to pending since images changed
      await query(
        `UPDATE property_tours SET moderation_status = 'pending', moderation_result = NULL WHERE id = $1`,
        [tourId]
      );
      await query('DELETE FROM tour_media WHERE tour_id = $1', [tourId]);
      for (let i = 0; i < media.length; i++) {
        const item = media[i];
        if (item.url && item.url.trim()) {
          await query(
            `INSERT INTO tour_media (tour_id, media_url, media_type, display_order)
             VALUES ($1, $2, $3, $4)`,
            [tourId, item.url.trim(), item.type || 'image', i]
          );
        }
      }
    }

    // Fetch updated tour with media
    const updated = await getOne(
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
      [tourId]
    );

    // Fire-and-forget re-moderation if media changed (non-original tours only)
    if (mediaWasUpdated && !tour.is_original) {
      moderateTourImages(tourId).catch((err) =>
        console.error(`Re-moderation failed for tour ${tourId}:`, err)
      );
    }

    return NextResponse.json({ tour: updated });
  } catch (error) {
    console.error('Error updating tour:', error);
    return NextResponse.json({ error: 'Falha ao atualizar tour' }, { status: 500 });
  }
}

// DELETE /api/tours/[tourId]
// Soft-delete a tour (sets status = 'deleted'). Owner only. Cannot delete the original tour.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { tourId: string } }
) {
  try {
    const tourId = parseInt(params.tourId, 10);
    if (isNaN(tourId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Autenticação necessária' }, { status: 401 });
    }

    const tour = await getOne('SELECT * FROM property_tours WHERE id = $1', [tourId]);
    if (!tour || tour.status === 'deleted') {
      return NextResponse.json({ error: 'Tour não encontrado' }, { status: 404 });
    }

    if (tour.is_original) {
      return NextResponse.json(
        { error: 'O tour original não pode ser excluído' },
        { status: 400 }
      );
    }

    // Verify ownership
    const seller = await getOne(
      `SELECT s.id FROM sellers s
       JOIN properties p ON p.seller_id = s.id
       WHERE s.user_id = $1 AND p.id = $2`,
      [user.id, tour.property_id]
    );
    if (!seller) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    await query(
      `UPDATE property_tours SET status = 'deleted', updated_at = NOW() WHERE id = $1`,
      [tourId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tour:', error);
    return NextResponse.json({ error: 'Falha ao excluir tour' }, { status: 500 });
  }
}
