import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const favorites = db.prepare(`
      SELECT p.*, f.created_at as favorited_at,
        (SELECT COUNT(*) FROM favorites WHERE property_id = p.id) as likes_count
      FROM favorites f
      JOIN properties p ON f.property_id = p.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `).all(user.id) as Array<Record<string, unknown>>;

    // Attach images to each property
    const favoritesWithImages = favorites.map((prop) => {
      const images = db.prepare(
        'SELECT id, filename, original_name, is_cover FROM property_images WHERE property_id = ? ORDER BY is_cover DESC'
      ).all(prop.id) as Array<{ id: number; filename: string; original_name: string; is_cover: number }>;

      const coverImage = images.find(img => img.is_cover) || images[0];

      return {
        ...prop,
        images,
        coverImage: coverImage?.filename || null,
      };
    });

    return NextResponse.json({ favorites: favoritesWithImages });
  } catch (error) {
    console.error('Favorites GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { property_id } = await request.json();
    if (!property_id) {
      return NextResponse.json({ error: 'property_id is required' }, { status: 400 });
    }

    // Check if already favorited
    const existing = db.prepare(
      'SELECT id FROM favorites WHERE user_id = ? AND property_id = ?'
    ).get(user.id, property_id) as { id: number } | undefined;

    if (existing) {
      // Unfavorite
      db.prepare('DELETE FROM favorites WHERE id = ?').run(existing.id);
    } else {
      // Favorite
      db.prepare(
        'INSERT INTO favorites (user_id, property_id) VALUES (?, ?)'
      ).run(user.id, property_id);
    }

    const likesCount = db.prepare(
      'SELECT COUNT(*) as count FROM favorites WHERE property_id = ?'
    ).get(property_id) as { count: number };

    return NextResponse.json({
      favorited: !existing,
      likes_count: likesCount.count,
    });
  } catch (error) {
    console.error('Favorites POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
