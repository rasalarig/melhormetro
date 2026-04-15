import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAll, getOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/admin/tours?status=all|pending|approved|rejected&page=1&limit=20
// Admin-only: list all tours with their moderation status and property info.
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'all';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const offset = (page - 1) * limit;

  const validStatuses = ['pending', 'approved', 'rejected'];
  const statusFilter = validStatuses.includes(status) ? status : null;

  const whereClause = statusFilter
    ? `WHERE pt.status != 'deleted' AND pt.moderation_status = '${statusFilter}'`
    : `WHERE pt.status != 'deleted'`;

  const tours = await getAll(
    `SELECT
       pt.id,
       pt.property_id,
       pt.title,
       pt.description,
       pt.status,
       pt.moderation_status,
       pt.moderation_result,
       pt.is_original,
       pt.created_at,
       pt.updated_at,
       p.title as property_title,
       p.city as property_city,
       p.state as property_state,
       u.name as seller_name,
       u.email as seller_email,
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
     JOIN properties p ON p.id = pt.property_id
     LEFT JOIN sellers s ON s.id = p.seller_id
     LEFT JOIN users u ON u.id = s.user_id
     ${whereClause}
     ORDER BY
       CASE pt.moderation_status WHEN 'pending' THEN 0 WHEN 'rejected' THEN 1 ELSE 2 END,
       pt.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const countRow = await getOne(
    `SELECT COUNT(*) as total FROM property_tours pt ${whereClause}`,
    []
  );
  const total = parseInt(countRow?.total || '0', 10);

  return NextResponse.json({ tours, total, page, limit });
}
