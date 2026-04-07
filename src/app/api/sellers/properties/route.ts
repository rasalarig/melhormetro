import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getOne, getAll } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    const seller = await getOne(
      'SELECT * FROM sellers WHERE user_id = $1',
      [user.id]
    );

    if (!seller) {
      return NextResponse.json({ error: 'Vendedor nao encontrado' }, { status: 404 });
    }

    const properties = await getAll(
      `SELECT p.*,
        COALESCE(img.images, '[]') AS images,
        COALESCE(eng.engagement_count, 0)::int AS engagement_count,
        COALESCE(eng.interested_users_count, 0)::int AS interested_users_count
      FROM properties p
      LEFT JOIN LATERAL (
        SELECT json_agg(
          json_build_object('id', pi.id, 'filename', pi.filename, 'original_name', pi.original_name, 'is_cover', pi.is_cover)
          ORDER BY pi.is_cover DESC, pi.id ASC
        ) AS images
        FROM property_images pi
        WHERE pi.property_id = p.id
      ) img ON true
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*)::int AS engagement_count,
          COUNT(DISTINCT ee.user_id)::int AS interested_users_count
        FROM engagement_events ee
        WHERE ee.property_id = p.id
      ) eng ON true
      WHERE p.seller_id = $1
      ORDER BY p.created_at DESC`,
      [seller.id]
    );

    // Parse images from JSON string if needed
    const parsed = properties.map((p: Record<string, unknown>) => ({
      ...p,
      images: typeof p.images === 'string' ? JSON.parse(p.images as string) : (p.images || []),
    }));

    return NextResponse.json({ properties: parsed });
  } catch (error) {
    console.error('Sellers properties GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
