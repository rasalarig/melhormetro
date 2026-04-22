import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query, getOne, getAll } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clean up favorites for removed/unapproved properties
    await query(`
      DELETE FROM favorites WHERE user_id = $1 AND property_id NOT IN (
        SELECT id FROM properties WHERE status = 'active' AND (approved = 'approved' OR approved IS NULL)
      )
    `, [user.id]);

    const favorites = await getAll(`
      SELECT p.*, f.created_at as favorited_at,
        (SELECT COUNT(*) FROM favorites WHERE property_id = p.id) as likes_count
      FROM favorites f
      JOIN properties p ON f.property_id = p.id
      WHERE f.user_id = $1
        AND p.status = 'active'
        AND (p.approved = 'approved' OR p.approved IS NULL)
      ORDER BY f.created_at DESC
    `, [user.id]) as Array<Record<string, unknown>>;

    // Attach images to each property
    const favoritesWithImages = [];
    for (const prop of favorites) {
      const images = await getAll(
        'SELECT id, filename, original_name, is_cover FROM property_images WHERE property_id = $1 ORDER BY is_cover DESC',
        [prop.id]
      ) as Array<{ id: number; filename: string; original_name: string; is_cover: number }>;

      const coverImage = images.find(img => img.is_cover) || images[0];

      favoritesWithImages.push({
        ...prop,
        images,
        coverImage: coverImage?.filename || null,
      });
    }

    return NextResponse.json({ favorites: favoritesWithImages });
  } catch (error) {
    console.error('Favorites GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { property_id } = await request.json();
    if (!property_id) {
      return NextResponse.json({ error: 'property_id is required' }, { status: 400 });
    }

    // Check if already favorited
    const existing = await getOne(
      'SELECT id FROM favorites WHERE user_id = $1 AND property_id = $2',
      [user.id, property_id]
    ) as { id: number } | null;

    if (existing) {
      // Unfavorite
      await query('DELETE FROM favorites WHERE id = $1', [existing.id]);
    } else {
      // Favorite
      await query(
        'INSERT INTO favorites (user_id, property_id) VALUES ($1, $2)',
        [user.id, property_id]
      );
    }

    const likesCount = await getOne(
      'SELECT COUNT(*) as count FROM favorites WHERE property_id = $1',
      [property_id]
    ) as { count: string };

    return NextResponse.json({
      favorited: !existing,
      likes_count: parseInt(likesCount.count, 10),
    });
  } catch (error) {
    console.error('Favorites POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
