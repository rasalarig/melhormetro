import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getOne, query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PUT /api/admin/tours/[tourId]/moderate
// Body: { moderation_status: 'approved'|'rejected', reason?: string }
// Admin-only: override the moderation status of a tour.
export async function PUT(
  request: NextRequest,
  { params }: { params: { tourId: string } }
) {
  const user = await getCurrentUser();
  if (!user || !user.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const tourId = parseInt(params.tourId, 10);
  if (isNaN(tourId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const tour = await getOne('SELECT * FROM property_tours WHERE id = $1', [tourId]);
  if (!tour || tour.status === 'deleted') {
    return NextResponse.json({ error: 'Tour não encontrado' }, { status: 404 });
  }

  const body = await request.json();
  const { moderation_status, reason } = body;

  if (!['approved', 'rejected'].includes(moderation_status)) {
    return NextResponse.json({ error: 'Status inválido. Use "approved" ou "rejected".' }, { status: 400 });
  }

  // Build updated moderation_result with admin override info
  const previousResult = tour.moderation_result || {};
  const updatedResult = {
    ...previousResult,
    adminOverride: {
      status: moderation_status,
      reason: reason || null,
      overriddenBy: user.id,
      overriddenAt: new Date().toISOString(),
    },
  };

  await query(
    `UPDATE property_tours
     SET moderation_status = $1, moderation_result = $2, updated_at = NOW()
     WHERE id = $3`,
    [moderation_status, JSON.stringify(updatedResult), tourId]
  );

  return NextResponse.json({ moderation_status, tourId });
}
