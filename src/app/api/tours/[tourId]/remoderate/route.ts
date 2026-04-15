import { NextRequest, NextResponse } from 'next/server';
import { getOne, query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { moderateTourImages } from '@/lib/moderation';

export const dynamic = 'force-dynamic';

// POST /api/tours/[tourId]/remoderate
// Re-triggers automatic moderation for a rejected tour. Owner only.
export async function POST(
  _request: NextRequest,
  { params }: { params: { tourId: string } }
) {
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

  // Reset to pending
  await query(
    `UPDATE property_tours SET moderation_status = 'pending', moderation_result = NULL, updated_at = NOW() WHERE id = $1`,
    [tourId]
  );

  // Fire-and-forget moderation
  moderateTourImages(tourId).catch((err) =>
    console.error(`Re-moderation failed for tour ${tourId}:`, err)
  );

  return NextResponse.json({ success: true, moderation_status: 'pending' });
}
